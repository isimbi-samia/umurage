BEGIN;

-- Migration: 20260831_profile_social_counters_sync.sql
-- Purpose: Real-time Profile Counters Synchronization (Followers, Following, Non-Story Posts) and Follow Constraints

-- =============================================================================
-- 1. CONSTRAINTS ON FOLLOWS TABLE
-- =============================================================================

-- Ensure unique follower-following relationship
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_follower_following'
  ) THEN
    ALTER TABLE public.follows 
    ADD CONSTRAINT unique_follower_following UNIQUE (follower_id, following_id);
  END IF;
END $$;

-- Prevent users from following themselves
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_not_self_follow'
  ) THEN
    ALTER TABLE public.follows 
    ADD CONSTRAINT check_not_self_follow CHECK (follower_id <> following_id);
  END IF;
END $$;

-- =============================================================================
-- 2. DROP OLD/CONFLICTING TRIGGERS & FUNCTIONS
-- =============================================================================

DROP TRIGGER IF EXISTS after_post_insert ON public.posts;
DROP TRIGGER IF EXISTS trg_follow_counts_insert ON public.follows;
DROP TRIGGER IF EXISTS trg_follow_counts_delete ON public.follows;
DROP TRIGGER IF EXISTS trg_posts_count_insert ON public.posts;
DROP TRIGGER IF EXISTS trg_posts_count_delete ON public.posts;
DROP TRIGGER IF EXISTS trg_posts_count_update ON public.posts;

-- =============================================================================
-- 3. FOLLOW / UNFOLLOW TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_follow_counts_insert
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_follow_counts();

CREATE TRIGGER trg_follow_counts_delete
  AFTER DELETE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_follow_counts();

-- =============================================================================
-- 4. POSTS COUNT TRIGGER FUNCTION (EXCLUDES STORIES & UNPUBLISHED)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_user_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF (NEW.type IS DISTINCT FROM 'story') AND (NEW.published IS NOT FALSE) THEN
      UPDATE public.profiles
      SET posts_count = GREATEST(COALESCE(posts_count, 0) + 1, 0)
      WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    IF (OLD.type IS DISTINCT FROM 'story') AND (OLD.published IS NOT FALSE) THEN
      UPDATE public.profiles
      SET posts_count = GREATEST(COALESCE(posts_count, 0) - 1, 0)
      WHERE id = OLD.user_id;
    END IF;
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle changes in user ownership, type (e.g. story vs normal), or published status
    DECLARE
      old_is_valid boolean := (OLD.type IS DISTINCT FROM 'story') AND (OLD.published IS NOT FALSE);
      new_is_valid boolean := (NEW.type IS DISTINCT FROM 'story') AND (NEW.published IS NOT FALSE);
    BEGIN
      IF OLD.user_id = NEW.user_id THEN
        IF old_is_valid AND NOT new_is_valid THEN
          UPDATE public.profiles
          SET posts_count = GREATEST(COALESCE(posts_count, 0) - 1, 0)
          WHERE id = NEW.user_id;
        ELSIF NOT old_is_valid AND new_is_valid THEN
          UPDATE public.profiles
          SET posts_count = GREATEST(COALESCE(posts_count, 0) + 1, 0)
          WHERE id = NEW.user_id;
        END IF;
      ELSE
        IF old_is_valid THEN
          UPDATE public.profiles
          SET posts_count = GREATEST(COALESCE(posts_count, 0) - 1, 0)
          WHERE id = OLD.user_id;
        END IF;
        IF new_is_valid THEN
          UPDATE public.profiles
          SET posts_count = GREATEST(COALESCE(posts_count, 0) + 1, 0)
          WHERE id = NEW.user_id;
        END IF;
      END IF;
    END;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_posts_count_insert
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_post_count();

CREATE TRIGGER trg_posts_count_delete
  AFTER DELETE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_post_count();

CREATE TRIGGER trg_posts_count_update
  AFTER UPDATE OF user_id, type, published ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_post_count();

-- =============================================================================
-- 5. RECONCILIATION OF EXISTING PROFILES (DYNAMIC CALCULATION)
-- =============================================================================

-- Reconcile followers_count dynamically
UPDATE public.profiles p
SET followers_count = (
  SELECT COUNT(*)::integer
  FROM public.follows f
  WHERE f.following_id = p.id
);

-- Reconcile following_count dynamically
UPDATE public.profiles p
SET following_count = (
  SELECT COUNT(*)::integer
  FROM public.follows f
  WHERE f.follower_id = p.id
);

-- Reconcile posts_count dynamically (normal public posts, excluding stories)
UPDATE public.profiles p
SET posts_count = (
  SELECT COUNT(*)::integer
  FROM public.posts po
  WHERE po.user_id = p.id
    AND (po.type IS DISTINCT FROM 'story')
    AND (po.published IS NOT FALSE)
);

COMMIT;
