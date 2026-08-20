import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RWANDA_CULTURAL_MUSIC, RwandanCulturalMusic } from '@/data/rwandaCulturalMusic';

export function useCulturalMusic() {
  return useQuery<RwandanCulturalMusic[]>({
    queryKey: ['cultural-music'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('cultural_music')
          .select('*')
          .eq('is_active', true)
          .order('title', { ascending: true });

        if (!error && data && data.length > 0) {
          return data as RwandanCulturalMusic[];
        }
      } catch {
        // Fallback to verified local authentic dataset if table isn't created in Supabase schema yet
      }
      return RWANDA_CULTURAL_MUSIC;
    },
    staleTime: 60000 * 5, // 5 minutes
  });
}
