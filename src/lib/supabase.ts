import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          username: string | null;
          email: string;
          bio: string | null;
          avatar_url: string | null;
          role: 'user' | 'creator' | 'elder' | 'organization';
          verified: boolean;
          verified_type: string | null;
          location: string | null;
          interests: string[];
          followers_count: number;
          following_count: number;
          posts_count: number;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          type: 'video' | 'article' | 'audio' | 'book' | 'image' | 'story' | 'document';
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          media_url: string | null;
          duration: string | null;
          category: string;
          region: string | null;
          tags: string[];
          views: number;
          likes_count: number;
          comments_count: number;
          shares_count: number;
          published: boolean;
          created_at: string;
          truth_score: number | null;
          cultural_relevance: boolean | null;
          cultural_topics: string[] | null;
          flagged: boolean | null;
          truth_analysis: string | null;
          analyzed_at: string | null;
          analyzed_by: string | null;
          story_expires_at: string | null;
        };
      };
      likes: { Row: { id: string; post_id: string; user_id: string } };
      saves: { Row: { id: string; post_id: string; user_id: string } };
      follows: { Row: { id: string; follower_id: string; following_id: string } };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          parent_id: string | null;
          created_at: string;
        };
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          event_date: string;
          location: string | null;
          event_type: string;
          image_url: string | null;
          created_at: string;
        };
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          progress: number;
          enrolled_at: string;
          completed_at: string | null;
        };
      };
    };
  };
};
