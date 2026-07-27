import React, { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import StoriesBar from '@/components/features/StoriesBar';
import ContentCard from '@/components/features/ContentCard';
import RightSidebar from '@/components/features/RightSidebar';
import { usePosts, useUserLikes, useUserSaves } from '@/hooks/usePosts';
import { CONTENT_FEED } from '@/data/mockData';
import { TabType } from '@/types';

const Home: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('foryou');

  const { data: livePosts, isLoading, error } = usePosts(activeTab, user?.id);
  const { data: likedSet } = useUserLikes(user?.id);
  const { data: savedSet } = useUserSaves(user?.id);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'foryou', label: t('feed.forYou') },
    { key: 'following', label: t('feed.following') },
    { key: 'explore', label: t('feed.explore') },
  ];

  // Use live posts if available, otherwise fall back to mock data for demo
  const posts = livePosts && livePosts.length > 0 ? livePosts : CONTENT_FEED;
  const isLiveData = livePosts && livePosts.length > 0;

  return (
    <div className="flex gap-6">
      {/* Main feed */}
      <div className="flex-1 min-w-0">
        <StoriesBar />

        {/* Feed tabs */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-0 border-b border-umurage-border">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'text-umurage-gold border-umurage-gold'
                    : 'text-umurage-muted border-transparent hover:text-umurage-cream'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 text-umurage-muted text-sm hover:text-umurage-cream transition-colors border border-umurage-border rounded-lg px-3 py-1.5">
            <span>{t('feed.latest')}</span>
            <ChevronDown size={13} />
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="text-umurage-gold animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="umurage-card rounded-2xl p-6 text-center">
            <p className="text-umurage-muted text-sm mb-3">Failed to load posts</p>
            <p className="text-umurage-subtle text-xs">Showing sample content below</p>
          </div>
        )}

        {/* Following empty state */}
        {!isLoading && activeTab === 'following' && (!livePosts || livePosts.length === 0) && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-umurage-card border border-umurage-border flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🌿</span>
            </div>
            <h3 className="text-umurage-cream font-semibold mb-2">{t('feed.noFollowing')}</h3>
            <p className="text-umurage-muted text-sm">Discover historians, artists, elders, and cultural creators.</p>
          </div>
        )}

        {/* Content cards */}
        {!isLoading && (activeTab !== 'following' || (livePosts && livePosts.length > 0)) && (
          <div>
            {posts.map((item: unknown) => (
              <ContentCard
                key={(item as { id: string }).id}
                item={item as Parameters<typeof ContentCard>[0]['item']}
                likedSet={isLiveData ? likedSet : undefined}
                savedSet={isLiveData ? savedSet : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="hidden xl:block">
        <RightSidebar />
      </div>
    </div>
  );
};

export default Home;
