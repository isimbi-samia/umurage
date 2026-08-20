-- Migration: 20260822_buckets_rls.sql
-- Enables public read policy on storage.buckets so client listBuckets() calls succeed.

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'buckets'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.buckets', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "storage_buckets_public_select"
ON storage.buckets FOR SELECT
USING (true);

CREATE POLICY "storage_buckets_public_insert"
ON storage.buckets FOR INSERT
WITH CHECK (true);
