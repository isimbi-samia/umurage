import React from 'react';
import { Radio, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORIES } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const StoriesPage: React.FC = () => {
  const { isAuthenticated, openAuth } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const activeStories = STORIES.filter(story => {
    if (story.isAdd) return false;
    if (!story.createdAt) return true;
    return Date.now() - new Date(story.createdAt).getTime() < 24 * 60 * 60 * 1000;
  });

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Radio size={22} className="text-umurage-gold" />
            <h1 className="font-cinzel text-3xl text-umurage-gold font-bold">{t('nav.stories')}</h1>
          </div>
          <p className="text-umurage-muted text-base max-w-2xl">Short cultural updates, traditions, proverbs, and announcements, all curated for the Stories section.</p>
        </div>
        <button onClick={() => !isAuthenticated && openAuth('login')} className="btn-gold flex items-center gap-2">
          <Plus size={16} />
          Share a Story
        </button>
      </div>

      <div className="rounded-[28px] border border-amber-400/20 bg-[#21130c]/90 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.26)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-amber-200/80">Stories</p>
            <h2 className="text-2xl font-semibold text-amber-50">Live cultural stories</h2>
          </div>
          <button className="text-sm font-semibold text-amber-100 transition-colors hover:text-amber-200">See All</button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="flex flex-col items-center gap-2 rounded-[24px] border border-amber-400/15 bg-[#2c190f]/80 px-4 py-3 transition-all duration-200 hover:border-amber-300/40 hover:bg-[#3b2412]"
          >
            <div className="basket-ring has-new">
              <div className="basket-ring-inner h-20 w-20 flex items-center justify-center rounded-full bg-[#1b1009] text-umurage-gold text-2xl font-bold">
                +
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-100 text-center leading-tight">Your Story</span>
          </button>

          {activeStories.map(story => (
            <button
              key={story.id}
              className="flex flex-col items-center gap-2 rounded-[24px] border border-amber-400/15 bg-[#2c190f]/80 px-4 py-3 transition-all duration-200 hover:border-amber-300/40 hover:bg-[#3b2412]"
              onClick={() => navigate(`/stories?story=${story.id}`)}
            >
              <div className={`basket-ring ${story.hasNew ? 'has-new' : ''}`}>
                <div className="basket-ring-inner h-20 w-20">
                  <img src={story.user.avatar} alt={story.user.name} className="h-full w-full rounded-full object-cover" />
                </div>
              </div>
              <span className="text-xs font-semibold text-amber-100 text-center leading-tight">{story.user.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <div className="space-y-4">
            {activeStories.map(story => (
              <div key={story.id} className="rounded-[24px] border border-amber-400/15 bg-[#1f130c]/90 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.2)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="relative h-40 w-full overflow-hidden rounded-[24px] lg:w-56">
                    <img src={story.thumbnail || story.user.avatar} alt={story.title || story.user.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full bg-amber-400/90 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[#140c06] font-semibold">{story.type || 'Story'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/70">
                      <span>{story.user.name}</span>
                      <span>·</span>
                      <span>{story.user.verified ? 'Verified' : 'Community'}</span>
                      <span>·</span>
                      <span>{story.createdAt ? `${Math.floor((Date.now() - new Date(story.createdAt).getTime()) / 3600000)}h ago` : 'Live'}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-amber-50">{story.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-amber-100/75">{story.description}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-amber-200/80">
                      <span className="rounded-full bg-[#2d1a11]/80 px-3 py-2">❤ {story.likes ?? 0}</span>
                      <span className="rounded-full bg-[#2d1a11]/80 px-3 py-2">💬 {story.comments ?? 0}</span>
                      <span className="rounded-full bg-[#2d1a11]/80 px-3 py-2">↻ {story.shares ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="space-y-4">
            <div className="rounded-[24px] border border-amber-400/15 bg-[#1f130c]/90 p-4">
              <p className="text-[10px] uppercase tracking-[0.35em] text-amber-200/70">Note</p>
              <p className="mt-3 text-sm text-amber-100/80">Stories are visible for 24 hours only and remain in the Stories section, separate from the main post feed.</p>
            </div>
            <div className="rounded-[24px] border border-amber-400/15 bg-[#1f130c]/90 p-4">
              <p className="text-[10px] uppercase tracking-[0.35em] text-amber-200/70">Upload</p>
              <p className="mt-3 text-sm text-amber-100/80">Upload books, videos, or photos through the library upload page, then share them as stories or cultural posts.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StoriesPage;
