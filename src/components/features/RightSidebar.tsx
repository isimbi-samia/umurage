import React from 'react';
import { CheckCircle, Calendar, MapPin, Loader2, Sparkles, Star, Users, Flame } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useVerifiedCreators, useFollowing, useToggleFollow, useCulturalEvents } from '@/hooks/useFollow';
import { useTrending } from '@/hooks/usePosts';

const RightSidebar: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated, openAuth } = useAuth();
  const toggleFollow = useToggleFollow();

  const { data: liveCreators, isLoading: creatorsLoading } = useVerifiedCreators();
  const { data: liveCulturalEvents, isLoading: culturalEventsLoading } = useCulturalEvents();
  const { data: liveTrending, isLoading: trendingLoading } = useTrending();
  const { data: followingSet } = useFollowing(user?.id);
  const navigate = useNavigate();

  const handleFollow = (targetId: string) => {
    if (!isAuthenticated || !user) { openAuth('login'); return; }
    const isFollowing = followingSet?.has(targetId) || false;
    toggleFollow.mutate({ followerId: user.id, followingId: targetId, isFollowing });
  };

  return (
    <aside className="w-full flex-shrink-0 space-y-4 lg:w-80">
      {/* Trending Section */}
      <div className="rounded-xl border border-[#2d1e13] bg-[#160f09] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-[#d4a24c]" />
            <h3 className="text-sm font-semibold text-[#f2e6d8]">Trending Content</h3>
          </div>
          <button onClick={() => navigate('/')} className="text-xs text-[#d4a24c] hover:underline">
            {t('seeMore')}
          </button>
        </div>

        {trendingLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 size={16} className="animate-spin text-[#d4a24c]" />
          </div>
        ) : !liveTrending || liveTrending.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs text-[#a89078]">No trending content yet</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {liveTrending.slice(0, 4).map((item, idx) => {
              const post = item as { id: string; title: string; views?: number; thumbnail_url?: string | null };
              return (
                <div
                  key={post.id || idx}
                  onClick={() => navigate(`/post/${post.id}`)}
                  className="cursor-pointer flex items-center gap-3 rounded-lg border border-[#26180d] bg-[#1a110a] p-2.5 transition-colors hover:border-[#382415] hover:bg-[#20140c]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#28180d] text-xs font-semibold text-[#d4a24c]">
                    {idx + 1}
                  </span>
                  {post.thumbnail_url && (
                    <img src={post.thumbnail_url} alt={post.title} className="h-10 w-12 rounded object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-medium text-[#f2e6d8]">{post.title}</p>
                    <p className="text-[10px] text-[#a89078] mt-0.5">{post.views ? `${post.views} views` : '0 views'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verified Creators Section */}
      <div className="rounded-xl border border-[#2d1e13] bg-[#160f09] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#d4a24c]" />
            <h3 className="text-sm font-semibold text-[#f2e6d8]">Verified Creators</h3>
          </div>
        </div>

        {creatorsLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 size={16} className="animate-spin text-[#d4a24c]" />
          </div>
        ) : !liveCreators || liveCreators.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs text-[#a89078]">No verified creators yet</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {liveCreators.slice(0, 4).map((creator) => {
              const c = creator as { id: string; username?: string | null; email?: string; avatar_url?: string | null; verified?: boolean };
              const isFollowing = followingSet?.has(c.id) || false;
              const name = c.username || c.email?.split('@')[0] || 'Creator';
              const avatar = c.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;

              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/profile?user=${c.id}`)}
                  className="cursor-pointer flex items-center gap-2.5 rounded-lg border border-[#26180d] bg-[#1a110a] p-2.5 transition-colors hover:border-[#382415]"
                >
                  <img src={avatar} alt={name} className="h-8 w-8 rounded-full border border-[#2d1e13] object-cover flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-xs font-medium text-[#f2e6d8]">{name}</span>
                      <CheckCircle size={11} className="flex-shrink-0 text-emerald-400" />
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFollow(c.id); }}
                    disabled={toggleFollow.isPending}
                    className={`flex-shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      isFollowing
                        ? 'border border-[#382415] bg-[#1f130a] text-[#a89078]'
                        : 'bg-[#c8960c] text-[#0e0906] font-semibold hover:bg-[#d8a416]'
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

      {/* Cultural Events Section */}
      <div className="rounded-xl border border-[#2d1e13] bg-[#160f09] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#d4a24c]" />
            <h3 className="text-sm font-semibold text-[#f2e6d8]">Upcoming Events</h3>
          </div>
        </div>

        {culturalEventsLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 size={16} className="animate-spin text-[#d4a24c]" />
          </div>
        ) : !liveCulturalEvents || liveCulturalEvents.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs text-[#a89078]">No upcoming events scheduled</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {liveCulturalEvents.slice(0, 3).map((ev) => {
              const e = ev as { id: string; title: string; event_date?: string; location?: string };
              return (
                <div
                  key={e.id}
                  onClick={() => navigate(`/cultural-events?event=${e.id}`)}
                  className="cursor-pointer rounded-lg border border-[#26180d] bg-[#1a110a] p-2.5 transition-colors hover:border-[#382415]"
                >
                  <p className="text-xs font-medium text-[#f2e6d8] truncate">{e.title}</p>
                  {e.event_date && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-[#a89078]">
                      <Calendar size={10} />
                      <span>{e.event_date}</span>
                    </div>
                  )}
                  {e.location && (
                    <div className="flex items-center gap-1 text-[10px] text-[#a89078]">
                      <MapPin size={10} />
                      <span className="truncate">{e.location}</span>
                    </div>
                  )}
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