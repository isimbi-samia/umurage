import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2, Compass, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import StoriesBar from '@/components/features/StoriesBar';
import ContentCard from '@/components/features/ContentCard';
import RightSidebar from '@/components/features/RightSidebar';
import { usePosts, useUserLikes, useUserSaves } from '@/hooks/usePosts';
import { TabType } from '@/types';

const Home: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('foryou');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts(activeTab, user?.id, sortBy);
  const { data: likedSet } = useUserLikes(user?.id);
  const { data: savedSet } = useUserSaves(user?.id);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'foryou', label: t('feed.forYou') },
    { key: 'following', label: t('feed.following') },
    { key: 'explore', label: t('feed.explore') },
  ];

  const posts = data?.pages.flatMap(page => page.items) ?? [];
  const isLiveData = posts.length > 0;

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage) return;

    const node = loadMoreRef.current;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        fetchNextPage();
      }
    }, { threshold: 0.2 });

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 min-w-0">
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="mb-0 text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-300/80">Stories</p>
            </div>
            <div className="text-sm text-amber-200">Featured contributors</div>
          </div>
          <div className="">
            <StoriesBar />
          </div>
        </div>

        <div className="mb-5 rounded-[24px] border border-umurage-gold/20 bg-[rgba(28,16,8,0.45)] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-umurage-gold/20 rounded-full" />
              <div className="flex gap-1">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative px-4 py-2.5 text-sm font-semibold transition-all duration-200 rounded-full ${
                      activeTab === tab.key
                        ? 'text-umurage-gold-light'
                        : 'text-umurage-cream/60 hover:text-umurage-cream'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-umurage-gold rounded-full shadow-[0_0_8px_rgba(212,162,76,0.5)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-umurage-muted" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'latest' | 'popular' | 'trending')}
                className="appearance-none bg-umurage-bg/80 border border-umurage-border rounded-full pl-8 pr-8 py-2 text-xs text-umurage-cream cursor-pointer focus:outline-none focus:border-umurage-gold/50 hover:border-umurage-gold/30 transition-colors"
              >
                <option value="latest">{t('feed.latest')}</option>
                <option value="popular">Most Popular</option>
                <option value="trending">Trending</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-umurage-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-umurage-gold" />
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-[24px] border border-umurage-gold/20 bg-[rgba(29,19,12,0.72)] p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
            <p className="mb-3 text-sm text-umurage-gold-light/80">Failed to load posts</p>
            <p className="text-xs text-umurage-gold-light/60">Try refreshing or check your connection.</p>
          </div>
        )}

        {!isLoading && activeTab === 'following' && posts.length === 0 && (
          <div className="rounded-[24px] border border-umurage-gold/20 bg-[rgba(29,19,12,0.72)] px-6 py-16 text-center shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-umurage-gold/20 bg-umurage-gold/10">
              <Compass size={24} className="text-umurage-gold" />
            </div>
            <h3 className="mb-2 font-semibold text-umurage-gold-light">{t('feed.noFollowing')}</h3>
            <p className="text-sm text-umurage-gold-light/70">Discover historians, artists, elders, and cultural creators.</p>
          </div>
        )}

        {!isLoading && (activeTab !== 'following' || posts.length > 0) && (
          <div className="space-y-4">
            {posts.map((item: any) => (
              <ContentCard
                key={item.id}
                item={item as Parameters<typeof ContentCard>[0]['item']}
                likedSet={isLiveData ? likedSet : undefined}
                savedSet={isLiveData ? savedSet : undefined}
              />
            ))}

            {hasNextPage && (
              <div ref={loadMoreRef} className="flex items-center justify-center py-6">
                {isFetchingNextPage ? (
                  <Loader2 size={24} className="animate-spin text-umurage-gold" />
                ) : (
                  <div className="rounded-full border border-umurage-gold/20 bg-[rgba(29,19,12,0.72)] px-4 py-2 text-xs font-medium text-umurage-gold-light/80">
                    Scroll to load more stories
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <RightSidebar />
    </div>
  );
};

export default Home;