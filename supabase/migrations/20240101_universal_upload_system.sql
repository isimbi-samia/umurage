-- Universal Upload System Migration
-- Adds support for document content type, improves storage policies, and realtime triggers

-- 1. Add 'document' to post_type enum
DO $$ BEGIN
  CREATE TYPE public.post_type AS ENUM ('image', 'video', 'audio', 'document', 'article');
EXCEPTION
  WHEN duplicate_object THEN
    BEGIN
      ALTER TYPE public.post_type ADD VALUE IF NOT EXISTS 'document';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 2. Ensure realtime is enabled for posts table
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. Storage bucket policies for umurage-media
DROP POLICY IF EXISTS "Authenticated users can upload media to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own media" ON storage.objects;

-- Policy: Allow authenticated uploads to own folder path
CREATE POLICY "Authenticated users can upload media to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'umurage-media'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to media
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
USING (bucket_id = 'umurage-media');

-- Policy: Allow authenticated users to update own media
CREATE POLICY "Authenticated users can update own media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'umurage-media'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete own media
CREATE POLICY "Authenticated users can delete own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'umurage-media'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Notification trigger for new posts (alerts followers)
CREATE OR REPLACE FUNCTION public.create_post_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.published = true THEN
    INSERT INTO notifications (user_id, type, actor_id, post_id, message, read, created_at)
    SELECT 
      f.follower_id,
      'follow',
      NEW.user_id,
      NEW.id,
      COALESCE((SELECT username FROM profiles WHERE id = NEW.user_id), 'Someone') || ' published: ' || LEFT(NEW.title, 60),
      false,
      now()
    FROM follows f
    WHERE f.following_id = NEW.user_id
      AND f.follower_id <> NEW.user_id
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_published ON public.posts;
CREATE TRIGGER on_post_published
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.create_post_notification();

-- 5. Auto-update post counts on user profile
CREATE OR REPLACE FUNCTION public.update_user_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET posts_count = COALESCE(posts_count, 0) + 1
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET posts_count = GREATEST(COALESCE(posts_count, 0) - 1, 0)
    WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS after_post_insert ON public.posts;
CREATE TRIGGER after_post_insert
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_user_post_count();

-- 6. Enable realtime on notifications and heritage_recordings tables
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.heritage_recordings; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 7. Ensure realtime for profiles
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 8. Storage bucket setup note
-- The umurage-media bucket must exist in Supabase Storage.
-- If it does not exist, create it via the Supabase Dashboard.
-- Apply the storage policies above after bucket creation.
