import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Fetch posts with author info
export function usePosts(tab: 'foryou' | 'following' | 'explore' = 'foryou', userId?: string) {
  return useQuery({
    queryKey: ['posts', tab, userId],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:user_profiles!posts_user_id_fkey(
            id, username, email, bio, avatar_url, role, verified, verified_type, followers_count, following_count, posts_count
          )
        `)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (tab === 'following' && userId) {
        // Get following ids first
        const { data: followData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);
        const ids = followData?.map(f => f.following_id) || [];
        if (ids.length === 0) return [];
        query = query.in('user_id', ids);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });
}

// Fetch user's liked post IDs
export function useUserLikes(userId?: string) {
  return useQuery({
    queryKey: ['likes', userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      const { data, error } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId);
      if (error) throw error;
      return new Set((data || []).map(l => l.post_id));
    },
    enabled: !!userId,
    staleTime: 60000,
  });
}

// Fetch user's saved post IDs
export function useUserSaves(userId?: string) {
  return useQuery({
    queryKey: ['saves', userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      const { data, error } = await supabase
        .from('saves')
        .select('post_id')
        .eq('user_id', userId);
      if (error) throw error;
      return new Set((data || []).map(s => s.post_id));
    },
    enabled: !!userId,
    staleTime: 60000,
  });
}

// Toggle like
export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, userId, isLiked }: { postId: string; userId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['likes', userId] });
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: () => toast.error('Failed to update like'),
  });
}

// Toggle save
export function useToggleSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, userId, isSaved }: { postId: string; userId: string; isSaved: boolean }) => {
      if (isSaved) {
        const { error } = await supabase.from('saves').delete().eq('post_id', postId).eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('saves').insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['saves', userId] });
      toast.success((_d as unknown as boolean) ? 'Removed from saved' : 'Saved!');
    },
    onError: () => toast.error('Failed to update saved'),
  });
}

// Create post
export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: {
      user_id: string;
      type: string;
      title: string;
      description?: string;
      thumbnail_url?: string;
      media_url?: string;
      duration?: string;
      category: string;
      region?: string;
      tags?: string[];
      truth_score?: number | null;
      cultural_relevance?: boolean | null;
      cultural_topics?: string[] | null;
      flagged?: boolean | null;
      truth_analysis?: string | null;
      analyzed_at?: string | null;
      analyzed_by?: string | null;
      story_expires_at?: string | null;
    }) => {
      const { data, error } = await supabase.from('posts').insert(post).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Content published successfully!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// Fetch comments for a post
export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`*, author:user_profiles!comments_user_id_fkey(id, username, avatar_url, verified)`)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });
}

// Add comment
export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, userId, content }: { postId: string; userId: string; content: string }) => {
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: userId, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, { postId }) => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: () => toast.error('Failed to post comment'),
  });
}

// Trending posts (most viewed)
export function useTrending() {
  return useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, views, thumbnail_url')
        .eq('published', true)
        .order('views', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });
}
