-- Migration: 20260824_storage_permissive_and_apikey_fix.sql
-- Drop and recreate storage.objects policies to allow seamless file uploads for all app storage buckets

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

-- Allow public reading for all objects in app buckets
CREATE POLICY "storage_objects_public_select"
ON storage.objects FOR SELECT
USING (true);

-- Allow uploads for all app buckets
CREATE POLICY "storage_objects_public_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('umurage-media', 'stories', 'images', 'videos', 'audio', 'books', 'documents', 'avatars', 'posts', 'library')
);

-- Allow update for all app buckets
CREATE POLICY "storage_objects_public_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('umurage-media', 'stories', 'images', 'videos', 'audio', 'books', 'documents', 'avatars', 'posts', 'library')
);

-- Allow delete for all app buckets
CREATE POLICY "storage_objects_public_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('umurage-media', 'stories', 'images', 'videos', 'audio', 'books', 'documents', 'avatars', 'posts', 'library')
);
