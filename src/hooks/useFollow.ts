import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Check if current user follows a specific user
export function useFollowStatus(followerId?: string, followingId?: string) {
  return useQuery({
    queryKey: ['follow-status', followerId, followingId],
    queryFn: async () => {
      if (!followerId || !followingId) return false;
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!followerId && !!followingId,
  });
}

// Get all users current user follows
export function useFollowing(userId?: string) {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);
      if (error) throw error;
      return new Set((data || []).map(f => f.following_id));
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}

// Toggle follow
export function useToggleFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      followerId,
      followingId,
      isFollowing,
    }: { followerId: string; followingId: string; isFollowing: boolean }) => {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', followerId)
          .eq('following_id', followingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: followerId, following_id: followingId });
        if (error) throw error;
      }
    },
    onSuccess: (_d, { followerId, followingId }) => {
      qc.invalidateQueries({ queryKey: ['following', followerId] });
      qc.invalidateQueries({ queryKey: ['follow-status', followerId, followingId] });
    },
    onError: () => toast.error('Failed to update follow'),
  });
}

// Fetch verified creators from profiles
export function useVerifiedCreators() {
  return useQuery({
    queryKey: ['verified-creators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, username, avatar_url, verified, verified_type, followers_count, role, bio')
        .eq('verified', true)
        .order('followers_count', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data || [];
    },
    staleTime: 120000,
  });
}

// Fetch upcoming cultural events (used in RightSidebar)
export function useCulturalEvents() {
  return useQuery({
    queryKey: ['cultural_events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cultural_events')
        .select('*')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });
}

// Create cultural event with rsvp_count support
export function useCreateCulturalEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: {
      user_id: string;
      title: string;
      description?: string;
      event_date: string;
      location?: string;
      event_type?: string;
      image_url?: string;
    }) => {
      const { data, error } = await supabase.from('cultural_events').insert(event).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cultural_events'] });
      toast.success('Cultural event created!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// Fetch enrollments for a user
export function useEnrollments(userId?: string) {
  return useQuery({
    queryKey: ['enrollments', userId],
    queryFn: async () => {
      if (!userId) return {};
      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id, progress, enrolled_at')
        .eq('user_id', userId);
      if (error) throw error;
      const map: Record<string, { progress: number; enrolled_at: string }> = {};
      (data || []).forEach(e => { map[e.course_id] = { progress: e.progress, enrolled_at: e.enrolled_at }; });
      return map;
    },
    enabled: !!userId,
  });
}

// Enroll in course / update progress
export function useEnrollCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, courseId }: { userId: string; courseId: string }) => {
      const { error } = await supabase
        .from('enrollments')
        .upsert({ user_id: userId, course_id: courseId }, { onConflict: 'user_id,course_id' });
      if (error) throw error;
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['enrollments', userId] });
      toast.success('Enrolled successfully!');
    },
    onError: () => toast.error('Failed to enroll'),
  });
}

// Fetch saved posts for current user
export function useSavedPosts(userId?: string) {
  return useQuery({
    queryKey: ['saved-posts', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: saves, error: savesError } = await supabase
        .from('saves')
        .select('post_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (savesError) throw savesError;
      if (!saves || saves.length === 0) return [];

      const postIds = saves.map(s => s.post_id);
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds);
      if (postsError) throw postsError;

      const rawPosts = posts || [];
      const authorIds = [...new Set(rawPosts.map(p => p.user_id).filter(Boolean))];
      const authorMap = new Map<string, any>();

      if (authorIds.length > 0) {
        const { data: authors } = await supabase
          .from('public_profiles')
          .select('id, username, full_name, avatar_url, verified, verified_type, role')
          .in('id', authorIds);
        (authors || []).forEach((a: any) => {
          authorMap.set(a.id, { ...a, verification_type: a.verified_type });
        });
      }

      const postMap = new Map(rawPosts.map(p => [p.id, {
        ...p,
        author: authorMap.get(p.user_id) || null,
      }]));

      return saves
        .map(s => postMap.get(s.post_id))
        .filter(Boolean);
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}
