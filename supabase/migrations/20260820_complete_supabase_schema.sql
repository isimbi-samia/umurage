-- Migration: 20260820_complete_supabase_schema.sql
-- Fixes missing tables, creates storage buckets, and resolves RLS infinite recursion issues

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. VIEW: user_profiles
-- Alias view for profiles table to support queries referencing user_profiles
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.user_profiles AS 
SELECT * FROM public.profiles;

-- -----------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS FOR RLS (To prevent infinite recursion)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conversation_id uuid, _user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.conversation_members 
    WHERE conversation_id = _conversation_id AND user_id = _user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- 3. FIX CONVERSATIONS & MESSAGES RLS POLICIES
-- -----------------------------------------------------------------------------
-- Enable RLS on messaging tables
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;

-- Drop recursive policies if they exist
DROP POLICY IF EXISTS "Users can view conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can insert memberships" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can view conversations they belong to" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;

-- Non-recursive conversation_members policies
CREATE POLICY "Users can view members of their conversations"
ON public.conversation_members FOR SELECT
USING (
  user_id = auth.uid() OR public.is_conversation_member(conversation_id, auth.uid())
);

CREATE POLICY "Authenticated users can insert conversation members"
ON public.conversation_members FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own conversation membership"
ON public.conversation_members FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own conversation membership"
ON public.conversation_members FOR DELETE
USING (user_id = auth.uid());

-- Conversations policies
CREATE POLICY "Users can view conversations they are part of"
ON public.conversations FOR SELECT
USING (
  public.is_conversation_member(id, auth.uid())
);

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Members can update conversations"
ON public.conversations FOR UPDATE
USING (public.is_conversation_member(id, auth.uid()));

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
  public.is_conversation_member(conversation_id, auth.uid())
);

CREATE POLICY "Users can insert messages into their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND public.is_conversation_member(conversation_id, auth.uid())
);

CREATE POLICY "Senders can update their messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id);

-- -----------------------------------------------------------------------------
-- 4. MISSING TABLES CREATION
-- -----------------------------------------------------------------------------

-- Table: event_registrations
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.cultural_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'attending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (event_id, user_id)
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read event_registrations" ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "Users manage own event_registrations" ON public.event_registrations 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id text NOT NULL,
  progress integer DEFAULT 0,
  enrolled_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, course_id)
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own enrollments" ON public.enrollments 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: discussion_topics
CREATE TABLE IF NOT EXISTS public.discussion_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  category text DEFAULT 'General',
  pinned boolean DEFAULT false,
  votes integer DEFAULT 0,
  replies_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.discussion_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read discussion_topics" ON public.discussion_topics FOR SELECT USING (true);
CREATE POLICY "Auth users insert discussion_topics" ON public.discussion_topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own discussion_topics" ON public.discussion_topics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own discussion_topics" ON public.discussion_topics FOR DELETE USING (auth.uid() = user_id);

-- Table: discussion_replies
CREATE TABLE IF NOT EXISTS public.discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.discussion_topics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read discussion_replies" ON public.discussion_replies FOR SELECT USING (true);
CREATE POLICY "Auth users insert discussion_replies" ON public.discussion_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own discussion_replies" ON public.discussion_replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own discussion_replies" ON public.discussion_replies FOR DELETE USING (auth.uid() = user_id);

-- Table: discussion_votes
CREATE TABLE IF NOT EXISTS public.discussion_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES public.discussion_topics(id) ON DELETE CASCADE,
  reply_id uuid REFERENCES public.discussion_replies(id) ON DELETE CASCADE,
  vote_type text DEFAULT 'up',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.discussion_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view discussion_votes" ON public.discussion_votes FOR SELECT USING (true);
CREATE POLICY "Users manage own discussion_votes" ON public.discussion_votes 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: heritage_recordings
CREATE TABLE IF NOT EXISTS public.heritage_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  audio_url text NOT NULL,
  duration text,
  storyteller_name text,
  region text,
  language text DEFAULT 'Kinyarwanda',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.heritage_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read heritage_recordings" ON public.heritage_recordings FOR SELECT USING (true);
CREATE POLICY "Auth users insert heritage_recordings" ON public.heritage_recordings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own heritage_recordings" ON public.heritage_recordings 
  FOR UPDATE USING (auth.uid() = user_id);

-- Table: verification_applications
CREATE TABLE IF NOT EXISTS public.verification_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  organization text,
  role_type text NOT NULL,
  id_document_url text,
  supporting_document_url text,
  status text DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now()
);
ALTER TABLE public.verification_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own verification applications" ON public.verification_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users submit verification applications" ON public.verification_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure stories table exists with correct schema
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  type text NOT NULL DEFAULT 'image',
  caption text,
  views integer DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read non-expired stories" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Auth users insert stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own stories" ON public.stories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5. STORAGE BUCKETS SETUP & STORAGE RLS POLICIES
-- -----------------------------------------------------------------------------

-- Ensure buckets exist in storage.buckets
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

-- Drop existing storage policies on storage.objects to avoid duplicates
DROP POLICY IF EXISTS "Public view for media buckets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users insert media objects" ON storage.objects;
DROP POLICY IF EXISTS "Users update own media objects" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own media objects" ON storage.objects;

-- Create unified public read policy for all application buckets
CREATE POLICY "Public view for media buckets"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('umurage-media', 'stories', 'images', 'videos', 'audio', 'books', 'documents')
);

-- Allow authenticated users to upload files to any of these buckets
CREATE POLICY "Authenticated users insert media objects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('umurage-media', 'stories', 'images', 'videos', 'audio', 'books', 'documents')
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploads
CREATE POLICY "Users update own media objects"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('umurage-media', 'stories', 'images', 'videos', 'audio', 'books', 'documents')
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own uploads
CREATE POLICY "Users delete own media objects"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('umurage-media', 'stories', 'images', 'videos', 'audio', 'books', 'documents')
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
