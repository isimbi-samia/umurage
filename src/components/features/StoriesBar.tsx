import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Eye, ChevronLeft, ChevronRight, Upload, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { STORIES } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
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
    }, 50); // 5 seconds total

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [story.id]);

  if (story.isAdd) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-sm h-[80vh] rounded-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          <div className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-none" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Close */}
        <button onClick={onClose} className="absolute top-6 right-3 z-20 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
          <X size={16} />
        </button>

        {/* Story content */}
        <div className="w-full h-full bg-gradient-to-b from-umurage-bg to-umurage-card flex flex-col items-center justify-center p-6">
          <img
            src={story.user.avatar || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&h=400&fit=crop'}
            alt={story.user.name}
            className="w-full h-full object-cover absolute inset-0 opacity-30"
          />
          <div className="relative z-10 text-center">
            <img
              src={story.user.avatar}
              alt={story.user.name}
              className="w-16 h-16 rounded-full object-cover border-3 border-umurage-gold mx-auto mb-3"
            />
            <p className="text-white font-semibold text-lg">{story.user.name}</p>
            {story.user.verified && <p className="text-umurage-gold text-xs mt-0.5">✓ Verified Creator</p>}
          </div>
        </div>

        {/* Nav overlays */}
        {hasPrev && (
          <button onClick={onPrev} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50">
            <ChevronLeft size={18} />
          </button>
        )}
        {hasNext && (
          <button onClick={onNext} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50">
            <ChevronRight size={18} />
          </button>
        )}

        {/* User info bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent z-10">
          <p className="text-white/70 text-xs text-center">Tap sides to navigate • Tap ✕ to close</p>
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

  const nonAddStories = STORIES.filter(s => !s.isAdd);

  const handleStoryClick = (storyId: string, idx: number) => {
    if (storyId === 's0') {
      // "Your Story" add button
      if (!isAuthenticated) { openAuth('login'); return; }
      navigate('/upload');
      return;
    }
    // Open story viewer at right index
    const nonAddIdx = nonAddStories.findIndex(s => s.id === storyId);
    if (nonAddIdx >= 0) {
      setViewingIdx(nonAddIdx);
      setViewedStories(prev => new Set([...prev, storyId]));
    }
  };

  const handlePrev = () => setViewingIdx(p => (p !== null && p > 0 ? p - 1 : p));
  const handleNext = () => {
    setViewingIdx(p => {
      if (p !== null && p < nonAddStories.length - 1) {
        setViewedStories(prev => new Set([...prev, nonAddStories[p + 1].id]));
        return p + 1;
      }
      return p;
    });
  };
  const handleClose = () => setViewingIdx(null);

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">{t('stories.title')}</h2>
          <button
            onClick={() => navigate('/stories')}
            className="text-umurage-gold text-sm font-medium hover:text-umurage-gold-light transition-colors"
          >
            {t('stories.seeAll')}
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {STORIES.map((story) => (
            <div
              key={story.id}
              onClick={() => handleStoryClick(story.id, 0)}
              className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 group"
            >
              <div className="relative">
                {story.isAdd ? (
                  <div className="w-16 h-16 rounded-full bg-umurage-card border-2 border-dashed border-umurage-border flex items-center justify-center group-hover:border-umurage-gold/60 transition-all duration-200">
                    <Plus size={24} className="text-umurage-gold" />
                  </div>
                ) : (
                  <div className="relative">
                    <div
                      className="w-16 h-16 rounded-full p-0.5"
                      style={story.hasNew && !viewedStories.has(story.id) ? {
                        background: 'conic-gradient(#C8960C 0deg, #6B4A10 45deg, #E8B422 90deg, #8B6914 135deg, #C8960C 180deg, #6B4A10 225deg, #E8B422 270deg, #8B6914 315deg, #C8960C 360deg)',
                      } : { background: '#3D2510' }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-umurage-bg">
                        <img
                          src={story.user.avatar}
                          alt={story.user.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    </div>
                    {story.user.verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-umurage-verified border-2 border-umurage-bg flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">✓</span>
                      </div>
                    )}
                    {viewedStories.has(story.id) && (
                      <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
                        <Eye size={14} className="text-white/60" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[11px] text-umurage-muted text-center max-w-[64px] truncate group-hover:text-umurage-cream transition-colors">
                {story.isAdd ? t('stories.yourStory') : story.user.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
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
