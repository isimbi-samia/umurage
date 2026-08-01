import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface StoryPost {
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
          author:profiles!posts_user_id_fkey(
            id, username, avatar_url, verified
          )
        `)
        .eq('published', true)
        .eq('type', 'story')
        .or(`story_expires_at.is.null,story_expires_at.gt.${now}`)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []).map(item => ({ ...item, tags: item.tags ?? [] })) as StoryPost[];
    },
    staleTime: 30000,
  });
}

export function useStoryAnalytics(storyId?: string) {
  return useQuery<number>({
    queryKey: ['story-analytics', storyId],
    queryFn: async () => {
      if (!storyId) return 0;
      const { count, error } = await supabase
        .from('content_views')
        .select('*', { count: 'exact', head: true })
        .eq('content_id', storyId)
        .eq('content_type', 'story');
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!storyId,
    staleTime: 30000,
  });
}

export function useMarkStoryViewed() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ storyId, userId }: { storyId: string; userId?: string }) => {
      if (!storyId) return;
      const { error } = await supabase.from('content_views').insert({
        content_id: storyId,
        content_type: 'story',
        user_id: userId ?? null,
      });
      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
    },
    onSuccess: (_data, { storyId }) => {
      qc.invalidateQueries({ queryKey: ['story-analytics', storyId] });
    },
  });
}