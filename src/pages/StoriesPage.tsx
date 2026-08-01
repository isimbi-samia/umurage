import React, { useState } from 'react';
import { X, Eye, ChevronLeft, ChevronRight, Sparkles, Clock3, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useMarkStoryViewed, useStories, useDeleteStory, Story } from '@/hooks/useStories';
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
  const viewedIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (viewedIdRef.current !== story.id) {
      viewedIdRef.current = story.id;
      markStoryViewed.mutate(story.id);
    }
  }, [story.id]);

  const expiresIn = Math.max(0, Math.floor((new Date(story.expires_at).getTime() - Date.now()) / 1000 / 60 / 60));
  const isVideo = story.type === 'video';

  const handleDelete = () => {
    if (!user) return;
    deleteStory.mutate(
      { storyId: story.id, userId: user.id },
      {
        onSuccess: () => { toast.success('Story deleted'); onClose(); },
        onError: (err: unknown) => toast.error((err as Error).message || 'Failed to delete story'),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative h-[88vh] w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
        <button onClick={onClose} className="absolute right-3 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60">
          <X size={16} />
        </button>

        {user?.id === story.user_id && (
          <button
            onClick={handleDelete}
            disabled={deleteStory.isPending}
            className="absolute left-3 top-4 z-20 flex h-8 items-center gap-1.5 rounded-full bg-black/40 px-3 text-xs text-white transition-colors hover:bg-red-900/60"
          >
            {deleteStory.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Delete
          </button>
        )}

        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#2e1c10] to-[#0f0905]">
          {isVideo ? (
            <video src={story.media_url} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <img src={story.media_url} alt={story.caption || 'Story'} className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
          <div className="absolute left-3 right-3 top-12 z-10 flex items-center justify-between rounded-full bg-black/30 px-3 py-2 text-xs text-white backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <img
                src={story.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${story.author?.username}`}
                alt={story.author?.username || 'User'}
                className="h-8 w-8 rounded-full border border-white/20 object-cover"
              />
              <div>
                <p className="font-semibold">{story.author?.username || 'User'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/80">
              <Clock3 size={12} />
              <span>{expiresIn}h left</span>
            </div>
          </div>

          <div className="relative z-10 w-full p-5 pt-28 text-center">
            <div className="rounded-[20px] border border-white/10 bg-black/30 p-4 backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-center gap-2 text-amber-100">
                <Eye size={14} />
                <span className="text-xs">{story.views} views</span>
              </div>
              {story.caption && <p className="mt-2 text-sm text-white/85">{story.caption}</p>}
              <p className="mt-2 text-sm text-white/60">{story.author?.verified ? 'Verified creator' : 'Community story'}</p>
            </div>
          </div>
        </div>

        {hasPrev && (
          <button onClick={onPrev} className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50">
            <ChevronLeft size={18} />
          </button>
        )}
        {hasNext && (
          <button onClick={onNext} className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50">
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

const StoriesBar: React.FC = () => {
  const { isAuthenticated, openAuth } = useAuth();
  const navigate = useNavigate();
  const [viewingIdx, setViewingIdx] = useState<number | null>(null);
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());

  const { data: stories = [], isLoading } = useStories();

  const handleStoryClick = (storyId: string) => {
    const idx = stories.findIndex(s => s.id === storyId);
    if (idx >= 0) {
      setViewingIdx(idx);
      setViewedStories(prev => new Set([...prev, storyId]));
    }
  };

  const handlePrev = () => setViewingIdx(p => (p !== null && p > 0 ? p - 1 : p));
  const handleNext = () => {
    setViewingIdx(p => {
      if (p !== null && p < stories.length - 1) {
        setViewedStories(prev => new Set([...prev, stories[p + 1].id]));
        return p + 1;
      }
      return p;
    });
  };
  const handleClose = () => setViewingIdx(null);

  return (
    <>
      <div className="w-full sticky top-16 z-40 backdrop-blur-sm bg-black/30 border-b border-white/5">
        <div className="mx-auto max-w-4xl px-0 lg:px-0">
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => (!isAuthenticated ? openAuth('login') : navigate('/stories'))}
              aria-label="Add your story"
              className="flex flex-col items-center gap-1 px-1"
            >
              <div className="story-ring has-new">
                <div className="story-ring-inner h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-transparent text-umurage-gold text-lg font-bold">
                  +
                </div>
              </div>
              <span className="text-[10px] text-umurage-cream/70">Your Story</span>
            </button>

            {isLoading ? (
              <div className="flex items-center gap-1 px-1">
                <Sparkles size={14} className="text-umurage-gold animate-spin" />
                <span className="text-[10px] text-umurage-muted">Loading stories...</span>
              </div>
            ) : stories.length === 0 ? (
              <div className="flex items-center gap-1 px-2 text-[10px] text-umurage-muted">
                <Clock3 size={12} />
                <span>No active stories right now.</span>
              </div>
            ) : (
              stories.map(story => (
                <button
                  key={story.id}
                  onClick={() => handleStoryClick(story.id)}
                  aria-label={story.author?.username || 'Story'}
                  className="flex flex-col items-center gap-1 px-1"
                >
                  <div className={`story-ring ${!viewedStories.has(story.id) ? 'has-new' : ''}`}>
                    <div className="story-ring-inner h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-transparent">
                      <img
                        src={story.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${story.author?.username}`}
                        alt={story.author?.username || 'User'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-umurage-cream/70 truncate max-w-[56px] text-center">
                    {(story.author?.username || 'User').split(' ')[0]}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {viewingIdx !== null && stories[viewingIdx] && (
        <StoryViewer
          story={stories[viewingIdx]}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={viewingIdx > 0}
          hasNext={viewingIdx < stories.length - 1}
        />
      )}
    </>
  );
};

export default StoriesBar;