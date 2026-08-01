import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Eye, ChevronLeft, ChevronRight, Sparkles, Clock3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useMarkStoryViewed, useStories, useStoryAnalytics } from '@/hooks/useStories';

interface StoryViewerProps {
  story: {
    id: string;
    title: string;
    mediaUrl?: string | null;
    thumbnailUrl?: string | null;
    user: { name: string; avatar: string; verified: boolean };
    createdAt: string;
    hasNew?: boolean;
    isAdd?: boolean;
    expiresAt?: string | null;
  };
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ story, onClose, onPrev, onNext, hasPrev, hasNext }) => {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user } = useAuth();
  const markStoryViewed = useMarkStoryViewed();
  const { data: analyticsCount = 0 } = useStoryAnalytics(story.id);

  useEffect(() => {
    markStoryViewed.mutate({ storyId: story.id, userId: user?.id });
  }, [story.id, user?.id]);

  useEffect(() => {
    setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (hasNext) onNext();
          else onClose();
          return 100;
        }
        return p + 1;
      });
    }, 50);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [story.id, hasNext, onNext, onClose]);

  if (story.isAdd) return null;

  const expiresIn = story.expiresAt ? Math.max(0, Math.floor((new Date(story.expiresAt).getTime() - Date.now()) / 1000 / 60 / 60)) : 24;
  const isVideo = story.mediaUrl?.match(/\.(mp4|mov|webm|m4v|avi|mkv)$/i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative h-[88vh] w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
        <div className="absolute left-3 right-3 top-3 z-20 flex gap-1">
          <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <div className="h-full rounded-full bg-white transition-none" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <button onClick={onClose} className="absolute right-3 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60">
          <X size={16} />
        </button>

        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#2e1c10] to-[#0f0905]">
          {story.mediaUrl && isVideo ? (
            <video src={story.mediaUrl} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
          ) : story.mediaUrl ? (
            <img src={story.mediaUrl} alt={story.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <img src={story.thumbnailUrl || story.user.avatar} alt={story.title} className="absolute inset-0 h-full w-full object-cover opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
          <div className="absolute left-3 right-3 top-12 z-10 flex items-center justify-between rounded-full bg-black/30 px-3 py-2 text-xs text-white backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <img src={story.user.avatar} alt={story.user.name} className="h-8 w-8 rounded-full border border-white/20 object-cover" />
              <div>
                <p className="font-semibold">{story.user.name}</p>
                <p className="text-[10px] text-white/70">{story.title}</p>
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
                <span className="text-xs">{analyticsCount} views</span>
              </div>
              <p className="text-lg font-semibold text-white">{story.title}</p>
              <p className="mt-2 text-sm text-white/75">{story.user.verified ? 'Verified creator' : 'Community story'}</p>
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
  const { t } = useLanguage();
  const { isAuthenticated, openAuth } = useAuth();
  const navigate = useNavigate();
  const [viewingIdx, setViewingIdx] = useState<number | null>(null);
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());

  const { data: liveStories, isLoading } = useStories();

  const dbStories = (liveStories || []).map(s => ({
    id: s.id,
    title: s.title,
    user: {
      name: s.author?.username || 'User',
      avatar: s.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${s.author?.username || 'U'}`,
      verified: s.author?.verified || false,
    },
    createdAt: s.created_at,
    hasNew: false,
    isAdd: false,
    mediaUrl: s.media_url,
    thumbnailUrl: s.thumbnail_url,
    expiresAt: s.story_expires_at,
  }));

  const activeStories = dbStories.filter(s => {
    if (!s.createdAt) return true;
    const expiresAt = s.expiresAt ? new Date(s.expiresAt).getTime() : new Date(new Date(s.createdAt).getTime() + 24 * 60 * 60 * 1000).getTime();
    return Date.now() < expiresAt;
  });

  const handleStoryClick = (storyId: string) => {
    const activeIdx = activeStories.findIndex(s => s.id === storyId);
    if (activeIdx >= 0) {
      setViewingIdx(activeIdx);
      setViewedStories(prev => new Set([...prev, storyId]));
    }
  };

  const handlePrev = () => setViewingIdx(p => (p !== null && p > 0 ? p - 1 : p));
  const handleNext = () => {
    setViewingIdx(p => {
      if (p !== null && p < activeStories.length - 1) {
        setViewedStories(prev => new Set([...prev, activeStories[p + 1].id]));
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
              onClick={() => (!isAuthenticated ? openAuth('login') : navigate('/upload'))}
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
            ) : activeStories.length === 0 ? (
              <div className="flex items-center gap-1 px-2 text-[10px] text-umurage-muted">
                <Clock3 size={12} />
                <span>No active stories right now.</span>
              </div>
            ) : (
              activeStories.map(story => (
                <button
                  key={story.id}
                  onClick={() => handleStoryClick(story.id)}
                  aria-label={story.title || story.user.name}
                  className="flex flex-col items-center gap-1 px-1"
                >
                  <div className={`story-ring ${!viewedStories.has(story.id) ? 'has-new' : ''}`}>
                    <div className="story-ring-inner h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-transparent">
                      <img src={story.user.avatar} alt={story.user.name} className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <span className="text-[10px] text-umurage-cream/70 truncate max-w-[56px] text-center">{story.user.name.split(' ')[0]}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {viewingIdx !== null && activeStories[viewingIdx] && (
        <StoryViewer
          story={activeStories[viewingIdx]}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={viewingIdx > 0}
          hasNext={viewingIdx < activeStories.length - 1}
        />
      )}
    </>
  );
};

export default StoriesBar;