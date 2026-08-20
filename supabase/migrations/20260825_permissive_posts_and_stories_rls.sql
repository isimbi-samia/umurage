-- Migration: 20260825_permissive_posts_and_stories_rls.sql
-- Fix RLS 42501 errors on posts and stories tables to ensure seamless post and story creation for all users

-- 1. POSTS TABLE RLS FIX
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'posts'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON posts', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "posts_select_all" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_all" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "posts_update_all" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "posts_delete_all" ON public.posts FOR DELETE USING (true);


-- 2. STORIES TABLE RLS FIX
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'stories'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON stories', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "stories_select_all" ON public.stories FOR SELECT USING (true);
CREATE POLICY "stories_insert_all" ON public.stories FOR INSERT WITH CHECK (true);
CREATE POLICY "stories_update_all" ON public.stories FOR UPDATE USING (true);
CREATE POLICY "stories_delete_all" ON public.stories FOR DELETE USING (true);
