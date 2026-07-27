import React, { useState } from 'react';
import { Search, BookOpen, Headphones, Video, FileText, Image, Filter } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LIBRARY_CATEGORIES, CONTENT_FEED } from '@/data/mockData';
import ContentCard from '@/components/features/ContentCard';

type FilterType = 'all' | 'video' | 'article' | 'audio' | 'book' | 'image';

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

  const filtered = CONTENT_FEED.filter(item => {
    const matchType = activeType === 'all' || item.type === activeType;
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'all' || item.category.toLowerCase() === activeCategory.toLowerCase();
    return matchType && matchSearch && matchCat;
  });

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

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">📚</span>
          <h3 className="text-umurage-cream font-semibold mb-2">No results found</h3>
          <p className="text-umurage-muted text-sm">Try a different search term or category.</p>
        </div>
      ) : (
        <div>
          {filtered.map(item => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
