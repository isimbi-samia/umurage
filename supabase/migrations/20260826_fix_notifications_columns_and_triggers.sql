-- Migration: 20260826_fix_notifications_columns_and_triggers.sql
-- Add missing columns to notifications table and fix trigger functions

-- 1. Ensure all columns exist on notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS content_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS comment_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

-- 2. Drop legacy broken triggers on posts table
DROP TRIGGER IF EXISTS trigger_notify_on_post ON public.posts;
DROP TRIGGER IF EXISTS notify_followers_on_post ON public.posts;
DROP TRIGGER IF EXISTS on_post_created ON public.posts;

-- 3. Enable permissive RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'notifications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON notifications', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "notifications_select_all" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "notifications_insert_all" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_all" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "notifications_delete_all" ON public.notifications FOR DELETE USING (true);
