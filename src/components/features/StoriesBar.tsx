import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Eye, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { STORIES } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface StoryViewerProps {
  story: typeof STORIES[number];
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
          return (
            <>
              <div className="w-full">
                <div className="flex items-center gap-3 overflow-x-auto py-2 scrollbar-hide">
                  <button
                    type="button"
                    onClick={() => navigate('/upload')}
                    aria-label="Add your story"
                    className="flex flex-col items-center gap-1 px-2"
                  >
                    <div className="basket-ring has-new">
                      <div className="basket-ring-inner h-14 w-14 flex items-center justify-center rounded-full bg-[#1b1009] text-umurage-gold text-lg font-bold">
                        +
                      </div>
                    </div>
                    <span className="text-[11px] text-umurage-cream/70">Your Story</span>
                  </button>

                  {activeStories.map(story => (
                    <button
                      key={story.id}
                      onClick={() => handleStoryClick(story.id)}
                      aria-label={story.title || story.user.name}
                      className="flex flex-col items-center gap-1 px-2"
                    >
                      <div className={`basket-ring ${story.hasNew && !viewedStories.has(story.id) ? 'has-new' : ''}`}>
                        <div className="basket-ring-inner h-14 w-14 rounded-full overflow-hidden">
                          <img src={story.user.avatar} alt={story.user.name} className="h-full w-full object-cover" />
                        </div>
                      </div>
                      <span className="text-[11px] text-umurage-cream/70 truncate max-w-[64px] text-center">{story.user.name.split(' ')[0]}</span>
                    </button>
                  ))}
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
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="glass-pill mb-2">{t('stories.title')}</p>
            <h2 className="section-title">{t('stories.title')}</h2>
          </div>
          <button
            onClick={() => navigate('/stories')}
            className="text-sm font-medium text-umurage-gold transition-colors hover:text-umurage-gold-light"
          >
            {t('stories.seeAll')}
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {activeStories.map((story) => (
            <div
              key={story.id}
              onClick={() => handleStoryClick(story.id)}
              className="flex flex-shrink-0 cursor-pointer flex-col items-center gap-2 group"
            >
              <div className="relative">
                <div className={`basket-ring ${story.hasNew && !viewedStories.has(story.id) ? 'has-new' : ''}`}>
                  <div className="basket-ring-inner h-20 w-20">
                    <img
                      src={story.user.avatar || 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=300&h=400&fit=crop'}
                      alt={story.user.name}
                      className="h-full w-full rounded-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                </div>
                {story.user.verified && (
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#0f0905] bg-emerald-500 shadow-lg">
                    <Sparkles size={10} className="text-white" />
                  </div>
                )}
              </div>
              <span className="max-w-[72px] truncate text-center text-[11px] text-umurage-cream/65 transition-colors group-hover:text-umurage-cream">
                {story.user.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {viewingIdx !== null && nonAddStories[viewingIdx] && (
        <StoryViewer
          story={nonAddStories[viewingIdx]}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={viewingIdx > 0}
          hasNext={viewingIdx < nonAddStories.length - 1}
        />
      )}
    </>
  );
};

export default StoriesBar;