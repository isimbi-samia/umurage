import React, { useState } from 'react';
import { Mic, Play, Pause, Headphones, Clock, User, Share2, Plus, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { AudioRecorderModal } from '@/components/features/AudioRecorderModal';
import { ShareToStoryModal } from '@/components/features/ShareToStoryModal';

export const OralHistory: React.FC = () => {
  const { isAuthenticated, openAuth } = useAuth();
  const { t } = useLanguage();
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [shareItem, setShareItem] = useState<any | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [activeAudioElem, setActiveAudioElem] = useState<HTMLAudioElement | null>(null);

  const { data: recordings = [], isLoading, refetch } = useQuery({
    queryKey: ['oral-histories'],
    queryFn: async () => {
      // Query heritage_recordings
      const { data: recs, error } = await supabase
        .from('heritage_recordings')
        .select(`
          id,
          user_id,
          title,
          description,
          audio_url,
          duration,
          storyteller_name,
          region,
          language,
          transcript,
          ai_translation,
          tags,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.warn('Heritage recordings query warning:', error);
      }

      // Also query audio posts
      const { data: audioPosts } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          title,
          description,
          media_url,
          thumbnail_url,
          duration,
          region,
          tags,
          created_at
        `)
        .eq('type', 'audio')
        .eq('published', true)
        .order('created_at', { ascending: false });

      // Populate authors from public_profiles
      const allUserIds = [
        ...new Set([
          ...(recs || []).map((r: any) => r.user_id),
          ...(audioPosts || []).map((p: any) => p.user_id),
        ].filter(Boolean))
      ];

      const profileMap = new Map<string, any>();
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, username, avatar_url, verified')
          .in('id', allUserIds);
        (profiles || []).forEach((p: any) => profileMap.set(p.id, p));
      }

      const mappedRecs = (recs || []).map((r: any) => {
        const u = profileMap.get(r.user_id);
        return {
          id: r.id,
          title: r.title,
          description: r.description || '',
          audio_url: r.audio_url,
          thumbnail: r.thumbnail_url || null,
          elder: r.storyteller_name || u?.full_name || u?.username || 'Elder Storyteller',
          avatar: u?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${r.storyteller_name || 'OralHistory'}`,
          region: r.region || 'Rwanda',
          language: r.language || 'Kinyarwanda',
          duration: r.duration || 'Audio Recording',
          transcript: r.transcript || null,
          ai_translation: r.ai_translation || null,
          tags: Array.isArray(r.tags) ? r.tags : [],
          verified: u?.verified ?? false,
          created_at: r.created_at,
        };
      });

      const mappedPosts = (audioPosts || []).map((p: any) => {
        const author = profileMap.get(p.user_id);
        return {
          id: p.id,
          title: p.title || 'Oral History Record',
          description: p.description || '',
          audio_url: p.media_url,
          thumbnail: p.thumbnail_url || null,
          elder: author?.full_name || author?.username || 'Community Elder',
          avatar: author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${p.title}`,
          region: p.region || 'Rwanda',
          language: 'Kinyarwanda',
          duration: p.duration || 'Audio Recording',
          transcript: null,
          ai_translation: null,
          tags: Array.isArray(p.tags) ? p.tags : [],
          verified: author?.verified ?? false,
          created_at: p.created_at,
        };
      });

      const combined = [...mappedRecs, ...mappedPosts];
      const seen = new Set();
      return combined.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    },
    staleTime: 30000,
  });

  const togglePlayAudio = (record: any) => {
    if (playingAudioId === record.id && activeAudioElem) {
      activeAudioElem.pause();
      setPlayingAudioId(null);
      setActiveAudioElem(null);
      return;
    }

    if (activeAudioElem) {
      activeAudioElem.pause();
    }

    if (!record.audio_url) {
      toast.error('Audio file is unavailable for this recording.');
      return;
    }

    const audio = new Audio(record.audio_url);
    audio.play().then(() => {
      setPlayingAudioId(record.id);
      setActiveAudioElem(audio);
    }).catch(err => {
      console.error('Audio play error:', err);
      toast.error('Unable to play audio stream. Please check your connection.');
      setPlayingAudioId(null);
      setActiveAudioElem(null);
    });

    audio.onended = () => {
      setPlayingAudioId(null);
      setActiveAudioElem(null);
    };
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-800/40 flex items-center justify-center">
              <Mic size={20} className="text-purple-400" />
            </div>
            <h1 className="font-cinzel text-3xl text-umurage-gold font-bold">{t('nav.oral')}</h1>
          </div>
          <button
            onClick={() => isAuthenticated ? setIsRecorderOpen(true) : openAuth('login')}
            className="btn-gold text-xs px-4 py-2.5 flex items-center gap-1.5 font-bold shadow-md"
          >
            <Plus size={15} /> Record Oral History
          </button>
        </div>
        <p className="text-umurage-muted text-sm max-w-2xl">
          Preserving elder voices, ancestral genealogies, and living community memories forever.
        </p>
      </div>

      {/* Record CTA Banner */}
      <div
        className="rounded-2xl p-6 mb-8 border border-purple-800/40 flex flex-col md:flex-row items-center gap-5"
        style={{ background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.2) 0%, rgba(30, 10, 50, 0.4) 100%)' }}
      >
        <div className="w-16 h-16 rounded-2xl bg-purple-800/30 border border-purple-700/40 flex items-center justify-center flex-shrink-0">
          <Mic size={32} className="text-purple-400 animate-pulse" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-umurage-cream font-semibold text-lg mb-1">Have an Elder Story or Community Record?</h3>
          <p className="text-umurage-muted text-xs">
            Record directly from your browser microphone with cultural permissions, region tagging, and permanent archive preservation.
          </p>
        </div>
        <button
          onClick={() => isAuthenticated ? setIsRecorderOpen(true) : openAuth('login')}
          className="btn-gold px-6 py-3 flex-shrink-0 font-bold text-xs"
        >
          {isAuthenticated ? 'Open Studio Recorder' : 'Sign In to Record'}
        </button>
      </div>

      {/* Archive Grid */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Oral History Archive</h2>
        <span className="text-xs text-umurage-muted font-medium">{recordings.length} recordings preserved</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-umurage-muted">
          <Loader2 size={24} className="mr-3 animate-spin text-purple-400" />
          Loading oral history recordings...
        </div>
      ) : recordings.length === 0 ? (
        <div className="umurage-card rounded-2xl p-12 text-center border border-dashed border-umurage-border">
          <Mic size={40} className="text-purple-400/40 mx-auto mb-3" />
          <h3 className="text-umurage-cream font-semibold text-base mb-2">No oral histories have been shared yet</h3>
          <p className="text-umurage-muted text-xs mb-5">Be the first to record an elder narrative for future generations.</p>
          <button
            onClick={() => isAuthenticated ? setIsRecorderOpen(true) : openAuth('login')}
            className="btn-gold text-xs px-5 py-2.5 font-semibold"
          >
            Start Recording
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {recordings.map((record: any) => {
            const isPlaying = playingAudioId === record.id;
            return (
              <div key={record.id} className="umurage-card rounded-2xl p-5 flex flex-col sm:flex-row gap-4 group transition-all duration-200 hover:border-purple-800/40">
                {record.thumbnail ? (
                  <img
                    src={record.thumbnail}
                    alt={record.title}
                    className="w-full sm:w-36 h-28 rounded-xl object-cover flex-shrink-0 group-hover:scale-[1.02] transition-transform"
                  />
                ) : (
                  <div className="w-full sm:w-36 h-28 rounded-xl bg-[#251528] border border-purple-900/40 flex flex-col items-center justify-center flex-shrink-0 text-center p-2">
                    <Headphones size={28} className="text-purple-400 mb-1.5" />
                    <span className="text-[10px] text-purple-300 font-semibold truncate max-w-full">{record.language}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-umurage-cream font-semibold text-base leading-snug group-hover:text-umurage-gold transition-colors">
                        {record.title}
                      </h3>
                      {record.description && (
                        <p className="text-umurage-muted text-xs line-clamp-2 mt-1">{record.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => togglePlayAudio(record)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isPlaying
                            ? 'bg-purple-600 text-white animate-pulse'
                            : 'bg-umurage-gold/20 border border-umurage-gold/30 hover:bg-umurage-gold/40 text-umurage-gold'
                        }`}
                      >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                      </button>

                      {isAuthenticated && (
                        <button
                          onClick={() => setShareItem(record)}
                          className="w-10 h-10 rounded-full bg-umurage-card border border-umurage-border hover:border-purple-500 text-umurage-subtle hover:text-purple-300 flex items-center justify-center transition-colors"
                          title="Share to Story"
                        >
                          <Share2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Persisted AI Transcript if present */}
                  {record.transcript && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-purple-950/30 border border-purple-800/30 text-xs">
                      <span className="text-[10px] font-semibold text-purple-300 block mb-0.5">ARCHIVED TRANSCRIPT</span>
                      <p className="text-umurage-cream text-[11px] leading-relaxed line-clamp-3">{record.transcript}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <img src={record.avatar} alt={record.elder} className="w-5 h-5 rounded-full object-cover border border-purple-800/40" />
                    <span className="text-umurage-muted text-xs">{record.elder}</span>
                    {record.verified && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-green-900/30 text-green-400 border border-green-800/40 font-semibold">
                        Verified Storyteller
                      </span>
                    )}
                    {record.tags && record.tags.length > 0 && (
                      <div className="flex gap-1 ml-auto">
                        {record.tags.slice(0, 2).map((t: string, idx: number) => (
                          <span key={idx} className="text-[9px] bg-purple-900/30 border border-purple-800/30 text-purple-300 px-1.5 py-0.5 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-3 pt-2 border-t border-umurage-border/40 text-umurage-subtle text-xs">
                    <span className="flex items-center gap-1"><User size={12} />{record.region}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{record.duration}</span>
                    <span className="flex items-center gap-1"><Headphones size={12} />{record.language}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Audio Studio Recorder Modal */}
      <AudioRecorderModal
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Share to Story Modal */}
      {shareItem && (
        <ShareToStoryModal
          isOpen={!!shareItem}
          onClose={() => setShareItem(null)}
          audioItem={{
            id: shareItem.id,
            title: shareItem.title,
            media_url: shareItem.audio_url,
            storyteller_name: shareItem.elder,
          }}
        />
      )}
    </div>
  );
};

export default OralHistory;
