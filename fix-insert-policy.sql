-- Fix the INSERT policy for storage uploads
-- Run this in your Supabase SQL editor

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- Create a corrected INSERT policy with proper USING condition
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'memory-media' AND 
    auth.role() = 'authenticated'
  );

-- Verify the updated policy
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname = 'Allow authenticated uploads';
