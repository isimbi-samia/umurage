import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Bell, MessageSquare, ChevronDown, Menu, X, Upload, LogOut, User, Loader2,
  CheckCircle, Heart, UserPlus, MessageCircle, Shield, Sparkles
} from 'lucide-react';
import { useLanguage, LangCode } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useNotifications, useUnreadCount, useMarkAllRead, useMarkOneRead, type Notification } from '@/hooks/useNotifications';
import InstallPrompt from '@/components/features/InstallPrompt';

const LANGUAGES: { code: LangCode; label: string; flag: string }[] = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'rw', label: 'RW', flag: '🇷🇼' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'sw', label: 'SW', flag: '🇹🇿' },
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
  like: <Heart size={13} className="text-red-400" />,
  follow: <UserPlus size={13} className="text-blue-400" />,
  comment: <MessageCircle size={13} className="text-[#c8960c]" />,
  reply: <MessageCircle size={13} className="text-emerald-400" />,
  verification: <Shield size={13} className="text-purple-400" />,
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
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[#2d1e13] bg-[#140d08] shadow-2xl z-[100] animate-fade-in overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#25180e]">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-[#d4a24c]" />
          <span className="text-[#f2e6d8] font-semibold text-xs">{t('notif.title')}</span>
          {unreadCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#c8960c] text-[#0e0906] font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAll.mutate(userId)}
            disabled={markAll.isPending}
            className="text-[#d4a24c] text-xs hover:underline"
          >
            {t('notif.markAllRead')}
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={18} className="text-[#d4a24c] animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Bell size={24} className="text-[#5c4632] mx-auto mb-2" />
            <p className="text-[#a89078] text-xs">{t('notif.noNotifs')}</p>
          </div>
        ) : (
          notifications.map(notif => {
            const actor = notif.actor as { username?: string | null; avatar_url?: string | null } | null;
            return (
              <button
                key={notif.id}
                onClick={() => handleNotifClick(notif)}
                className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-[#1e130a] transition-colors text-left border-b border-[#25180e]/60 last:border-0 ${!notif.read ? 'bg-[#c8960c]/5' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={actor?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${actor?.username || 'U'}`}
                    alt={actor?.username || 'User'}
                    className="w-7 h-7 rounded-full object-cover border border-[#332013]"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#120c08] flex items-center justify-center">
                    {NOTIF_ICONS[notif.type] || <Bell size={9} className="text-[#d4a24c]" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug ${notif.read ? 'text-[#a89078]' : 'text-[#f2e6d8]'}`}>
                    {notif.message}
                  </p>
                  <p className="text-[#7a6754] text-[10px] mt-1">{timeAgo(notif.created_at)}</p>
                </div>
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
      className="fixed top-0 left-0 lg:left-[250px] right-0 z-50 flex items-center gap-3 px-4 py-2.5 border-b border-[#2d1e13] bg-[#120c08]/95 backdrop-blur-md h-16"
    >
      <button onClick={onMenuToggle} className="lg:hidden text-[#a89078] hover:text-[#f2e6d8] p-1.5 rounded-lg transition-colors">
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Search Bar */}
      <div className="flex-1 max-w-lg relative" ref={searchRef}>
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7662]" />
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder={t('search.placeholder')}
              className="w-full border border-[#2d1e13] bg-[#1a110a] rounded-lg pl-10 pr-9 py-2 text-xs text-[#f2e6d8] placeholder-[#7a6754] focus:outline-none focus:border-[#c8960c]/60 transition-colors"
            />
            {searchLoading && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d4a24c] animate-spin" />}
            {searchVal && !searchLoading && (
              <button type="button" onClick={() => { setSearchVal(''); setSearchResults([]); setNoResults(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6754] hover:text-[#f2e6d8]">
                <X size={13} />
              </button>
            )}
          </div>
        </form>

        {searchFocused && searchVal.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-[#2d1e13] bg-[#140d08] shadow-2xl z-[100] overflow-hidden animate-fade-in">
            {searchLoading ? (
              <div className="flex items-center justify-center py-4 gap-2">
                <Loader2 size={15} className="text-[#d4a24c] animate-spin" />
                <span className="text-[#a89078] text-xs">Searching...</span>
              </div>
            ) : noResults ? (
              <div className="py-6 text-center px-4">
                <Search size={22} className="text-[#5c4632] mx-auto mb-1.5" />
                <p className="text-[#a89078] text-xs">No content found for "{searchVal}"</p>
                <button onClick={() => { navigate('/library'); setSearchFocused(false); }} className="mt-2 text-[#d4a24c] text-xs hover:underline">Browse Library →</button>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                {searchResults.map(result => (
                  <button key={result.id} onClick={() => handleSearchSelect(result)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1e130a] transition-colors text-left border-b border-[#25180e]/50 last:border-0">
                    <span className="text-base flex-shrink-0">{TYPE_ICONS[result.type] || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#f2e6d8] text-xs font-medium truncate">{result.title}</p>
                      <span className="text-[#a89078] text-[10px] capitalize">{result.type} · {result.category}</span>
                    </div>
                  </button>
                ))}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 ml-auto">
        <InstallPrompt />
        <div className="relative">
          <select value={lang} onChange={e => setLang(e.target.value as LangCode)} className="lang-select pr-5 text-xs font-medium cursor-pointer">
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#8c7662] pointer-events-none" />
        </div>

        {isAuthenticated ? (
          <>
            <button onClick={() => navigate('/upload')} className="hidden sm:flex items-center gap-1.5 btn-outline-gold text-xs py-1.5 px-3">
              <Upload size={13} /> <span>{t('upload')}</span>
            </button>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}
                className="relative p-2 text-[#a89078] hover:text-[#f2e6d8] rounded-lg hover:bg-[#1e130a] transition-colors"
                title={t('notif.title')}
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#c8960c]" />
                )}
              </button>
              {showNotifs && user?.id && (
                <NotificationPanel userId={user.id} onClose={() => setShowNotifs(false)} />
              )}
            </div>

            <button onClick={() => navigate('/messages')} className="p-2 text-[#a89078] hover:text-[#f2e6d8] rounded-lg hover:bg-[#1e130a] transition-colors" title="Messages">
              <MessageSquare size={17} />
            </button>

            {/* Profile Avatar Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#1e130a] transition-colors"
              >
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
                  alt={user?.name || 'User'}
                  className="w-7 h-7 rounded-full object-cover border border-[#c8960c]/40"
                />
                <span className="text-[#f2e6d8] text-xs font-medium hidden sm:block">{user?.name?.split(' ')[0]}</span>
                <ChevronDown size={12} className="text-[#8c7662]" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-[#2d1e13] bg-[#140d08] py-1.5 z-[100] shadow-2xl animate-fade-in">
                  <div className="px-3 py-2 border-b border-[#25180e]">
                    <p className="text-[#f2e6d8] text-xs font-semibold truncate">{user?.name}</p>
                    <p className="text-[#7a6754] text-[10px] truncate">{user?.email}</p>
                  </div>
                  <button onMouseDown={e => { e.preventDefault(); setShowUserMenu(false); navigate('/profile'); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#b09d89] hover:text-[#f2e6d8] hover:bg-[#1e130a] transition-colors">
                    <User size={14} /> Profile
                  </button>
                  <button onMouseDown={e => { e.preventDefault(); setShowUserMenu(false); navigate('/heritage-archive'); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#b09d89] hover:text-[#f2e6d8] hover:bg-[#1e130a] transition-colors">
                    <span>🏛️</span> Heritage Archive
                  </button>
                  <button onMouseDown={e => { e.preventDefault(); setShowUserMenu(false); navigate('/verification'); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#b09d89] hover:text-[#f2e6d8] hover:bg-[#1e130a] transition-colors">
                    <Shield size={14} className="text-[#d4a24c]" />
                    <span>Get Verified</span>
                  </button>
                  <div className="border-t border-[#25180e] my-1" />
                  <button onMouseDown={async e => { e.preventDefault(); setShowUserMenu(false); await logout(); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-[#1e130a] transition-colors">
                    <LogOut size={14} /> {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => openAuth('login')} className="btn-outline-gold text-xs py-1.5 px-3">{t('auth.login')}</button>
            <button onClick={() => openAuth('signup')} className="btn-gold text-xs py-1.5 px-3">{t('auth.signup')}</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;