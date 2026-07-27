import React from 'react';
import { Radio, Plus } from 'lucide-react';
import { STORIES } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const StoriesPage: React.FC = () => {
  const { isAuthenticated, openAuth } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Radio size={22} className="text-umurage-gold" />
            <h1 className="font-cinzel text-3xl text-umurage-gold font-bold">{t('nav.stories')}</h1>
          </div>
          <p className="text-umurage-muted text-base">Short cultural updates, traditions, proverbs, and announcements.</p>
        </div>
        <button onClick={() => !isAuthenticated && openAuth('login')} className="btn-gold flex items-center gap-2">
          <Plus size={16} />
          Share a Story
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {STORIES.filter(s => !s.isAdd).map(story => (
          <div key={story.id} className="umurage-card rounded-2xl overflow-hidden cursor-pointer group relative"
            style={{ minHeight: '260px' }}>
            <img
              src={story.user.avatar || 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=300&h=400&fit=crop'}
              alt={story.user.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-umurage-bg via-transparent to-transparent" />
            {story.hasNew && (
              <div
                className="absolute inset-0 rounded-2xl"
                style={{ boxShadow: 'inset 0 0 0 3px rgba(200,150,12,0.6)' }}
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <img src={story.user.avatar} alt={story.user.name} className="w-6 h-6 rounded-full border border-umurage-gold/40 object-cover" />
                {story.user.verified && (
                  <span className="w-3 h-3 rounded-full bg-umurage-verified border border-white" />
                )}
              </div>
              <p className="text-white text-xs font-semibold leading-tight">{story.user.name}</p>
              {story.user.verifiedType && (
                <p className="text-white/60 text-[10px]">{story.user.verifiedType}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoriesPage;
