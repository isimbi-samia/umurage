import React, { useMemo, useState, useEffect } from 'react';
import { Search, BookOpen, Headphones, Video, FileText, Image as ImageIcon, Filter, Loader2, AlertCircle, Upload as UploadIcon } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import ContentCard from '@/components/features/ContentCard';

type FilterType = 'all' | 'video' | 'article' | 'audio' | 'book' | 'image' | 'document';

// Live Supabase category list aligned with public.categories
const CULTURAL_CATEGORIES = [
  { id: 'all', label: 'All Categories', icon: '🏛️' },
  { id: 'History', label: 'History', icon: '📜' },
  { id: 'Language', label: 'Language', icon: '🗣️' },
  { id: 'Traditional Music', label: 'Music', icon: '🎵' },
  { id: 'Arts', label: 'Arts & Crafts', icon: '🎨' },
  { id: 'Dance', label: 'Dance', icon: '💃' },
  { id: 'Books', label: 'Books & Archives', icon: '📚' },
  { id: 'Festivals', label: 'Festivals', icon: '🎉' },
  { id: 'Food', label: 'Cuisine', icon: '🍲' },
  { id: 'Museums', label: 'Museums', icon: '🏺' },
];

const TYPE_FILTERS: { key: FilterType; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All Types', icon: <Filter size={14} /> },
  { key: 'book', label: 'Books / PDFs', icon: <BookOpen size={14} /> },
  { key: 'article', label: 'Articles', icon: <FileText size={14} /> },
  { key: 'audio', label: 'Audio', icon: <Headphones size={14} /> },
  { key: 'video', label: 'Videos', icon: <Video size={14} /> },
  { key: 'image', label: 'Images', icon: <ImageIcon size={14} /> },
];

const Library: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated, openAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const [search, setSearch] = useState(queryParam);
  const [activeType, setActiveType] = useState<FilterType>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Sync state if URL query param changes
  useEffect(() => {
    if (queryParam !== search) {
      setSearch(queryParam);
    }
  }, [queryParam]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (val.trim()) {
      setSearchParams({ q: val.trim() });
    } else {
      setSearchParams({});
    }
  };

  const { data: libraryItems = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['library-items', activeCategory, activeType],
    queryFn: async () => {
      // 1. Query official library_items table
      let libraryQuery = supabase
        .from('library_items')
        .select(`
          id,
          user_id,
          title,
          description,
          category,
          type,
          media_type,
          media_url,
          file_url,
          thumbnail_url,
          author,
          views_count,
          year_created,
          created_at
        `);

      if (activeCategory !== 'all') {
        libraryQuery = libraryQuery.ilike('category', `%${activeCategory}%`);
      }
      if (activeType !== 'all') {
        libraryQuery = libraryQuery.eq('type', activeType);
      }

      const { data: libData, error: libErr } = await libraryQuery.order('created_at', { ascending: false });
      if (libErr && libErr.code !== 'PGRST116') {
        console.warn('Library items query error:', libErr);
      }

      // 2. Also query published cultural posts
      let postsQuery = supabase
        .from('posts')
        .select('*')
        .eq('published', true)
        .neq('type', 'story');

      if (activeCategory !== 'all') {
        postsQuery = postsQuery.ilike('category', `%${activeCategory}%`);
      }
      if (activeType !== 'all') {
        postsQuery = postsQuery.eq('type', activeType);
      }

      const { data: postsData, error: postsErr } = await postsQuery.order('created_at', { ascending: false });
      if (postsErr) throw postsErr;

      const rawLibs = libData || [];
      const rawPosts = postsData || [];

      // Collect user IDs for public author lookup
      const userIds = [...new Set([...rawLibs.map((l: any) => l.user_id), ...rawPosts.map((p: any) => p.user_id)].filter(Boolean))];
      const authorMap = new Map<string, any>();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, username, full_name, avatar_url, verified, verified_type, role')
          .in('id', userIds);

        (profiles || []).forEach((p: any) => {
          authorMap.set(p.id, { ...p, verification_type: p.verified_type });
        });
      }

      const mappedLibs = rawLibs.map((item: any) => ({
        id: item.id,
        type: item.type || item.media_type || 'book',
        title: item.title || 'Untitled Library Item',
        description: item.description || '',
        thumbnail_url: item.thumbnail_url || null,
        media_url: item.media_url || item.file_url || null,
        duration: item.duration || null,
        category: item.category || 'Heritage',
        region: item.location || null,
        tags: [],
        views: item.views_count ?? 0,
        views_count: item.views_count ?? 0,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        created_at: item.created_at,
        author: authorMap.get(item.user_id) || {
          id: item.user_id,
          username: item.author || 'Cultural Archive',
          avatar_url: null,
          verified: true,
          role: 'institution',
        },
        liked: false,
        saved: false,
      }));

      const mappedPosts = rawPosts.map((post: any) => ({
        id: post.id,
        type: post.type || 'article',
        title: post.title || 'Untitled Content',
        description: post.description || '',
        thumbnail_url: post.thumbnail_url || null,
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
        author: authorMap.get(post.user_id) || {
          id: post.user_id,
          username: post.author_name || 'Umurage Member',
          avatar_url: null,
          verified: false,
          role: 'user',
        },
        liked: false,
        saved: false,
      }));

      // Combine and deduplicate
      const combined = [...mappedLibs, ...mappedPosts];
      const seen = new Set<string>();
      return combined.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    },
    staleTime: 30000,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return libraryItems;
    const query = search.toLowerCase().trim();
    return libraryItems.filter((item: any) => {
      const matchTitle = item.title?.toLowerCase().includes(query);
      const matchDesc = item.description?.toLowerCase().includes(query);
      const matchCat = item.category?.toLowerCase().includes(query);
      const matchAuthor = item.author?.username?.toLowerCase().includes(query) || item.author?.full_name?.toLowerCase().includes(query);
      return matchTitle || matchDesc || matchCat || matchAuthor;
    });
  }, [libraryItems, search]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-3xl text-umurage-gold font-bold mb-2">{t('library.title')}</h1>
          <p className="text-umurage-muted text-sm max-w-2xl leading-relaxed">
            Explore Rwanda's authentic cultural heritage — verified historical documents, research papers, oral studies, traditional music, and books.
          </p>
        </div>
        <button
          onClick={() => (isAuthenticated ? navigate('/upload') : openAuth('login'))}
          className="btn-gold text-xs px-4 py-2.5 flex items-center gap-2 self-start md:self-auto font-semibold shadow-md"
        >
          <UploadIcon size={15} />
          <span>Upload Item</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
        <input
          type="text"
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search books, historical papers, traditions, music..."
          className="w-full max-w-lg bg-umurage-card border border-umurage-border rounded-xl pl-11 pr-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/50 transition-colors"
        />
      </div>

      {/* SINGLE Authoritative Category Filter Bar (No duplicate All Categories) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2 mb-6">
        {CULTURAL_CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-3 rounded-xl text-center cursor-pointer transition-all duration-200 ${
                isActive
                  ? 'bg-umurage-gold/20 border-2 border-umurage-gold text-umurage-gold shadow-[0_0_15px_rgba(200,150,12,0.2)]'
                  : 'umurage-card border border-umurage-border text-umurage-muted hover:border-umurage-gold/40 hover:text-umurage-cream'
              }`}
            >
              <span className="text-xl block mb-1">{cat.icon}</span>
              <span className="text-[11px] font-semibold block truncate">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveType(f.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
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

      {/* Filter Status */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-umurage-muted text-xs">
          Showing <strong className="text-umurage-gold">{filtered.length}</strong> items
          {activeCategory !== 'all' && (
            <> in category <span className="font-semibold text-umurage-cream capitalize">{activeCategory}</span></>
          )}
          {activeType !== 'all' && (
            <> ({activeType})</>
          )}
        </p>
      </div>

      {/* Query Statuses */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-umurage-muted">
          <Loader2 size={24} className="mr-3 animate-spin text-umurage-gold" />
          Loading cultural library items...
        </div>
      ) : isError ? (
        <div className="umurage-card rounded-2xl p-10 text-center border border-red-900/40">
          <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
          <h3 className="text-umurage-cream font-semibold mb-2">Unable to load library items</h3>
          <p className="text-umurage-muted text-xs mb-4">Please check your connection and try again.</p>
          <button onClick={() => refetch()} className="btn-gold text-xs px-5 py-2">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="umurage-card rounded-2xl p-12 text-center border border-dashed border-umurage-border">
          <span className="text-5xl block mb-4">📚</span>
          <h3 className="text-umurage-cream font-semibold text-base mb-2">
            {search.trim()
              ? 'No results found for your search'
              : activeCategory !== 'all'
              ? `No items have been added in ${activeCategory} yet`
              : 'No cultural library items have been added yet'}
          </h3>
          <p className="text-umurage-muted text-xs mb-6 max-w-md mx-auto">
            {search.trim()
              ? `We couldn't find any resources matching "${search}". Try searching with different keywords.`
              : 'Be the first to contribute verified historical documents, research, and cultural books.'}
          </p>
          <div className="flex justify-center gap-3">
            {(search || activeCategory !== 'all' || activeType !== 'all') && (
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setActiveType('all');
                  setSearch('');
                  setSearchParams({});
                }}
                className="btn-outline-gold text-xs px-5 py-2.5"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => (isAuthenticated ? navigate('/upload') : openAuth('signup'))}
              className="btn-gold text-xs px-5 py-2.5 font-semibold"
            >
              Upload an Item
            </button>
          </div>
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
