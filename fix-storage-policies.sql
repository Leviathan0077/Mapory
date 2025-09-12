-- Fix Storage RLS Policies for Mapory App
-- Run this in your Supabase SQL editor to fix the storage policy issues

-- First, let's check if the storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'memory-media';

-- If the bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'memory-media', 
  'memory-media', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];

-- Drop all existing storage policies
DROP POLICY IF EXISTS "Users can upload their own memory media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own memory media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view memory media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own memory media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own memory media" ON storage.objects;

-- Create new storage policies with proper conditions
-- Policy for uploading files
CREATE POLICY "Users can upload memory media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'memory-media' AND 
    auth.uid() IS NOT NULL AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = 'memories' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Policy for viewing files (users can view their own files and public files)
CREATE POLICY "Users can view memory media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'memory-media' AND (
      auth.uid() IS NOT NULL AND
      (storage.foldername(name))[1] = 'memories' AND
      (storage.foldername(name))[2] = auth.uid()::text
    )
  );

-- Policy for public access to memory media
CREATE POLICY "Public can view memory media" ON storage.objects
  FOR SELECT USING (bucket_id = 'memory-media');

-- Policy for updating files
CREATE POLICY "Users can update memory media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'memory-media' AND 
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = 'memories' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Policy for deleting files
CREATE POLICY "Users can delete memory media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'memory-media' AND 
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = 'memories' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%memory%'
ORDER BY policyname;

-- Test the bucket configuration
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at
FROM storage.buckets 
WHERE id = 'memory-media';
