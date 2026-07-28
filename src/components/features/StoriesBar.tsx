import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Eye, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { STORIES } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useStories } from '@/hooks/useStories';

interface StoryViewerProps {
  story: {
    id: string;
    title: string;
    user: { name: string; avatar: string; verified: boolean };
    createdAt: string;
    hasNew?: boolean;
    isAdd?: boolean;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative h-[82vh] w-full max-w-sm overflow-hidden rounded-[28px] border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
        <div className="absolute left-3 right-3 top-3 z-20 flex gap-1">
          <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <div className="h-full rounded-full bg-white transition-none" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <button onClick={onClose} className="absolute right-3 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60">
          <X size={16} />
        </button>

        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#2e1c10] to-[#0f0905] p-6">
          <img
            src={story.user.avatar || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&h=400&fit=crop'}
            alt={story.user.name}
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,162,76,0.26),_transparent_38%)]" />
          <div className="relative z-10 text-center p-4">
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 border-umurage-gold/50 bg-black/20 p-1 shadow-[0_0_20px_rgba(212,162,76,0.3)]">
              <img src={story.user.avatar} alt={story.user.name} className="h-full w-full rounded-full object-cover" />
            </div>
            <p className="text-lg font-semibold text-white">{story.user.name}</p>
            {story.user.verified && <p className="mt-1 text-xs text-umurage-gold">✓ Verified Creator</p>}
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

        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="text-center text-xs text-amber-50/70">Swipe or tap the sides to explore • Tap ✕ to close</p>
        </div>
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
  }));

  const fallbackStories = STORIES.filter(s => !s.isAdd).map(s => ({
    id: s.id,
    title: s.title,
    user: {
      name: s.user.name,
      avatar: s.user.avatar,
      verified: s.user.verified,
    },
    createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    hasNew: s.hasNew,
    isAdd: false,
    mediaUrl: s.mediaUrl,
    thumbnailUrl: s.thumbnailUrl,
  }));

  const allStories = [...dbStories, ...fallbackStories, ...STORIES.filter(s => s.isAdd)];
  const activeStories = allStories.filter(s => {
    if (s.isAdd) return false;
    if (!s.createdAt) return true;
    return Date.now() - new Date(s.createdAt).getTime() < 48 * 60 * 60 * 1000;
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
            ) : (
              activeStories.map(story => (
                <button
                  key={story.id}
                  onClick={() => handleStoryClick(story.id)}
                  aria-label={story.title || story.user.name}
                  className="flex flex-col items-center gap-1 px-1"
                >
                  <div className={`story-ring ${story.hasNew && !viewedStories.has(story.id) ? 'has-new' : ''}`}>
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