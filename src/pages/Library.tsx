import React, { useMemo, useState } from 'react';
import { Search, BookOpen, Headphones, Video, FileText, Image as ImageIcon, Filter, Loader2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import ContentCard from '@/components/features/ContentCard';

type FilterType = 'all' | 'video' | 'article' | 'audio' | 'book' | 'image';

const LIBRARY_CATEGORIES = [
  { id: 'all', label: 'All Categories', icon: '🏛️' },
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'language', label: 'Language', icon: '🗣️' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'arts', label: 'Arts', icon: '🎨' },
  { id: 'heritage', label: 'Heritage', icon: '🏺' },
];

const TYPE_FILTERS: { key: FilterType; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All Types', icon: <Filter size={14} /> },
  { key: 'video', label: 'Videos', icon: <Video size={14} /> },
  { key: 'article', label: 'Articles', icon: <FileText size={14} /> },
  { key: 'audio', label: 'Audio', icon: <Headphones size={14} /> },
  { key: 'book', label: 'Books', icon: <BookOpen size={14} /> },
  { key: 'image', label: 'Images', icon: <ImageIcon size={14} /> },
];

const Library: React.FC = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<FilterType>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;

  const { data: libraryData, isLoading, isError, refetch } = useQuery({
    queryKey: ['library-items', activeCategory, activeType, page],
    queryFn: async () => {
      // Query library_items table first
      let libraryQuery = supabase
        .from('library_items')
        .select(`
          id,
          user_id,
          title,
          description,
          category,
          type,
          media_url,
          thumbnail_url,
          author,
          views_count,
          year_created,
          created_at
        `);

      if (activeCategory !== 'all') {
        libraryQuery = libraryQuery.ilike('category', activeCategory);
      }
      if (activeType !== 'all') {
        libraryQuery = libraryQuery.eq('type', activeType);
      }

      const { data: libItems, error: libError } = await libraryQuery
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (libError && libError.code !== 'PGRST116') {
        console.warn('Library items query error:', libError);
      }

      // Also query posts for published content if library_items has few items
      let postsQuery = supabase
        .from('posts')
        .select('*')
        .eq('published', true);

      if (activeCategory !== 'all') {
        postsQuery = postsQuery.ilike('category', activeCategory);
      }
      if (activeType !== 'all') {
        postsQuery = postsQuery.eq('type', activeType);
      }

      const { data: postsItems, error: postsError } = await postsQuery
        .order('created_at', { ascending: false })
        .limit(pageSize);

      if (postsError) throw postsError;

      const rawPosts = postsItems || [];
      const rawLibs = libItems || [];
      const allUserIds = [...new Set([...rawPosts.map((p: any) => p.user_id), ...rawLibs.map((l: any) => l.user_id)].filter(Boolean))];
      
      const authorMap = new Map<string, any>();
      if (allUserIds.length > 0) {
        const { data: authorProfiles } = await supabase
          .from('public_profiles')
          .select('id, username, full_name, avatar_url, verified, verified_type, role')
          .in('id', allUserIds);
        (authorProfiles || []).forEach((ap: any) => {
          authorMap.set(ap.id, { ...ap, verification_type: ap.verified_type });
        });
      }

      rawPosts.forEach((p: any) => {
        p.author = authorMap.get(p.user_id) || {
          id: p.user_id,
          username: p.author_name || 'Umurage Member',
          avatar_url: null,
          verified: false,
          role: 'user',
        };
      });

      const mappedLibItems = rawLibs.map((item: any) => ({
        id: item.id,
        type: item.type || 'book',
        title: item.title || 'Untitled Material',
        description: item.description || '',
        thumbnail_url: item.thumbnail_url || item.media_url || null,
        media_url: item.media_url || null,
        duration: null,
        category: item.category || 'Heritage',
        region: null,
        tags: [],
        views: item.views_count ?? 0,
        views_count: item.views_count ?? 0,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        created_at: item.created_at,
        author: authorMap.get(item.user_id) || { id: item.user_id, username: item.author || 'Cultural Archive', avatar_url: null, verified: true, role: 'user' },
        liked: false,
        saved: false,
      }));

      const mappedPostsItems = (postsItems || []).map((post: any) => ({
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

      // Combine and deduplicate by ID
      const combined = [...mappedLibItems, ...mappedPostsItems];
      const seen = new Set();
      const deduplicated = combined.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      return deduplicated;
    },
    staleTime: 30000,
  });

  const items = libraryData || [];

  const filtered = useMemo(() => {
    return items.filter((item: any) => {
      const matchSearch = !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [items, search]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-cinzel text-3xl text-umurage-gold font-bold mb-2">{t('library.title')}</h1>
        <p className="text-umurage-muted text-base">
          Explore Rwanda's authentic cultural heritage — verified historical archives, language studies, traditional music, and oral literature.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search history, proverbs, oral accounts, music..."
          className="w-full max-w-lg bg-umurage-card border border-umurage-border rounded-xl pl-11 pr-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/50 transition-colors"
        />
      </div>

      {/* SINGLE Category Grid (No Duplicate "All Categories") */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
        {LIBRARY_CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setPage(1);
              }}
              className={`p-4 rounded-xl text-center cursor-pointer transition-all duration-200 ${
                isActive
                  ? 'bg-umurage-gold/20 border-2 border-umurage-gold text-umurage-gold shadow-[0_0_15px_rgba(200,150,12,0.2)]'
                  : 'umurage-card border border-umurage-border text-umurage-muted hover:border-umurage-gold/40 hover:text-umurage-cream'
              }`}
            >
              <span className="text-2xl block mb-1">{cat.icon}</span>
              <span className="text-xs font-semibold block">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => {
              setActiveType(f.key);
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeType === f.key
                ? 'bg-umurage-gold text-umurage-bg font-bold shadow-md'
                : 'bg-umurage-card border border-umurage-border text-umurage-muted hover:border-umurage-gold/30 hover:text-umurage-cream'
            }`}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      {/* Active Filter Indicator */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-umurage-muted text-sm">
          Showing <strong className="text-umurage-gold">{filtered.length}</strong> items in{' '}
          <span className="capitalize font-semibold text-umurage-cream">{activeCategory}</span>
        </p>
      </div>

      {/* Query Statuses */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-umurage-muted">
          <Loader2 size={24} className="mr-3 animate-spin text-umurage-gold" />
          Querying cultural records for {activeCategory}...
        </div>
      ) : isError ? (
        <div className="umurage-card rounded-2xl p-10 text-center border border-red-900/40">
          <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
          <h3 className="text-umurage-cream font-semibold mb-2">Unable to load library materials</h3>
          <p className="text-umurage-muted text-sm mb-4">Please check your network connection and try again.</p>
          <button onClick={() => refetch()} className="btn-gold text-xs px-5 py-2">
            Retry Search
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="umurage-card rounded-2xl p-12 text-center border border-dashed border-umurage-border">
          <span className="text-5xl block mb-4">📚</span>
          <h3 className="text-umurage-cream font-semibold text-lg mb-2">No cultural resources found</h3>
          <p className="text-umurage-muted text-sm mb-4 max-w-md mx-auto">
            No items currently match category <strong className="text-umurage-gold">"{activeCategory}"</strong> with search query "{search}".
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setActiveType('all');
              setSearch('');
            }}
            className="btn-outline-gold text-xs px-5 py-2.5"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item: any) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
