-- ==============================================================================
-- UMURAGE HUB — PHASE 3 DATABASE REPAIR & INTEGRITY MIGRATION
-- Atomic conversation RPC with concurrency advisory lock, timestamps,
-- discussion counters, activity notification triggers, and performance indexes.
-- ==============================================================================

BEGIN;

-- 1. CONCURRENCY-SAFE ATOMIC 1-TO-1 CONVERSATION CREATION / RETRIEVAL RPC
CREATE OR REPLACE FUNCTION public.create_or_get_conversation(p_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id uuid;
  v_conversation_id uuid;
BEGIN
  -- 1. Authentication check
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Self-conversation prevention
  IF v_current_user_id = p_other_user_id THEN
    RAISE EXCEPTION 'Cannot start a conversation with yourself';
  END IF;

  -- 3. Verify target user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_other_user_id) THEN
    RAISE EXCEPTION 'Target user does not exist';
  END IF;

  -- 4. Concurrency lock on sorted pair of user UUIDs to prevent race conditions
  PERFORM pg_advisory_xact_lock(
    hashtext(least(v_current_user_id::text, p_other_user_id::text) || ':' || greatest(v_current_user_id::text, p_other_user_id::text))
  );

  -- 5. Check for existing 1-to-1 conversation containing both users
  SELECT cm1.conversation_id INTO v_conversation_id
  FROM public.conversation_members cm1
  JOIN public.conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
  WHERE cm1.user_id = v_current_user_id
    AND cm2.user_id = p_other_user_id
    AND (
      SELECT count(*) 
      FROM public.conversation_members cm3 
      WHERE cm3.conversation_id = cm1.conversation_id
    ) = 2
  LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- 6. Create new conversation row
  INSERT INTO public.conversations (created_at, updated_at)
  VALUES (now(), now())
  RETURNING id INTO v_conversation_id;

  -- 7. Insert both member rows atomically
  INSERT INTO public.conversation_members (conversation_id, user_id, joined_at)
  VALUES 
    (v_conversation_id, v_current_user_id, now()),
    (v_conversation_id, p_other_user_id, now());

  RETURN v_conversation_id;
END;
$$;

-- Security permissions hardening
REVOKE ALL ON FUNCTION public.create_or_get_conversation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_or_get_conversation(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_or_get_conversation(uuid) TO authenticated;

-- 2. CONVERSATION UPDATED_AT TRIGGER ON MESSAGE INSERT
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = COALESCE(NEW.created_at, now())
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_update_conversation_timestamp ON public.messages;
CREATE TRIGGER trg_messages_update_conversation_timestamp
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();

-- 3. DISCUSSION REPLIES COUNTER TRIGGER
CREATE OR REPLACE FUNCTION public.update_discussion_replies_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_topic_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_topic_id := NEW.topic_id;
  ELSE
    v_topic_id := OLD.topic_id;
  END IF;

  IF v_topic_id IS NOT NULL THEN
    UPDATE public.discussion_topics
    SET replies_count = (
      SELECT count(*) 
      FROM public.discussion_replies 
      WHERE topic_id = v_topic_id
    ),
    updated_at = now()
    WHERE id = v_topic_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_discussion_replies_count ON public.discussion_replies;
CREATE TRIGGER trg_discussion_replies_count
AFTER INSERT OR DELETE ON public.discussion_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_discussion_replies_count();

-- 4. DISCUSSION VOTES COUNTER TRIGGER
CREATE OR REPLACE FUNCTION public.update_discussion_votes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_topic_id uuid;
  v_reply_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_topic_id := OLD.topic_id;
    v_reply_id := OLD.reply_id;
  ELSE
    v_topic_id := NEW.topic_id;
    v_reply_id := NEW.reply_id;
  END IF;

  -- Reconcile topic votes
  IF v_topic_id IS NOT NULL THEN
    UPDATE public.discussion_topics
    SET votes = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 WHEN vote_type = 'down' THEN -1 ELSE 0 END), 0)
      FROM public.discussion_votes
      WHERE topic_id = v_topic_id
    )
    WHERE id = v_topic_id;
  END IF;

  -- Reconcile reply votes if applicable
  IF v_reply_id IS NOT NULL THEN
    UPDATE public.discussion_replies
    SET votes = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 WHEN vote_type = 'down' THEN -1 ELSE 0 END), 0)
      FROM public.discussion_votes
      WHERE reply_id = v_reply_id
    )
    WHERE id = v_reply_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_discussion_votes_count ON public.discussion_votes;
CREATE TRIGGER trg_discussion_votes_count
AFTER INSERT OR UPDATE OR DELETE ON public.discussion_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_discussion_votes_count();

-- 5. AUTOMATIC NOTIFICATION TRIGGERS (FOLLOW, LIKE, COMMENT, DISCUSSION REPLY)

-- Follow Notification Trigger
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name text;
BEGIN
  IF NEW.follower_id <> NEW.following_id THEN
    SELECT COALESCE(full_name, username, 'Someone') INTO v_actor_name
    FROM public.public_profiles
    WHERE id = NEW.follower_id;

    INSERT INTO public.notifications (user_id, actor_id, type, message, read, created_at)
    VALUES (
      NEW.following_id,
      NEW.follower_id,
      'follow',
      COALESCE(v_actor_name, 'A user') || ' started following you.',
      false,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_follow ON public.follows;
CREATE TRIGGER trg_notify_on_follow
AFTER INSERT ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_follow();

-- Like Notification Trigger
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_owner_id uuid;
  v_actor_name text;
BEGIN
  SELECT user_id INTO v_post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;

  IF v_post_owner_id IS NOT NULL AND v_post_owner_id <> NEW.user_id THEN
    SELECT COALESCE(full_name, username, 'Someone') INTO v_actor_name
    FROM public.public_profiles
    WHERE id = NEW.user_id;

    INSERT INTO public.notifications (user_id, actor_id, type, post_id, message, read, created_at)
    VALUES (
      v_post_owner_id,
      NEW.user_id,
      'like',
      NEW.post_id,
      COALESCE(v_actor_name, 'A user') || ' liked your post.',
      false,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_like ON public.likes;
CREATE TRIGGER trg_notify_on_like
AFTER INSERT ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_like();

-- Comment Notification Trigger
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_owner_id uuid;
  v_actor_name text;
BEGIN
  SELECT user_id INTO v_post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;

  IF v_post_owner_id IS NOT NULL AND v_post_owner_id <> NEW.user_id THEN
    SELECT COALESCE(full_name, username, 'Someone') INTO v_actor_name
    FROM public.public_profiles
    WHERE id = NEW.user_id;

    INSERT INTO public.notifications (user_id, actor_id, type, post_id, comment_id, message, read, created_at)
    VALUES (
      v_post_owner_id,
      NEW.user_id,
      'comment',
      NEW.post_id,
      NEW.id,
      COALESCE(v_actor_name, 'A user') || ' commented on your post: "' || LEFT(NEW.content, 40) || '"',
      false,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_comment ON public.comments;
CREATE TRIGGER trg_notify_on_comment
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_comment();

-- Discussion Reply Notification Trigger
CREATE OR REPLACE FUNCTION public.notify_on_discussion_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_topic_owner_id uuid;
  v_actor_name text;
BEGIN
  SELECT user_id INTO v_topic_owner_id
  FROM public.discussion_topics
  WHERE id = NEW.topic_id;

  IF v_topic_owner_id IS NOT NULL AND v_topic_owner_id <> NEW.user_id THEN
    SELECT COALESCE(full_name, username, 'Someone') INTO v_actor_name
    FROM public.public_profiles
    WHERE id = NEW.user_id;

    INSERT INTO public.notifications (user_id, actor_id, type, topic_id, message, read, created_at)
    VALUES (
      v_topic_owner_id,
      NEW.user_id,
      'reply',
      NEW.topic_id,
      COALESCE(v_actor_name, 'A user') || ' replied to your discussion topic: "' || LEFT(NEW.content, 40) || '"',
      false,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_discussion_reply ON public.discussion_replies;
CREATE TRIGGER trg_notify_on_discussion_reply
AFTER INSERT ON public.discussion_replies
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_discussion_reply();

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_cm_user_conversation ON public.conversation_members(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_topic ON public.discussion_replies(topic_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_discussion_votes_topic ON public.discussion_votes(topic_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- 7. RECONCILE EXISTING DISCUSSION DATA
UPDATE public.discussion_topics t
SET replies_count = (
  SELECT count(*) 
  FROM public.discussion_replies r 
  WHERE r.topic_id = t.id
),
votes = (
  SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 WHEN vote_type = 'down' THEN -1 ELSE 0 END), 0)
  FROM public.discussion_votes v
  WHERE v.topic_id = t.id
);

COMMIT;
