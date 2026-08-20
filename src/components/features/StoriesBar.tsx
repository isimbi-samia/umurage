import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, ChevronLeft, ChevronRight, Clock3, Trash2, Loader2, Plus, Music } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useMarkStoryViewed, useStoriesGroupedByUser, useDeleteStory, UserStoriesGroup, Story } from '@/hooks/useStories';
import { extractSoundFromCaption } from '@/lib/soundMetadata';
import { toast } from 'sonner';

interface GroupedStoryViewerProps {
  userGroups: UserStoriesGroup[];
  initialGroupIdx: number;
  initialStoryIdx?: number;
  onClose: () => void;
}

export const GroupedStoryViewer: React.FC<GroupedStoryViewerProps> = ({
  userGroups,
  initialGroupIdx,
  initialStoryIdx = 0,
  onClose,
}) => {
  const { user } = useAuth();
  const markStoryViewed = useMarkStoryViewed();
  const deleteStory = useDeleteStory();

  const [groupIdx, setGroupIdx] = useState(initialGroupIdx);
  const [storyIdx, setStoryIdx] = useState(initialStoryIdx);

  const viewedIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentGroup = userGroups[groupIdx];
  const currentStory: Story | undefined = currentGroup?.stories[storyIdx];

  const { cleanCaption, sound } = extractSoundFromCaption(currentStory?.caption);

  // ── Handle story view tracking per individual story ─────────────────────
  useEffect(() => {
    if (currentStory && viewedIdRef.current !== currentStory.id) {
      viewedIdRef.current = currentStory.id;
      markStoryViewed.mutate(currentStory.id);
    }
  }, [currentStory?.id, markStoryViewed]);

  // ── Handle story background music switching ──────────────────────────────
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

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
  }, [currentStory?.id, sound?.url]);

  // ── Handle Next navigation ─────────────────────────────────────────────
  const handleNext = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!currentGroup) {
      onClose();
      return;
    }

    if (storyIdx < currentGroup.stories.length - 1) {
      setStoryIdx(prev => prev + 1);
    } else if (groupIdx < userGroups.length - 1) {
      setGroupIdx(prev => prev + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  };

  // ── Handle Prev navigation ─────────────────────────────────────────────
  const handlePrev = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (storyIdx > 0) {
      setStoryIdx(prev => prev - 1);
    } else if (groupIdx > 0) {
      const prevGroup = userGroups[groupIdx - 1];
      setGroupIdx(prev => prev - 1);
      setStoryIdx(prevGroup ? prevGroup.stories.length - 1 : 0);
    } else {
      onClose();
    }
  };

  // ── Auto advance for Image stories (5 seconds) ─────────────────────────
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (currentStory && currentStory.type !== 'video') {
      timerRef.current = setTimeout(() => {
        handleNext();
      }, 5000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentStory?.id, storyIdx, groupIdx]);

  if (!currentGroup || !currentStory) return null;

  const expiresIn = Math.max(0, Math.floor((new Date(currentStory.expires_at).getTime() - Date.now()) / 1000 / 60 / 60));
  const isVideo = currentStory.type === 'video';

  const handleDelete = () => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this story?')) {
      deleteStory.mutate(
        { storyId: currentStory.id, userId: user.id },
        {
          onSuccess: () => {
            if (currentGroup.stories.length === 1) {
              onClose();
            } else {
              handleNext();
            }
          },
          onError: (err: unknown) => toast.error((err as Error).message || 'Failed to delete story'),
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-md animate-fade-in">
      <div className="relative h-[86vh] w-full max-w-md overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-[#0f0905]">
        {/* Top Segmented Progress Indicators */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {currentGroup.stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  idx < storyIdx
                    ? 'w-full bg-white'
                    : idx === storyIdx
                    ? 'w-full bg-[#c8960c] animate-pulse'
                    : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-6 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
        >
          <X size={16} />
        </button>

        {/* Delete Button for Story Owner */}
        {user?.id === currentStory.user_id && (
          <button
            onClick={handleDelete}
            disabled={deleteStory.isPending}
            className="absolute left-3 top-6 z-30 flex h-7 items-center gap-1.5 rounded-full bg-black/60 px-3 text-xs text-white transition-colors hover:bg-red-900/70"
          >
            {deleteStory.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            <span>Delete</span>
          </button>
        )}

        {/* Media Player Container */}
        <div className="flex h-full w-full items-center justify-center bg-[#0f0905] relative">
          {isVideo ? (
            <video
              key={currentStory.id}
              src={currentStory.media_url}
              autoPlay
              playsInline
              controls
              onEnded={handleNext}
              muted={sound ? (sound.muteOriginalAudio ?? true) : false}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <img
              key={currentStory.id}
              src={currentStory.media_url}
              alt={cleanCaption || 'Story'}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

          {/* User Header */}
          <div className="absolute left-3 right-3 top-14 z-20 flex items-center justify-between rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2">
              <img
                src={currentGroup.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${currentGroup.author?.username}`}
                alt={currentGroup.author?.username || 'User'}
                className="h-7 w-7 rounded-full border border-white/20 object-cover"
              />
              <div>
                <p className="font-semibold text-xs leading-tight">{currentGroup.author?.username || 'User'}</p>
                <p className="text-[10px] text-white/70 leading-tight">Story {storyIdx + 1} of {currentGroup.stories.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/70">
              <Clock3 size={11} />
              <span>{expiresIn}h left</span>
            </div>
          </div>

          {/* Caption & Sound Info Overlay */}
          {(cleanCaption || sound) && (
            <div className="absolute bottom-6 left-4 right-4 z-20 rounded-xl bg-black/75 p-3 backdrop-blur-sm border border-white/10 text-center space-y-1.5">
              {sound && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#c8960c]/20 border border-[#c8960c]/40 text-[#d4a24c] text-[11px] font-medium mx-auto">
                  <Music size={12} className="animate-pulse" />
                  <span className="truncate max-w-[220px]">{sound.title} — {sound.artist}</span>
                </div>
              )}
              {cleanCaption && <p className="text-xs text-white/95 leading-relaxed">{cleanCaption}</p>}
              <div className="flex items-center justify-center gap-1 text-[10px] text-white/60">
                <Eye size={11} />
                <span>{currentStory.views} views</span>
              </div>
            </div>
          )}
        </div>

        {/* Left & Right Touch Areas / Navigation Chevrons */}
        <button
          onClick={handlePrev}
          className="absolute left-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/70"
          title="Previous story"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/70"
          title="Next story"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

const StoriesBar: React.FC = () => {
  const { isAuthenticated, openAuth } = useAuth();
  const navigate = useNavigate();
  const [viewingGroupIdx, setViewingGroupIdx] = useState<number | null>(null);

  const { data: userGroups = [], isLoading } = useStoriesGroupedByUser();

  return (
    <>
      <div className="w-full py-2 border-b border-[#291b10] bg-[#140d08]/60">
        <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-hide">
          {/* Add Your Story Button */}
          <button
            type="button"
            onClick={() => (!isAuthenticated ? openAuth('login') : navigate('/upload'))}
            className="flex flex-col items-center gap-1.5 group flex-shrink-0"
          >
            <div className="w-12 h-12 rounded-full border border-dashed border-[#c8960c]/60 bg-[#1e130a] flex items-center justify-center text-[#d4a24c] transition-colors group-hover:border-[#c8960c] group-hover:bg-[#28180d]">
              <Plus size={18} />
            </div>
            <span className="text-[11px] font-medium text-[#c2b29f] group-hover:text-[#f2e6d8] transition-colors">Your Story</span>
          </button>

          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#a89078]">
              <Loader2 size={13} className="text-[#d4a24c] animate-spin" />
              <span>Loading stories...</span>
            </div>
          ) : userGroups.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#a89078] italic">
              <span>No active stories right now. Share the first cultural story!</span>
            </div>
          ) : (
            userGroups.map((group, groupIdx) => {
              const username = group.author?.username || 'User';
              const storyCount = group.stories.length;

              return (
                <button
                  key={group.user_id}
                  onClick={() => setViewingGroupIdx(groupIdx)}
                  className="flex flex-col items-center gap-1.5 group flex-shrink-0 relative"
                >
                  <div className="p-0.5 rounded-full border border-[#c8960c] bg-[#24170d]">
                    <img
                      src={group.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${username}`}
                      alt={username}
                      className="w-11 h-11 rounded-full object-cover border border-[#140d08]"
                    />
                  </div>
                  {storyCount > 1 && (
                    <span className="absolute top-0 right-0 bg-[#c8960c] text-black text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-black shadow-xs">
                      {storyCount}
                    </span>
                  )}
                  <span className="text-[11px] font-medium text-[#c2b29f] truncate max-w-[64px] text-center group-hover:text-[#f2e6d8]">
                    {username.split(' ')[0]}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {viewingGroupIdx !== null && userGroups[viewingGroupIdx] && (
        <GroupedStoryViewer
          userGroups={userGroups}
          initialGroupIdx={viewingGroupIdx}
          onClose={() => setViewingGroupIdx(null)}
        />
      )}
    </>
  );
};

export default StoriesBar;