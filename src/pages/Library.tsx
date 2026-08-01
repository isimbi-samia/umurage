import React, { useMemo, useState } from 'react';
import { Search, BookOpen, Headphones, Video, FileText, Image, Filter, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import ContentCard from '@/components/features/ContentCard';

type FilterType = 'all' | 'video' | 'article' | 'audio' | 'book' | 'image';

const LIBRARY_CATEGORIES = [
  { id: 'all', label: 'All Categories', icon: '🏛️', count: 0 },
  { id: 'history', label: 'History', icon: '📜', count: 0 },
  { id: 'language', label: 'Language', icon: '🗣️', count: 0 },
  { id: 'music', label: 'Music', icon: '🎵', count: 0 },
  { id: 'arts', label: 'Arts', icon: '🎨', count: 0 },
  { id: 'heritage', label: 'Heritage', icon: '🏺', count: 0 },
];

const TYPE_FILTERS: { key: FilterType; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <Filter size={14} /> },
  { key: 'video', label: 'Videos', icon: <Video size={14} /> },
  { key: 'article', label: 'Articles', icon: <FileText size={14} /> },
  { key: 'audio', label: 'Audio', icon: <Headphones size={14} /> },
  { key: 'book', label: 'Books', icon: <BookOpen size={14} /> },
  { key: 'image', label: 'Images', icon: <Image size={14} /> },
];

const Library: React.FC = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<FilterType>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey: ['library-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          type,
          title,
          description,
          thumbnail_url,
          media_url,
          duration,
          category,
          region,
          tags,
          created_at,
          views_count,
          likes_count,
          comments_count,
          shares_count,
          published,
          author:profiles!posts_user_id_fkey(id, username, email, avatar_url, verified, verification_type, role)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(24);
      if (error) throw error;
      return (data || []).map((post: any) => ({
        id: post.id,
        type: post.type || 'article',
        title: post.title || 'Untitled item',
        description: post.description || '',
        thumbnail_url: post.thumbnail_url || post.media_url || null,
        media_url: post.media_url || null,
        duration: post.duration || null,
        category: post.category || 'Heritage',
        region: post.region || null,
        tags: Array.isArray(post.tags) ? post.tags : [],
        views: post.views_count ?? 0,
        views_count: post.views_count ?? 0,
        likes_count: post.likes_count ?? 0,
        comments_count: post.comments_count ?? 0,
        shares_count: post.shares_count ?? 0,
        created_at: post.created_at,
        author: post.author || { id: post.user_id, username: null, email: null, avatar_url: null, verified: false },
        liked: false,
        saved: false,
      }));
    },
    staleTime: 30000,
  });

  const filtered = useMemo(() => posts.filter((item: any) => {
    const matchType = activeType === 'all' || item.type === activeType;
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'all' || item.category?.toLowerCase() === activeCategory.toLowerCase();
    return matchType && matchSearch && matchCat;
  }), [activeCategory, activeType, posts, search]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-cinzel text-3xl text-umurage-gold font-bold mb-2">{t('library.title')}</h1>
        <p className="text-umurage-muted text-base">Explore Rwanda's rich cultural heritage — stories, books, videos, and oral histories.</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search the cultural library..."
          className="w-full max-w-lg bg-umurage-card border border-umurage-border rounded-xl pl-11 pr-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/50 transition-colors"
        />
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
        <button
          onClick={() => setActiveCategory('all')}
          className={`umurage-card p-4 rounded-xl text-center cursor-pointer transition-all duration-200 ${activeCategory === 'all' ? 'border-umurage-gold/50' : ''}`}
        >
          <span className="text-2xl block mb-1">🏛️</span>
          <span className="text-umurage-muted text-xs">All Categories</span>
        </button>
        {LIBRARY_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`umurage-card p-4 rounded-xl text-center cursor-pointer transition-all duration-200 ${
              activeCategory === cat.id ? 'border-umurage-gold/50' : ''
            }`}
          >
            <span className="text-2xl block mb-1">{cat.icon}</span>
            <span className="text-umurage-muted text-xs block">{cat.label}</span>
            <span className="text-umurage-subtle text-[10px]">{cat.count} items</span>
          </button>
        ))}
      </div>

      {/* Type filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveType(f.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeType === f.key
                ? 'bg-umurage-gold text-umurage-bg'
                : 'bg-umurage-card border border-umurage-border text-umurage-muted hover:border-umurage-gold/30 hover:text-umurage-cream'
            }`}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-umurage-muted text-sm">{filtered.length} items found</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-umurage-muted">
          <Loader2 size={20} className="mr-2 animate-spin" />
          Loading cultural materials…
        </div>
      ) : isError ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">📚</span>
          <h3 className="text-umurage-cream font-semibold mb-2">Library temporarily unavailable</h3>
          <p className="text-umurage-muted text-sm">Please try again shortly.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">📚</span>
          <h3 className="text-umurage-cream font-semibold mb-2">No results found</h3>
          <p className="text-umurage-muted text-sm">Try a different search term or category.</p>
        </div>
      ) : (
        <div>
          {filtered.map((item: any) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
