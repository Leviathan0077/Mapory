-- Add Likes Feature to Mapory App
-- Run this in your Supabase SQL editor

-- Create likes table
CREATE TABLE IF NOT EXISTS memory_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(memory_id, user_id) -- Prevent duplicate likes from same user
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memory_likes_memory_id ON memory_likes(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_likes_user_id ON memory_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_likes_created_at ON memory_likes(created_at DESC);

-- Enable RLS on likes table
ALTER TABLE memory_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for likes
-- Users can view all likes
CREATE POLICY "Anyone can view likes" ON memory_likes
  FOR SELECT USING (true);

-- Users can like memories (insert)
CREATE POLICY "Users can like memories" ON memory_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can unlike memories (delete their own likes)
CREATE POLICY "Users can unlike memories" ON memory_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Function to get like count for a memory
CREATE OR REPLACE FUNCTION get_memory_like_count(memory_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM memory_likes 
    WHERE memory_id = memory_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user liked a memory
CREATE OR REPLACE FUNCTION is_memory_liked_by_user(memory_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS(
      SELECT 1 
      FROM memory_likes 
      WHERE memory_id = memory_uuid AND user_id = user_uuid
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the table was created
SELECT * FROM memory_likes LIMIT 1;

-- Verify policies were created
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'memory_likes'
ORDER BY policyname;
