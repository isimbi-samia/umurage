import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Bell, MessageSquare, ChevronDown, Menu, X, Upload, LogOut, User, Loader2,
  CheckCircle, Heart, UserPlus, MessageCircle, Shield, Filter, SlidersHorizontal
} from 'lucide-react';
import { useLanguage, LangCode } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useNotifications, useUnreadCount, useMarkAllRead, useMarkOneRead, type Notification } from '@/hooks/useNotifications';

const LANGUAGES: { code: LangCode; label: string; flag: string }[] = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'rw', label: 'RW', flag: '🇷🇼' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
];

interface SearchResult {
  id: string;
  title: string;
  type: string;
  category: string;
}

interface TopBarProps {
  onMenuToggle: () => void;
  menuOpen: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  like: <Heart size={14} className="text-red-400" />,
  follow: <UserPlus size={14} className="text-blue-400" />,
  comment: <MessageCircle size={14} className="text-umurage-gold" />,
  reply: <MessageCircle size={14} className="text-green-400" />,
  verification: <Shield size={14} className="text-purple-400" />,
};

const NotificationPanel: React.FC<{ userId: string; onClose: () => void }> = ({ userId, onClose }) => {
  const { t } = useLanguage();
  const { data: notifications = [], isLoading } = useNotifications(userId);
  const { data: unreadCount = 0 } = useUnreadCount(userId);
  const markAll = useMarkAllRead();
  const markOne = useMarkOneRead();
  const navigate = useNavigate();

  const handleNotifClick = (notif: Notification) => {
    if (!notif.read) markOne.mutate({ notifId: notif.id, userId });
    if (notif.post_id) { navigate(`/post/${notif.post_id}`); onClose(); }
    else if (notif.type === 'follow') { navigate('/profile'); onClose(); }
    else if (notif.topic_id) { navigate('/discussions'); onClose(); }
  };

  return (
    <div
      className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-umurage-border overflow-hidden z-50 animate-fade-in"
      style={{ background: 'rgba(13,8,3,0.99)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-umurage-border">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-umurage-gold" />
          <span className="text-umurage-cream font-semibold text-sm">{t('notif.title')}</span>
          {unreadCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-umurage-gold text-umurage-bg font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAll.mutate(userId)}
            disabled={markAll.isPending}
            className="text-umurage-gold text-xs hover:underline"
          >
            {t('notif.markAllRead')}
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="text-umurage-gold animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10">
            <Bell size={28} className="text-umurage-gold/20 mx-auto mb-2" />
            <p className="text-umurage-muted text-sm">{t('notif.noNotifs')}</p>
            <p className="text-umurage-subtle text-xs mt-1">Activity from likes, follows, and replies will appear here</p>
          </div>
        ) : (
          notifications.map(notif => {
            const actor = notif.actor as { username?: string | null; avatar_url?: string | null } | null;
            return (
              <button
                key={notif.id}
                onClick={() => handleNotifClick(notif)}
                className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-umurage-surface transition-colors text-left border-b border-umurage-border/40 last:border-0 ${!notif.read ? 'bg-umurage-gold/5' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={actor?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${actor?.username || 'U'}`}
                    alt={actor?.username || 'User'}
                    className="w-8 h-8 rounded-full object-cover border border-umurage-border"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-umurage-bg flex items-center justify-center">
                    {NOTIF_ICONS[notif.type] || <Bell size={10} className="text-umurage-gold" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug ${notif.read ? 'text-umurage-muted' : 'text-umurage-cream'}`}>
                    {notif.message}
                  </p>
                  <p className="text-umurage-subtle text-[10px] mt-1">{timeAgo(notif.created_at)}</p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-umurage-gold flex-shrink-0 mt-1" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

const TopBar: React.FC<TopBarProps> = ({ onMenuToggle, menuOpen }) => {
  const { lang, setLang, t } = useLanguage();
  const { user, isAuthenticated, openAuth, logout } = useAuth();
  const [searchVal, setSearchVal] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: unreadCount = 0 } = useUnreadCount(user?.id);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchVal.trim() || searchVal.length < 2) {
      setSearchResults([]);
      setNoResults(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      setNoResults(false);
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, type, category')
        .eq('published', true)
        .ilike('title', `%${searchVal}%`)
        .limit(6);
      if (!error && data) {
        setSearchResults(data);
        setNoResults(data.length === 0);
      } else {
        setSearchResults([]);
        setNoResults(true);
      }
      setSearchLoading(false);
    }, 350);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchVal]);

  const TYPE_ICONS: Record<string, string> = {
    video: '🎥', article: '📄', audio: '🎙️', book: '📚', image: '🖼️',
  };

  const handleSearchSelect = (result: SearchResult) => {
    setSearchVal('');
    setSearchResults([]);
    setSearchFocused(false);
    navigate(`/post/${result.id}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/library?q=${encodeURIComponent(searchVal)}`);
      setSearchFocused(false);
    }
  };

  return (
    <header
      className="fixed top-0 left-0 lg:left-[280px] right-0 z-20 flex items-center gap-4 px-4 py-3 border-b border-umurage-border"
      style={{ background: 'rgba(15,10,5,0.96)', backdropFilter: 'blur(14px)', height: '64px' }}
    >
      <button onClick={onMenuToggle} className="lg:hidden text-umurage-muted hover:text-umurage-cream p-2 rounded-lg transition-colors">
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className="flex-1 max-w-2xl relative" ref={searchRef}>
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder={t('search.placeholder')}
              className="w-full border border-umurage-border rounded-2xl pl-11 pr-10 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/50 transition-colors"
              style={{ background: 'rgba(34,21,8,0.8)' }}
            />
            {searchLoading && <Loader2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-umurage-gold animate-spin" />}
            {searchVal && !searchLoading && (
              <button type="button" onClick={() => { setSearchVal(''); setSearchResults([]); setNoResults(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-umurage-subtle hover:text-umurage-cream transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </form>

        {searchFocused && searchVal.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-umurage-border overflow-hidden z-50 animate-fade-in" style={{ background: 'rgba(22,14,5,0.99)' }}>
            {searchLoading ? (
              <div className="flex items-center justify-center py-6 gap-2">
                <Loader2 size={16} className="text-umurage-gold animate-spin" />
                <span className="text-umurage-muted text-sm">Searching...</span>
              </div>
            ) : noResults ? (
              <div className="py-8 text-center">
                <Search size={28} className="text-umurage-gold/20 mx-auto mb-2" />
                <p className="text-umurage-muted text-sm font-medium">No content found for "{searchVal}"</p>
                <p className="text-umurage-subtle text-xs mt-1">Try different keywords or browse the Library</p>
                <button onClick={() => { navigate('/library'); setSearchFocused(false); }} className="mt-3 text-umurage-gold text-xs hover:underline">Browse Cultural Library →</button>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div className="px-3 py-2 border-b border-umurage-border/50">
                  <span className="text-umurage-subtle text-[10px] font-semibold uppercase tracking-wider">Search Results</span>
                </div>
                {searchResults.map(result => (
                  <button key={result.id} onClick={() => handleSearchSelect(result)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-umurage-surface transition-colors text-left">
                    <span className="text-lg flex-shrink-0">{TYPE_ICONS[result.type] || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-umurage-cream text-sm font-medium truncate">{result.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-umurage-gold text-[10px] capitalize">{result.type}</span>
                        <span className="text-umurage-subtle text-[10px]">· {result.category}</span>
                      </div>
                    </div>
                  </button>
                ))}
                <button onClick={() => { navigate(`/library?q=${encodeURIComponent(searchVal)}`); setSearchFocused(false); }}
                  className="w-full px-4 py-3 text-sm text-umurage-gold hover:bg-umurage-surface transition-colors text-left border-t border-umurage-border/50 flex items-center gap-2">
                  <Search size={14} /> See all results for "{searchVal}"
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className="relative">
          <select value={lang} onChange={e => setLang(e.target.value as LangCode)} className="lang-select pr-6 text-sm font-semibold cursor-pointer">
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-umurage-muted pointer-events-none" />
        </div>

        {isAuthenticated ? (
          <>
            <button onClick={() => navigate('/upload')} className="hidden sm:flex items-center gap-1.5 btn-outline-gold text-xs py-2 px-3">
              <Upload size={14} /> <span>{t('upload')}</span>
            </button>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}
                className="relative p-2 text-umurage-muted hover:text-umurage-cream rounded-lg hover:bg-umurage-card transition-colors"
                title={t('notif.title')}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-umurage-gold rounded-full flex items-center justify-center text-[9px] font-bold text-umurage-bg">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifs && user?.id && (
                <NotificationPanel userId={user.id} onClose={() => setShowNotifs(false)} />
              )}
            </div>

            <button onClick={() => navigate('/discussions')} className="p-2 text-umurage-muted hover:text-umurage-cream rounded-lg hover:bg-umurage-card transition-colors">
              <MessageSquare size={18} />
            </button>

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-umurage-card transition-colors"
              >
                <div className="relative">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
                    alt={user?.name || 'User'}
                    className="w-8 h-8 rounded-full object-cover border-2 border-umurage-gold/40"
                  />
                  {user?.verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-umurage-verified border border-umurage-bg flex items-center justify-center">
                      <span className="text-white text-[7px] font-bold">✓</span>
                    </div>
                  )}
                </div>
                <span className="text-umurage-cream text-sm font-medium hidden sm:block">{user?.name?.split(' ')[0]}</span>
                <ChevronDown size={13} className="text-umurage-muted" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 umurage-card rounded-xl border border-umurage-border py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-umurage-border/50 mb-1">
                    <p className="text-umurage-cream text-sm font-semibold truncate">{user?.name}</p>
                    <p className="text-umurage-subtle text-[10px] truncate">{user?.email}</p>
                  </div>
                  <button onMouseDown={e => { e.preventDefault(); setShowUserMenu(false); navigate('/profile'); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-umurage-muted hover:text-umurage-cream hover:bg-umurage-surface transition-colors">
                    <User size={15} /> Profile
                  </button>
                  <button onMouseDown={e => { e.preventDefault(); setShowUserMenu(false); navigate('/heritage-archive'); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-umurage-muted hover:text-umurage-cream hover:bg-umurage-surface transition-colors">
                    <span>🏛️</span> Heritage Archive
                  </button>
                  <button onMouseDown={e => { e.preventDefault(); setShowUserMenu(false); navigate('/verification'); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-umurage-muted hover:text-umurage-cream hover:bg-umurage-surface transition-colors">
                    <Shield size={15} className="text-umurage-gold" />
                    <span>Get Verified</span>
                    {!user?.verified && <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-umurage-gold/20 text-umurage-gold border border-umurage-gold/30">NEW</span>}
                  </button>
                  <div className="border-t border-umurage-border my-1" />
                  <button onMouseDown={async e => { e.preventDefault(); setShowUserMenu(false); await logout(); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-umurage-surface transition-colors">
                    <LogOut size={15} /> {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => openAuth('login')} className="btn-outline-gold text-xs py-2 px-4">{t('auth.login')}</button>
            <button onClick={() => openAuth('signup')} className="btn-gold text-xs py-2 px-4">{t('auth.signup')}</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;