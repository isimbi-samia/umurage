import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'follow' | 'comment' | 'reply' | 'verification' | 'message' | 'order' | 'course';
  actor_id: string | null;
  post_id: string | null;
  topic_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
  actor?: { username: string | null; avatar_url: string | null } | null;
}

export function useNotifications(userId?: string) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async (): Promise<Notification[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select(`*, actor:profiles!notifications_actor_id_fkey(username, avatar_url)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching notifications:', error);
      }
      return (data || []) as Notification[];
    },
    enabled: !!userId,
    refetchInterval: 15000,
    staleTime: 10000,
  });
}

export function useUnreadCount(userId?: string) {
  return useQuery({
    queryKey: ['notifications-unread', userId],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!userId,
    refetchInterval: 15000,
    staleTime: 10000,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
      if (error) throw error;
    },
    onSuccess: (_d, userId) => {
      qc.invalidateQueries({ queryKey: ['notifications', userId] });
      qc.invalidateQueries({ queryKey: ['notifications-unread', userId] });
    },
  });
}

export function useMarkOneRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ notifId, userId }: { notifId: string; userId: string }) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notifId);
      if (error) throw error;
      return userId;
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['notifications', userId] });
      qc.invalidateQueries({ queryKey: ['notifications-unread', userId] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ notifId, userId }: { notifId: string; userId: string }) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notifId)
        .eq('user_id', userId);
      if (error) throw error;
      return userId;
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['notifications', userId] });
      qc.invalidateQueries({ queryKey: ['notifications-unread', userId] });
    },
  });
}
