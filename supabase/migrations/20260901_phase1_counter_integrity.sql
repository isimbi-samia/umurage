BEGIN;

-- ==============================================================================
-- MIGRATION: 20260901_phase1_counter_integrity.sql
-- DESCRIPTION: Phase 1 Counter & Trigger Integrity Repair
--   1. Removes redundant follow triggers and replaces with single authoritative trigger
--   2. Repairs comments_count trigger with NULL-safety and dynamic reconciliation
--   3. Dynamically reconciles all profile counters (followers, following, posts)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FOLLOW COUNTER SINGLE AUTHORITATIVE TRIGGER
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS follows_count_trigger ON public.follows;
DROP TRIGGER IF EXISTS trg_follow_counts_insert ON public.follows;
DROP TRIGGER IF EXISTS trg_follow_counts_delete ON public.follows;
DROP TRIGGER IF EXISTS trg_follows_counter_sync ON public.follows;

CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following_count for follower
    UPDATE public.profiles
    SET following_count = GREATEST(COALESCE(following_count, 0) + 1, 0)
    WHERE id = NEW.follower_id;

    -- Increment followers_count for followed user
    UPDATE public.profiles
    SET followers_count = GREATEST(COALESCE(followers_count, 0) + 1, 0)
    WHERE id = NEW.following_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following_count for follower safely
    UPDATE public.profiles
    SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
    WHERE id = OLD.follower_id;

    -- Decrement followers_count for followed user safely
    UPDATE public.profiles
    SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
    WHERE id = OLD.following_id;

    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_follows_counter_sync
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.update_follow_counts();

-- ------------------------------------------------------------------------------
-- 2. POST COMMENT COUNTER TRIGGER & RECONCILIATION
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS comments_count_trigger ON public.comments;
DROP TRIGGER IF EXISTS trg_comments_count_sync ON public.comments;

CREATE OR REPLACE FUNCTION public.update_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comments_count = GREATEST(COALESCE(comments_count, 0) + 1, 0)
    WHERE id = NEW.post_id;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.post_id IS DISTINCT FROM NEW.post_id THEN
      IF OLD.post_id IS NOT NULL THEN
        UPDATE public.posts
        SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
        WHERE id = OLD.post_id;
      END IF;
      IF NEW.post_id IS NOT NULL THEN
        UPDATE public.posts
        SET comments_count = GREATEST(COALESCE(comments_count, 0) + 1, 0)
        WHERE id = NEW.post_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_comments_count_sync
AFTER INSERT OR DELETE OR UPDATE OF post_id ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_comment_count();

-- Reconcile posts comments_count dynamically for all posts in database
UPDATE public.posts p
SET comments_count = COALESCE((
  SELECT count(*)::int
  FROM public.comments c
  WHERE c.post_id = p.id
), 0);

-- ------------------------------------------------------------------------------
-- 3. DYNAMIC PROFILE COUNTER RECONCILIATION FOR ALL USERS
-- ------------------------------------------------------------------------------
UPDATE public.profiles p
SET 
  followers_count = COALESCE((
    SELECT count(*)::int
    FROM public.follows f
    WHERE f.following_id = p.id
  ), 0),
  following_count = COALESCE((
    SELECT count(*)::int
    FROM public.follows f
    WHERE f.follower_id = p.id
  ), 0),
  posts_count = COALESCE((
    SELECT count(*)::int
    FROM public.posts po
    WHERE po.user_id = p.id
      AND po.published = true
      AND po.type IS DISTINCT FROM 'story'
  ), 0);

COMMIT;
