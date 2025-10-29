import { createClient } from '@supabase/supabase-js';

// You'll need to replace these with your actual Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      memories: {
        Row: {
          id: string;
          title: string;
          description: string;
          latitude: number;
          longitude: number;
          address: string | null;
          city: string | null;
          country: string | null;
          media_urls: string[];
          tags: string[] | null;
          is_public: boolean;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          latitude: number;
          longitude: number;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          media_urls: string[];
          tags?: string[] | null;
          is_public?: boolean;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          latitude?: number;
          longitude?: number;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          media_urls?: string[];
          tags?: string[] | null;
          is_public?: boolean;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      friends: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          created_at?: string;
        };
      };
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: 'pending' | 'accepted' | 'declined';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      accept_friend_request: {
        Args: {
          request_id: string;
        };
        Returns: boolean;
      };
      decline_friend_request: {
        Args: {
          request_id: string;
        };
        Returns: boolean;
      };
      are_friends: {
        Args: {
          user1_id: string;
          user2_id: string;
        };
        Returns: boolean;
      };
      get_user_friends: {
        Args: {
          user_uuid: string;
        };
        Returns: {
          friend_id: string;
          friend_email: string;
          friend_name: string;
          friend_avatar_url: string;
          friendship_created_at: string;
        }[];
      };
      get_pending_friend_requests: {
        Args: {
          user_uuid: string;
        };
        Returns: {
          request_id: string;
          sender_id: string;
          sender_email: string;
          sender_name: string;
          sender_avatar_url: string;
          created_at: string;
        }[];
      };
      get_sent_friend_requests: {
        Args: {
          user_uuid: string;
        };
        Returns: {
          request_id: string;
          receiver_id: string;
          receiver_email: string;
          receiver_name: string;
          receiver_avatar_url: string;
          status: string;
          created_at: string;
        }[];
      };
    };
  };
}
