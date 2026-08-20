import React, { useState } from 'react';
import { X, Eye, ChevronLeft, ChevronRight, Clock3, Trash2, Loader2, Plus } from 'lucide-react';
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
      <div className="relative h-[85vh] w-full max-w-md overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-[#0f0905]">
        <button onClick={onClose} className="absolute right-3 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/80">
          <X size={16} />
        </button>

        {user?.id === story.user_id && (
          <button
            onClick={handleDelete}
            disabled={deleteStory.isPending}
            className="absolute left-3 top-4 z-20 flex h-8 items-center gap-1.5 rounded-full bg-black/50 px-3 text-xs text-white transition-colors hover:bg-red-900/60"
          >
            {deleteStory.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Delete
          </button>
        )}

        <div className="flex h-full w-full items-center justify-center bg-[#0f0905]">
          {isVideo ? (
            <video src={story.media_url} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <img src={story.media_url} alt={story.caption || 'Story'} className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
          <div className="absolute left-3 right-3 top-12 z-10 flex items-center justify-between rounded-full bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur-sm border border-white/10">
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

          {story.caption && (
            <div className="absolute bottom-6 left-4 right-4 z-10 rounded-xl bg-black/60 p-3 backdrop-blur-sm border border-white/10 text-center">
              <p className="text-xs text-white/90 leading-relaxed">{story.caption}</p>
              <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-white/60">
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
      <div className="w-full py-2 border-b border-[#291b10] bg-[#140d08]/60">
        <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-hide">
          {/* Add Your Story Item */}
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
          ) : stories.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#a89078] italic">
              <span>No active stories right now. Share the first cultural story!</span>
            </div>
          ) : (
            stories.map(story => {
              const isViewed = viewedStories.has(story.id);
              return (
                <button
                  key={story.id}
                  onClick={() => handleStoryClick(story.id)}
                  className="flex flex-col items-center gap-1.5 group flex-shrink-0"
                >
                  <div className={`p-0.5 rounded-full border ${!isViewed ? 'border-[#c8960c]' : 'border-[#382415]'}`}>
                    <img
                      src={story.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${story.author?.username}`}
                      alt={story.author?.username || 'User'}
                      className="w-11 h-11 rounded-full object-cover border border-[#140d08]"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-[#c2b29f] truncate max-w-[60px] text-center group-hover:text-[#f2e6d8]">
                    {(story.author?.username || 'User').split(' ')[0]}
                  </span>
                </button>
              );
            })
          )}
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