import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, ChevronLeft, ChevronRight, Clock3, Trash2, Loader2, Plus, Radio, Music, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useMarkStoryViewed, useStories, useDeleteStory, Story } from '@/hooks/useStories';
import { extractSoundFromCaption } from '@/lib/soundMetadata';
import { toast } from 'sonner';

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ story, onClose, onPrev, onNext, hasPrev, hasNext }) => {
  const { user } = useAuth();
  const markStoryViewed = useMarkStoryViewed();
  const deleteStory = useDeleteStory();
  const viewedIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { cleanCaption, sound } = extractSoundFromCaption(story.caption);

  useEffect(() => {
    if (viewedIdRef.current !== story.id) {
      viewedIdRef.current = story.id;
      markStoryViewed.mutate(story.id);
    }
  }, [story.id, markStoryViewed]);

  useEffect(() => {
    if (sound?.url) {
      const audio = new Audio(sound.url);
      audioRef.current = audio;
      audio.loop = true;
      audio.play().catch(() => {});
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [story.id, sound?.url]);

  const expiresIn = Math.max(0, Math.floor((new Date(story.expires_at).getTime() - Date.now()) / 1000 / 60 / 60));
  const isVideo = story.type === 'video';

  const handleDelete = () => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this story?')) {
      deleteStory.mutate(
        { storyId: story.id, userId: user.id },
        {
          onSuccess: () => { onClose(); },
          onError: (err: unknown) => toast.error((err as Error).message || 'Failed to delete story'),
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative h-[85vh] w-full max-w-md overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-[#0f0905]">
        <button onClick={onClose} className="absolute right-3 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80">
          <X size={16} />
        </button>

        {user?.id === story.user_id && (
          <button
            onClick={handleDelete}
            disabled={deleteStory.isPending}
            className="absolute left-3 top-4 z-20 flex h-8 items-center gap-1.5 rounded-full bg-black/60 px-3 text-xs text-white transition-colors hover:bg-red-900/80"
          >
            {deleteStory.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Delete Story
          </button>
        )}

        <div className="flex h-full w-full items-center justify-center bg-[#0f0905]">
          {isVideo ? (
            <video
              src={story.media_url}
              autoPlay
              playsInline
              controls
              muted={sound ? (sound.muteOriginalAudio ?? true) : false}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <img src={story.media_url} alt={cleanCaption || 'Story'} className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />
          <div className="absolute left-3 right-3 top-14 z-10 flex items-center justify-between rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2">
              <img
                src={story.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${story.author?.username}`}
                alt={story.author?.username || 'User'}
                className="h-7 w-7 rounded-full border border-white/20 object-cover"
              />
              <p className="font-semibold text-xs">{story.author?.username || 'User'}</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/70">
              <Clock3 size={11} />
              <span>{expiresIn}h left</span>
            </div>
          </div>

          {(cleanCaption || sound) && (
            <div className="absolute bottom-6 left-4 right-4 z-10 rounded-xl bg-black/75 p-3 backdrop-blur-sm border border-white/10 text-center space-y-1.5">
              {sound && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#c8960c]/20 border border-[#c8960c]/40 text-[#d4a24c] text-[11px] font-medium mx-auto">
                  <Music size={12} className="animate-pulse" />
                  <span className="truncate max-w-[200px]">{sound.title} — {sound.artist}</span>
                </div>
              )}
              {cleanCaption && <p className="text-xs text-white/95 leading-relaxed">{cleanCaption}</p>}
              <div className="flex items-center justify-center gap-1 text-[10px] text-white/60">
                <Eye size={11} />
                <span>{story.views} views</span>
              </div>
            </div>
          )}
        </div>

        {hasPrev && (
          <button onClick={onPrev} className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/70">
            <ChevronLeft size={18} />
          </button>
        )}
        {hasNext && (
          <button onClick={onNext} className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/70">
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

const StoriesPage: React.FC = () => {
  const { isAuthenticated, openAuth } = useAuth();
  const navigate = useNavigate();
  const [viewingIdx, setViewingIdx] = useState<number | null>(null);
  const { data: stories = [], isLoading } = useStories();

  const handleStoryClick = (idx: number) => {
    setViewingIdx(idx);
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio size={22} className="text-[#d4a24c]" />
            <h1 className="font-cinzel text-2xl text-[#d4a24c] font-bold">Cultural Stories</h1>
          </div>
          <p className="text-xs text-[#a89078]">24-hour visual & video moments shared by the Umurage community.</p>
        </div>

        <button
          onClick={() => (!isAuthenticated ? openAuth('login') : navigate('/upload'))}
          className="btn-gold py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>Add Story</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="text-[#d4a24c] animate-spin" />
        </div>
      ) : stories.length === 0 ? (
        <div className="rounded-xl border border-[#2d1e13] bg-[#160f09] py-16 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#24170d] flex items-center justify-center mx-auto mb-3 text-[#d4a24c]">
            <Radio size={22} />
          </div>
          <h3 className="text-sm font-semibold text-[#f2e6d8] mb-1">No active stories right now</h3>
          <p className="text-xs text-[#a89078] mb-4">Be the first to share a 24-hour story with the community!</p>
          <button
            onClick={() => (!isAuthenticated ? openAuth('login') : navigate('/upload'))}
            className="btn-gold py-2 px-4 text-xs"
          >
            Create a Story
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {stories.map((story, idx) => {
            const { cleanCaption, sound } = extractSoundFromCaption(story.caption);
            return (
              <div
                key={story.id}
                onClick={() => handleStoryClick(idx)}
                className="relative cursor-pointer overflow-hidden rounded-xl border border-[#2d1e13] bg-[#1a110a] h-64 group hover:border-[#c8960c]/60 transition-all duration-200"
              >
                {story.type === 'video' ? (
                  <video src={story.media_url} className="h-full w-full object-cover" />
                ) : (
                  <img src={story.media_url} alt={cleanCaption || 'Story'} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-xs rounded-full p-1 pr-2.5">
                  <img
                    src={story.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${story.author?.username}`}
                    alt={story.author?.username || 'User'}
                    className="w-5 h-5 rounded-full object-cover border border-white/20"
                  />
                  <span className="text-[10px] font-medium text-white truncate max-w-[80px]">
                    {story.author?.username || 'User'}
                  </span>
                </div>

                <div className="absolute bottom-2 left-2 right-2 space-y-1">
                  {sound && (
                    <div className="inline-flex items-center gap-1 text-[9px] text-[#d4a24c] bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs border border-[#c8960c]/30 truncate max-w-full">
                      <Music size={9} />
                      <span className="truncate">{sound.title}</span>
                    </div>
                  )}
                  {cleanCaption && <p className="text-xs text-white line-clamp-2 leading-snug">{cleanCaption}</p>}
                  <div className="flex items-center gap-1 text-[10px] text-white/70">
                    <Eye size={10} />
                    <span>{story.views} views</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewingIdx !== null && stories[viewingIdx] && (
        <StoryViewer
          story={stories[viewingIdx]}
          onClose={() => setViewingIdx(null)}
          onPrev={() => setViewingIdx(p => (p !== null && p > 0 ? p - 1 : p))}
          onNext={() => setViewingIdx(p => (p !== null && p < stories.length - 1 ? p + 1 : p))}
          hasPrev={viewingIdx > 0}
          hasNext={viewingIdx < stories.length - 1}
        />
      )}
    </div>
  );
};

export default StoriesPage;