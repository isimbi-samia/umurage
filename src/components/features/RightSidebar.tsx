import React from 'react';
import { CheckCircle, Calendar, MapPin, Loader2, Sparkles, Clock, MapPin as MapPinIcon, Music, Camera, BookOpen, Users, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useVerifiedCreators, useFollowing, useToggleFollow } from '@/hooks/useFollow';
import { useTrending } from '@/hooks/usePosts';
import { useCulturalEvents } from '@/hooks/useFollow';
import { TRENDING, VERIFIED_CREATORS, UPCOMING_EVENTS } from '@/data/mockData';

const RightSidebar: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated, openAuth } = useAuth();
  const toggleFollow = useToggleFollow();

  const { data: liveCreators, isLoading: creatorsLoading } = useVerifiedCreators();
  const { data: liveCulturalEvents, isLoading: culturalEventsLoading } = useCulturalEvents();
  const { data: liveTrending, isLoading: trendingLoading } = useTrending();
  const { data: followingSet } = useFollowing(user?.id);
  const navigate = useNavigate();

  const creators = liveCreators && liveCreators.length > 0 ? liveCreators : null;
  const culturalEvents = liveCulturalEvents && liveCulturalEvents.length > 0 ? liveCulturalEvents : null;
  const trending = liveTrending && liveTrending.length > 0 ? liveTrending : null;

  const handleFollow = (targetId: string) => {
    if (!isAuthenticated || !user) { openAuth('login'); return; }
    const isFollowing = followingSet?.has(targetId) || false;
    toggleFollow.mutate({ followerId: user.id, followingId: targetId, isFollowing });
  };

  const EVENT_ICONS: Record<string, React.ReactNode> = {
    'Cultural Ceremony': <Star size={10} className="text-umurage-gold" />,
    'Harvest Festival': <Music size={10} className="text-umurage-gold" />,
    'Art Exhibition': <Camera size={10} className="text-umurage-gold" />,
    'Education': <BookOpen size={10} className="text-umurage-gold" />,
    'Workshop': <Users size={10} className="text-umurage-gold" />,
    'Dance Performance': <Music size={10} className="text-umurage-gold" />,
    'Museum Exhibition': <Camera size={10} className="text-umurage-gold" />,
    'Traditional Dance': <Music size={10} className="text-umurage-gold" />,
  };

  return (
    <aside className="w-full flex-shrink-0 space-y-4 lg:w-80">
      <div className="rounded-[24px] border border-amber-400/20 bg-[#22140d] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.25)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-200/80">Trending</p>
            <h3 className="text-base font-semibold text-amber-50">Trending This Week</h3>
          </div>
          <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-200">
            Top 3
          </div>
        </div>
        {trendingLoading ? (
          <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-umurage-gold-light" /></div>
        ) : (
          <div className="space-y-3">
            {(trending || TRENDING).slice(0, 5).map((item: unknown, idx: number) => {
              const i = item as { rank?: number; title: string; views?: string; thumbnail?: string; thumbnail_url?: string };
              return (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    const id = (i as any).id;
                    if (id) navigate(`/post/${id}`);
                  }}
                  className="cursor-pointer flex items-center gap-3 rounded-2xl border border-umurage-gold-light/20 bg-[rgba(242,205,124,0.08)] p-3 transition-all duration-200 hover:border-umurage-gold-light/25 hover:bg-[rgba(249,225,168,0.18)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-umurage-gold-light/15 text-sm font-semibold text-umurage-gold-light">{i.rank || idx + 1}</span>
                  <div className="h-12 w-16 overflow-hidden rounded-2xl bg-slate-800">
                    <img
                      src={i.thumbnail || i.thumbnail_url || 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=80&h=60&fit=crop'}
                      alt={i.title}
                      className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-semibold leading-tight text-umurage-cream">{i.title}</p>
                    <p className="mt-0.5 text-[10px] text-umurage-muted">{i.views ? `${i.views} views` : '1.2K views'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
            <button onClick={() => navigate('/')} className="mt-4 block w-full rounded-full border border-umurage-gold-light/20 bg-umurage-gold-light/10 py-2 text-center text-xs font-medium text-umurage-gold-light transition-colors hover:border-umurage-gold-light/30 hover:bg-umurage-gold-light/20">
          {t('trending.seeMore')}
        </button>
      </div>

      <div className="rounded-[24px] border border-amber-400/20 bg-[#22140d] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.25)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-200/80">Creators</p>
            <h3 className="text-base font-semibold text-amber-50">Verified Creators</h3>
          </div>
          <button className="text-xs font-medium text-amber-200 transition-colors hover:text-amber-100">See all</button>
        </div>
        {creatorsLoading ? (
          <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-umurage-gold-light" /></div>
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
                <div
                  key={creatorId}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/profile?user=${creatorId}`)}
                  className="cursor-pointer flex items-center gap-3 rounded-2xl border border-umurage-gold-light/20 bg-[rgba(242,205,124,0.08)] p-3"
                >
                  <div className="relative flex-shrink-0">
                    <img src={avatar} alt={name} className="h-10 w-10 rounded-full border border-umurage-gold-light/20 object-cover" />
                    {c.verified !== false && (
                      <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-umurage-bg border border-umurage-gold-light/20">
                        <Sparkles size={8} className="text-umurage-gold-light" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-xs font-semibold text-umurage-cream">{name}</span>
                      {c.verified !== false && <CheckCircle size={11} className="flex-shrink-0 text-umurage-gold-light" />}
                    </div>
                    <span className="text-[10px] text-umurage-muted">{vType}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFollow(creatorId); }}
                    disabled={toggleFollow.isPending}
                    className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                      isFollowing
                        ? 'border border-umurage-gold-light/20 bg-umurage-bg/90 text-umurage-cream/80'
                        : 'border border-umurage-gold-light/30 bg-umurage-gold-light/15 text-umurage-gold-light'
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

      <div className="rounded-[24px] border border-amber-400/20 bg-[#22140d] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.25)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-200/80">Calendar</p>
            <h3 className="text-base font-semibold text-amber-50">Upcoming Events</h3>
          </div>
          <button className="text-xs font-medium text-amber-200 transition-colors hover:text-amber-100">See all</button>
        </div>
        {culturalEventsLoading ? (
          <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-umurage-gold-light" /></div>
        ) : (
          <div className="space-y-3">
            {(culturalEvents || UPCOMING_EVENTS).slice(0, 4).map((ev: unknown) => {
              const e = ev as { id: string; title: string; event_date?: string; date?: string; location?: string; type?: string; image_url?: string; image?: string };
              return (
                <div
                  key={e.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/cultural-events?event=${e.id}`)}
                  className="cursor-pointer flex items-start gap-3 rounded-2xl border border-umurage-gold-light/20 bg-[rgba(242,205,124,0.08)] p-3 transition-all duration-200 hover:border-umurage-gold-light/30 hover:bg-[rgba(249,225,168,0.18)]"
                >
                  <img
                    src={e.image_url || e.image || 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=60&h=60&fit=crop'}
                    alt={e.title}
                    className="h-12 w-12 flex-shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-tight text-umurage-cream">{e.title}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <Calendar size={10} className="flex-shrink-0 text-umurage-gold-light" />
                      <span className="text-[10px] text-umurage-muted">{e.event_date || e.date}</span>
                    </div>
                    {e.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={10} className="flex-shrink-0 text-umurage-gold-light" />
                        <span className="truncate text-[10px] text-umurage-muted">{e.location}</span>
                      </div>
                    )}
                    {e.type && (
                      <div className="mt-1 flex items-center gap-1">
                        {EVENT_ICONS[e.type] || <Star size={10} className="text-umurage-gold" />}
                        <span className="text-[10px] text-umurage-gold-light/70">{e.type}</span>
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