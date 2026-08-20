-- Migration: 20260821_fix_rls_and_storage.sql
-- Dynamically drops all old RLS policies on messaging tables and storage.objects, 
-- replaces them with non-recursive policies, and populates storage buckets.

-- 1. DROP ALL EXISTING POLICIES ON MESSAGING TABLES
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('conversations', 'conversation_members', 'messages')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 2. CREATE NON-RECURSIVE RLS POLICIES FOR MESSAGING
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check membership without triggering infinite policy recursion
CREATE OR REPLACE FUNCTION public.check_is_conversation_member(_conversation_id uuid, _user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.conversation_members 
    WHERE conversation_id = _conversation_id AND user_id = _user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Conversation Members Policies
CREATE POLICY "cm_select_policy"
ON public.conversation_members FOR SELECT
USING (
  user_id = auth.uid() OR public.check_is_conversation_member(conversation_id, auth.uid())
);

CREATE POLICY "cm_insert_policy"
ON public.conversation_members FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "cm_update_policy"
ON public.conversation_members FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "cm_delete_policy"
ON public.conversation_members FOR DELETE
USING (user_id = auth.uid());

-- Conversations Policies
CREATE POLICY "conv_select_policy"
ON public.conversations FOR SELECT
USING (
  public.check_is_conversation_member(id, auth.uid())
);

CREATE POLICY "conv_insert_policy"
ON public.conversations FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "conv_update_policy"
ON public.conversations FOR UPDATE
USING (public.check_is_conversation_member(id, auth.uid()));

-- Messages Policies
CREATE POLICY "msg_select_policy"
ON public.messages FOR SELECT
USING (
  public.check_is_conversation_member(conversation_id, auth.uid())
);

CREATE POLICY "msg_insert_policy"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND public.check_is_conversation_member(conversation_id, auth.uid())
);

CREATE POLICY "msg_update_policy"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id);

-- 3. STORAGE BUCKETS & STORAGE.OBJECTS RLS
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('umurage-media', 'umurage-media', true),
  ('stories', 'stories', true),
  ('images', 'images', true),
  ('videos', 'videos', true),
  ('audio', 'audio', true),
  ('books', 'books', true),
  ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop all existing policies on storage.objects
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Permissive Storage RLS Policies
CREATE POLICY "storage_public_select"
ON storage.objects FOR SELECT
USING (true);

CREATE POLICY "storage_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "storage_auth_update"
ON storage.objects FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "storage_auth_delete"
ON storage.objects FOR DELETE
USING (auth.role() = 'authenticated');
