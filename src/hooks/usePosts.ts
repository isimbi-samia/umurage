import React from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { subscribeToTable } from '@/lib/realtime';

type PostTab = 'foryou' | 'following' | 'explore';
type SortOption = 'latest' | 'popular' | 'trending';

const PAGE_SIZE = 8;

interface PostsPage {
  items: any[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Fetch posts with author info and support paginated loading
export function usePosts(tab: PostTab = 'foryou', userId?: string, sortBy: SortOption = 'latest') {
  return useInfiniteQuery<PostsPage, Error>({
    queryKey: ['posts', tab, userId, sortBy],
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles(
            id, username, email, bio, avatar_url, role, verified, verification_type, followers_count, following_count, posts_count
          )
        `)
        .eq('published', true)
        .neq('type', 'story')
        .limit(PAGE_SIZE + 1);

      if (tab === 'following' && userId) {
        const { data: followData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);
        const ids = followData?.map(f => f.following_id) || [];
        if (ids.length === 0) return { items: [], nextCursor: null, hasMore: false };
        query = query.in('user_id', ids);
      }

      if (sortBy === 'popular') {
        query = query.order('likes_count', { ascending: false });
      } else if (sortBy === 'trending') {
        query = query.order('views_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (pageParam) {
        const cursorValue = pageParam as string;
        if (sortBy === 'latest') {
          query = query.lt('created_at', cursorValue);
        } else if (sortBy === 'popular') {
          query = query.lt('likes_count', Number(cursorValue));
        } else {
          query = query.lt('views_count', Number(cursorValue));
        }
      }

      let { data, error } = await query;
      if (error) {
        // Fallback without embedded join if relation fails
        const fallbackQuery = supabase
          .from('posts')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE + 1);
        const { data: fbData, error: fbError } = await fallbackQuery;
        if (fbError) throw fbError;
        data = fbData;
      }

      const rawItems = data || [];
      // Populate missing authors
      const missingAuthorUserIds = [...new Set(rawItems.filter(p => !p.author && p.user_id).map(p => p.user_id))];
      if (missingAuthorUserIds.length > 0) {
        const { data: authorProfiles } = await supabase
          .from('profiles')
          .select('id, username, email, bio, avatar_url, role, verified, verification_type, followers_count, following_count, posts_count')
          .in('id', missingAuthorUserIds);
        const authorMap = new Map((authorProfiles || []).map(ap => [ap.id, ap]));
        rawItems.forEach(p => {
          if (!p.author && p.user_id) {
            p.author = authorMap.get(p.user_id) || null;
          }
        });
      }

      const items = rawItems.slice(0, PAGE_SIZE);
      const lastItem = items[items.length - 1];
      const nextCursor = items.length === PAGE_SIZE ? (sortBy === 'latest' ? lastItem?.created_at ?? null : (sortBy === 'popular' ? String(lastItem?.likes_count ?? 0) : String(lastItem?.views_count ?? 0))) : null;
      return {
        items,
        nextCursor,
        hasMore: rawItems.length > PAGE_SIZE,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 30000,
  });
}

// Add a background subscription to invalidate posts when changes occur
export function usePostsRealtimeSync() {
  const qc = useQueryClient();
  React.useEffect(() => {
    const unsub = subscribeToTable('posts', () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
    });
    return () => unsub();
  }, [qc]);
}

export function useRealtimeSyncAll() {
  const qc = useQueryClient();
  React.useEffect(() => {
    const tables = ['posts', 'likes', 'saves', 'comments', 'follows', 'messages', 'profiles', 'notifications'];
    const unsubscribers = tables.map(t => subscribeToTable(t, () => qc.invalidateQueries()));
    return () => unsubscribers.forEach(u => u());
  }, [qc]);
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['likes'] });
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
      toast.success('Saved state updated');
    },
    onError: () => toast.error('Failed to update saved'),
  });
}

// Track a post view in the content_views table
export function useTrackPostView() {
  return useMutation({
    mutationFn: async ({ postId, userId }: { postId: string; userId?: string }) => {
      if (!postId) return;
      const { error } = await supabase.from('content_views').insert({
        content_id: postId,
        content_type: 'post',
        user_id: userId ?? null,
      });
      if (error) {
        if (!error.message.includes('duplicate')) throw error;
      }
    },
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
      const { data, error } = await supabase.from('posts').insert({ ...post, published: true }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['stories'] });
      qc.invalidateQueries({ queryKey: ['trending'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
      qc.invalidateQueries({ queryKey: ['user-posts', data.user_id] });
      qc.invalidateQueries({ queryKey: ['profile', data.user_id] });
      qc.invalidateQueries({ queryKey: ['heritage-recordings', data.user_id] });
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
        .select(`*, author:profiles(id, username, avatar_url, verified)`)
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
      const { data, error } = await supabase.from('comments').insert({ post_id: postId, user_id: userId, content }).select().single();
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
        .select('id, title, thumbnail_url, views_count, views, created_at')
        .eq('published', true)
        .order('views_count', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []).map((item: any) => ({
        ...item,
        views: item.views_count ?? item.views ?? 0,
      }));
    },
    staleTime: 60000,
  });
}

// Delete post
export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, userId }: { postId: string; userId: string }) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['user-posts'] });
      qc.invalidateQueries({ queryKey: ['trending'] });
      qc.invalidateQueries({ queryKey: ['saved-posts'] });
      toast.success('Post deleted successfully');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete post'),
  });
}
