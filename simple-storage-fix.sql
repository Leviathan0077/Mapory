-- Simple Storage Fix for Mapory App
-- Run this in your Supabase SQL editor

-- First, let's check what buckets exist
SELECT * FROM storage.buckets;

-- Create the memory-media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('memory-media', 'memory-media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop all existing storage policies to start fresh
DROP POLICY IF EXISTS "Users can upload memory media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view memory media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view memory media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update memory media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete memory media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own memory media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own memory media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view memory media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own memory media" ON storage.objects;

-- Create very simple policies that should work
-- Allow authenticated users to upload to memory-media bucket
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'memory-media' AND 
    auth.role() = 'authenticated'
  );

-- Allow everyone to view files in memory-media bucket
CREATE POLICY "Allow public access" ON storage.objects
  FOR SELECT USING (bucket_id = 'memory-media');

-- Allow authenticated users to update their files
CREATE POLICY "Allow authenticated updates" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'memory-media' AND 
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'memory-media' AND 
    auth.role() = 'authenticated'
  );

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'memory-media';

-- Verify policies were created
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;
