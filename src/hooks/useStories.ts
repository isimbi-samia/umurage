import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const STORIES_BUCKET = 'stories'; // change this if stories have their own dedicated bucket

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  type: string;
  caption: string | null;
  views: number;
  created_at: string;
  expires_at: string;
  author: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    verified: boolean;
  };
}

// ── Load active (non-expired) stories ────────────────────────────────────
export function useStories() {
  return useQuery<Story[]>({
    queryKey: ['stories'],
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data: storiesData, error } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', now)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!storiesData || storiesData.length === 0) return [];

      const userIds = [...new Set(storiesData.map((s) => s.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, verified')
        .in('id', userIds);
      if (profilesError) throw profilesError;

      const profileMap = new Map((profilesData || []).map((p) => [p.id, p]));

      return storiesData.map((s) => ({
        ...s,
        author: profileMap.get(s.user_id) || {
          id: s.user_id,
          username: null,
          avatar_url: null,
          verified: false,
        },
      })) as Story[];
    },
    staleTime: 30000,
  });
}

// ── Upload a new story ───────────────────────────────────────────────────
export function useUploadStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file, userId, type, caption,
    }: { file: File; userId: string; type: 'image' | 'video'; caption?: string }) => {
      const ext = file.name.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg');
      const path = `${userId}/stories/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(STORIES_BUCKET)
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(STORIES_BUCKET).getPublicUrl(path);
      const mediaUrl = urlData.publicUrl;

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error: insertError } = await supabase.from('stories').insert({
        user_id: userId,
        media_url: mediaUrl,
        type,
        caption: caption || null,
        views: 0,
        expires_at: expiresAt,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

// ── Increment view count when a story is opened ──────────────────────────
export function useMarkStoryViewed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (storyId: string) => {
      const { data: current, error: fetchError } = await supabase
        .from('stories')
        .select('views')
        .eq('id', storyId)
        .single();
      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('stories')
        .update({ views: (current?.views ?? 0) + 1 })
        .eq('id', storyId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

// ── Delete a story (owner only) ──────────────────────────────────────────
export function useDeleteStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ storyId, userId }: { storyId: string; userId: string }) => {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', userId); // client-side guard; make sure RLS also restricts deletes to the owner
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}