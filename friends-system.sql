-- Friends System for Mapory App
-- Run this in your Supabase SQL editor

-- Create friends table to store accepted friendships
CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK(user_id != friend_id) -- Prevent self-friending
);

-- Create friend_requests table to store pending friend requests
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id),
  CHECK(sender_id != receiver_id) -- Prevent self-requesting
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

-- Enable RLS on both tables
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for friends table
CREATE POLICY "Users can view their own friendships" ON friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own friendships" ON friends
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS policies for friend_requests table
CREATE POLICY "Users can view their own friend requests" ON friend_requests
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create friend requests" ON friend_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update friend requests they received" ON friend_requests
  FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own friend requests" ON friend_requests
  FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Create updated_at trigger function for friend_requests
CREATE OR REPLACE FUNCTION update_friend_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for friend_requests table
CREATE TRIGGER update_friend_requests_updated_at 
  BEFORE UPDATE ON friend_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_friend_request_updated_at();

-- Function to accept a friend request
CREATE OR REPLACE FUNCTION accept_friend_request(request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  request_record friend_requests%ROWTYPE;
BEGIN
  -- Get the friend request
  SELECT * INTO request_record 
  FROM friend_requests 
  WHERE id = request_id AND receiver_id = auth.uid() AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update the request status
  UPDATE friend_requests 
  SET status = 'accepted', updated_at = NOW()
  WHERE id = request_id;
  
  -- Create friendship in both directions
  INSERT INTO friends (user_id, friend_id) 
  VALUES (request_record.sender_id, request_record.receiver_id);
  
  INSERT INTO friends (user_id, friend_id) 
  VALUES (request_record.receiver_id, request_record.sender_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decline a friend request
CREATE OR REPLACE FUNCTION decline_friend_request(request_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE friend_requests 
  SET status = 'declined', updated_at = NOW()
  WHERE id = request_id AND receiver_id = auth.uid() AND status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM friends 
    WHERE user_id = user1_id AND friend_id = user2_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's friends
CREATE OR REPLACE FUNCTION get_user_friends(user_uuid UUID)
RETURNS TABLE (
  friend_id UUID,
  friend_email TEXT,
  friend_name TEXT,
  friend_avatar_url TEXT,
  friendship_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.friend_id,
    p.email,
    p.name,
    p.avatar_url,
    f.created_at
  FROM friends f
  JOIN profiles p ON f.friend_id = p.id
  WHERE f.user_id = user_uuid
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending friend requests for a user
CREATE OR REPLACE FUNCTION get_pending_friend_requests(user_uuid UUID)
RETURNS TABLE (
  request_id UUID,
  sender_id UUID,
  sender_email TEXT,
  sender_name TEXT,
  sender_avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fr.id,
    fr.sender_id,
    p.email,
    p.name,
    p.avatar_url,
    fr.created_at
  FROM friend_requests fr
  JOIN profiles p ON fr.sender_id = p.id
  WHERE fr.receiver_id = user_uuid AND fr.status = 'pending'
  ORDER BY fr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get sent friend requests for a user
CREATE OR REPLACE FUNCTION get_sent_friend_requests(user_uuid UUID)
RETURNS TABLE (
  request_id UUID,
  receiver_id UUID,
  receiver_email TEXT,
  receiver_name TEXT,
  receiver_avatar_url TEXT,
  status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fr.id,
    fr.receiver_id,
    p.email,
    p.name,
    p.avatar_url,
    fr.status,
    fr.created_at
  FROM friend_requests fr
  JOIN profiles p ON fr.receiver_id = p.id
  WHERE fr.sender_id = user_uuid
  ORDER BY fr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the tables were created
SELECT 'Friends table created successfully' as status;
SELECT 'Friend requests table created successfully' as status;
