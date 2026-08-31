import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2, Compass, SlidersHorizontal, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import StoriesBar from '@/components/features/StoriesBar';
import ContentCard from '@/components/features/ContentCard';
import { usePosts, useUserLikes, useUserSaves } from '@/hooks/usePosts';
import { TabType } from '@/types';

const Home: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('foryou');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts(activeTab, user?.id, sortBy);
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
        {/* Stories Section */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#d4a24c]">
              Cultural Stories
            </h2>
          </div>
          <StoriesBar />
        </div>

        {/* Tab Switcher & Filters */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#291b10] pb-3">
          <div className="flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#2a1a0e] text-[#d4a24c] font-semibold'
                    : 'text-[#a89078] hover:text-[#f2e6d8] hover:bg-[#1a110a]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative inline-flex items-center">
            <SlidersHorizontal size={13} className="absolute left-2.5 text-[#8c7662] pointer-events-none" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'latest' | 'popular' | 'trending')}
              className="appearance-none bg-[#1a110a] border border-[#2d1e13] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[#f2e6d8] cursor-pointer focus:outline-none focus:border-[#c8960c]/60"
            >
              <option value="latest">{t('feed.latest')}</option>
              <option value="popular">Most Popular</option>
              <option value="trending">Trending</option>
            </select>
            <ChevronDown size={11} className="absolute right-2 text-[#8c7662] pointer-events-none" />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#d4a24c]" />
          </div>
        )}

        {/* Error State with Retry Button */}
        {error && !isLoading && (
          <div className="rounded-xl border border-[#2d1e13] bg-[#160f09] p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-950/40 text-[#d4a24c] border border-red-800/30">
              <AlertCircle size={18} />
            </div>
            <p className="text-sm font-medium text-[#d4a24c]">Failed to load posts</p>
            <p className="text-xs text-[#a89078] mt-1 max-w-sm mx-auto">
              {error instanceof Error && !navigator.onLine 
                ? 'You appear to be offline. Please check your internet connection.' 
                : 'Could not fetch cultural posts. Please try again.'}
            </p>
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="btn-gold text-xs px-4 py-2 mt-4 inline-flex items-center gap-1.5 font-semibold"
            >
              {isRefetching ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              <span>{isRefetching ? 'Retrying...' : 'Try Again'}</span>
            </button>
          </div>
        )}

        {/* Empty State when Following Tab has no posts */}
        {!isLoading && activeTab === 'following' && posts.length === 0 && (
          <div className="rounded-xl border border-[#2d1e13] bg-[#160f09] px-6 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#24170d] text-[#d4a24c]">
              <Compass size={20} />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-[#f2e6d8]">{t('feed.noFollowing')}</h3>
            <p className="text-xs text-[#a89078]">Discover historians, artists, elders, and cultural creators to follow.</p>
          </div>
        )}

        {/* Empty State when Feed is Empty */}
        {!isLoading && activeTab !== 'following' && posts.length === 0 && (
          <div className="rounded-xl border border-[#2d1e13] bg-[#160f09] px-6 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#24170d] text-[#d4a24c]">
              <Compass size={20} />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-[#f2e6d8]">{t('feed.noPosts')}</h3>
            <p className="text-xs text-[#a89078]">Be the first to share cultural stories, music, history, or documents!</p>
          </div>
        )}

        {/* Feed Posts */}
        {!isLoading && posts.length > 0 && (
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
                  <Loader2 size={20} className="animate-spin text-[#d4a24c]" />
                ) : (
                  <span className="text-xs text-[#a89078]">Loading more stories...</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;