export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  location: Location;
  mediaUrls: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  tags?: string[];
  isPublic: boolean;
  likeCount?: number;
  isLikedByUser?: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface CreateMemoryData {
  title: string;
  description: string;
  location: Location;
  mediaFiles: File[];
  tags?: string[];
  isPublic: boolean;
}

export interface MapMarker {
  id: string;
  coordinates: [number, number];
  memory: Memory;
}

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface Friend {
  friend_id: string;
  friend_email: string;
  friend_name: string;
  friend_avatar_url: string;
  friendship_created_at: string;
}

export interface FriendRequest {
  request_id: string;
  sender_id?: string;
  receiver_id?: string;
  sender_email?: string;
  receiver_email?: string;
  sender_name?: string;
  receiver_name?: string;
  sender_avatar_url?: string;
  receiver_avatar_url?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  created_at: string;
}