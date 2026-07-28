import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface StoryPost {
  id: string;
  user_id: string;
  type: string;
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
  story_expires_at: string | null;
  author: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    verified: boolean;
  };
}

export function useStories() {
  return useQuery<StoryPost[]>({
    queryKey: ['stories'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:user_profiles!posts_user_id_fkey(
            id, username, avatar_url, verified
          )
        `)
        .eq('published', true)
        .eq('type', 'story')
        .or(`story_expires_at.is.null,story_expires_at.gt.${now}`)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as StoryPost[];
    },
    staleTime: 30000,
  });
}