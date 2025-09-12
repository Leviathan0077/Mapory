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
    };
  };
}
