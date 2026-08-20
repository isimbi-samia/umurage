-- Migration: 20260823_posts_columns_and_rls.sql
-- Ensures posts table has all required columns and proper RLS policies

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'type') THEN
    ALTER TABLE public.posts ADD COLUMN type text DEFAULT 'image';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'description') THEN
    ALTER TABLE public.posts ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'thumbnail_url') THEN
    ALTER TABLE public.posts ADD COLUMN thumbnail_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'duration') THEN
    ALTER TABLE public.posts ADD COLUMN duration text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'region') THEN
    ALTER TABLE public.posts ADD COLUMN region text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'tags') THEN
    ALTER TABLE public.posts ADD COLUMN tags text[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'published') THEN
    ALTER TABLE public.posts ADD COLUMN published boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'views') THEN
    ALTER TABLE public.posts ADD COLUMN views integer DEFAULT 0;
  END IF;
END $$;

-- Drop and recreate posts RLS policies for seamless read/write
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'posts'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.posts', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_public" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_auth" ON public.posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "posts_update_owner" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_owner" ON public.posts FOR DELETE USING (auth.uid() = user_id);
