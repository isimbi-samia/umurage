import React, { useState } from 'react';
import { CheckCircle, Calendar, MapPin, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVerifiedCreators, useFollowing, useToggleFollow } from '@/hooks/useFollow';
import { useTrending, useUserLikes } from '@/hooks/usePosts';
import { useEvents } from '@/hooks/useFollow';
import { TRENDING, VERIFIED_CREATORS, UPCOMING_EVENTS } from '@/data/mockData';

const RightSidebar: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated, openAuth } = useAuth();
  const toggleFollow = useToggleFollow();

  const { data: liveCreators, isLoading: creatorsLoading } = useVerifiedCreators();
  const { data: liveEvents, isLoading: eventsLoading } = useEvents();
  const { data: liveTrending, isLoading: trendingLoading } = useTrending();
  const { data: followingSet } = useFollowing(user?.id);

  const creators = liveCreators && liveCreators.length > 0 ? liveCreators : null;
  const events = liveEvents && liveEvents.length > 0 ? liveEvents : null;
  const trending = liveTrending && liveTrending.length > 0 ? liveTrending : null;

  const handleFollow = (targetId: string) => {
    if (!isAuthenticated || !user) { openAuth('login'); return; }
    const isFollowing = followingSet?.has(targetId) || false;
    toggleFollow.mutate({ followerId: user.id, followingId: targetId, isFollowing });
  };

  return (
    <aside className="w-72 flex-shrink-0 space-y-4">
      {/* Trending */}
      <div className="umurage-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title text-base">{t('trending.title')}</h3>
        </div>
        {trendingLoading ? (
          <div className="flex justify-center py-4"><Loader2 size={18} className="text-umurage-gold animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {(trending || TRENDING).slice(0, 3).map((item: unknown, idx: number) => {
              const i = item as { rank?: number; title: string; views?: string; thumbnail?: string; thumbnail_url?: string };
              return (
                <div key={idx} className="flex items-center gap-3 cursor-pointer group">
                  <span className="text-umurage-gold font-cinzel font-bold text-lg w-5 flex-shrink-0">{i.rank || idx + 1}</span>
                  <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={i.thumbnail || i.thumbnail_url || 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=80&h=60&fit=crop'}
                      alt={i.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-umurage-cream text-xs font-medium leading-tight group-hover:text-umurage-gold transition-colors line-clamp-2">{i.title}</p>
                    <p className="text-umurage-subtle text-[10px] mt-0.5">{i.views ? `${i.views} views` : `${i.views || '1K'} views`}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button className="text-umurage-gold text-xs font-medium mt-4 hover:text-umurage-gold-light transition-colors block text-center w-full border border-umurage-border rounded-lg py-2 hover:border-umurage-gold/30">
          {t('trending.seeMore')}
        </button>
      </div>

      {/* Verified Creators */}
      <div className="umurage-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title text-base">{t('verified.title')}</h3>
          <button className="text-umurage-gold text-xs font-medium hover:text-umurage-gold-light transition-colors">{t('verified.seeAll')}</button>
        </div>
        {creatorsLoading ? (
          <div className="flex justify-center py-4"><Loader2 size={18} className="text-umurage-gold animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {(creators || VERIFIED_CREATORS).map((creator: unknown) => {
              const c = creator as {
                id: string;
                name?: string;
                username?: string | null;
                email?: string;
                avatar?: string;
                avatar_url?: string | null;
                verified?: boolean;
                verifiedType?: string;
                verified_type?: string | null;
                followers?: number;
                followers_count?: number;
              };
              const creatorId = c.id;
              const isFollowing = followingSet?.has(creatorId) || false;
              const name = c.name || c.username || c.email?.split('@')[0] || 'Creator';
              const avatar = c.avatar || c.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;
              const vType = c.verifiedType || c.verified_type || 'Verified';

              return (
                <div key={creatorId} className="flex items-center gap-2">
                  <div className="relative flex-shrink-0">
                    <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover border border-umurage-border" />
                    {c.verified !== false && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-umurage-verified border border-umurage-bg" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-umurage-cream text-xs font-semibold truncate">{name}</span>
                      {c.verified !== false && <CheckCircle size={11} className="text-umurage-verified flex-shrink-0" />}
                    </div>
                    <span className="text-umurage-subtle text-[10px]">{vType}</span>
                  </div>
                  <button
                    onClick={() => handleFollow(creatorId)}
                    disabled={toggleFollow.isPending}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 flex-shrink-0 ${
                      isFollowing
                        ? 'bg-umurage-surface text-umurage-muted border border-umurage-border'
                        : 'btn-outline-gold'
                    }`}
                  >
                    {isFollowing ? t('following.btn') : t('follow')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Events */}
      <div className="umurage-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title text-base">{t('events.title')}</h3>
          <button className="text-umurage-gold text-xs font-medium hover:text-umurage-gold-light transition-colors">{t('events.seeAll')}</button>
        </div>
        {eventsLoading ? (
          <div className="flex justify-center py-4"><Loader2 size={18} className="text-umurage-gold animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {(events || UPCOMING_EVENTS).slice(0, 3).map((ev: unknown) => {
              const e = ev as { id: string; title: string; event_date?: string; date?: string; location?: string; event_type?: string; type?: string; image_url?: string; image?: string };
              return (
                <div key={e.id} className="flex items-start gap-3 cursor-pointer group">
                  <img
                    src={e.image_url || e.image || 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=60&h=60&fit=crop'}
                    alt={e.title}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-umurage-cream text-xs font-semibold leading-tight group-hover:text-umurage-gold transition-colors">{e.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar size={10} className="text-umurage-subtle flex-shrink-0" />
                      <span className="text-umurage-subtle text-[10px]">{e.event_date || e.date}</span>
                    </div>
                    {e.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={10} className="text-umurage-subtle flex-shrink-0" />
                        <span className="text-umurage-subtle text-[10px] truncate">{e.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};

export default RightSidebar;
