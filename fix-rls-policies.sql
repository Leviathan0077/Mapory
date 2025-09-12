-- Fix RLS Policies for Mapory App
-- Run this in your Supabase SQL editor to fix the RLS policy issues

-- First, let's check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('memories', 'profiles');

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own memories" ON memories;
DROP POLICY IF EXISTS "Users can view public memories" ON memories;
DROP POLICY IF EXISTS "Users can insert their own memories" ON memories;
DROP POLICY IF EXISTS "Users can update their own memories" ON memories;
DROP POLICY IF EXISTS "Users can delete their own memories" ON memories;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Drop storage policies
DROP POLICY IF EXISTS "Users can upload their own memory media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own memory media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view memory media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own memory media" ON storage.objects;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Recreate memories policies with more explicit conditions
CREATE POLICY "Users can view their own memories" ON memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public memories" ON memories
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own memories" ON memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" ON memories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" ON memories
  FOR DELETE USING (auth.uid() = user_id);

-- Recreate profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Recreate storage policies with more explicit conditions
CREATE POLICY "Users can upload their own memory media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'memory-media' AND 
    auth.uid() IS NOT NULL AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own memory media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'memory-media' AND 
    auth.uid() IS NOT NULL AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can view memory media" ON storage.objects
  FOR SELECT USING (bucket_id = 'memory-media');

CREATE POLICY "Users can delete their own memory media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'memory-media' AND 
    auth.uid() IS NOT NULL AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Test the policies by checking if they exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('memories', 'profiles')
ORDER BY tablename, policyname;

-- Check storage policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;
