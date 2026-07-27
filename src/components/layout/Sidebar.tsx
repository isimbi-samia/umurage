import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, BookOpen, Radio, Mic, Map, MessageSquare,
  Calendar, ShoppingBag, GraduationCap, Heart, Sparkles, Settings, Upload, Archive, Shield
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import logoImg from '@/assets/logo.png';

const NAV_ITEMS = [
  { key: 'nav.home',        icon: Home,          path: '/' },
  { key: 'nav.library',     icon: BookOpen,       path: '/library' },
  { key: 'nav.stories',     icon: Radio,          path: '/stories' },
  { key: 'nav.oral',        icon: Mic,            path: '/oral-history' },
  { key: 'nav.map',         icon: Map,            path: '/cultural-map' },
  { key: 'nav.discussions', icon: MessageSquare,  path: '/discussions' },
  { key: 'nav.events',      icon: Calendar,       path: '/events' },
  { key: 'nav.marketplace', icon: ShoppingBag,    path: '/marketplace' },
  { key: 'nav.courses',     icon: GraduationCap,  path: '/courses' },
  { key: 'nav.heritage',    icon: Heart,          path: '/my-heritage' },
  { key: 'nav.archive',     icon: Archive,        path: '/heritage-archive' },
  { key: 'nav.verify',      icon: Shield,         path: '/verification' },
  { key: 'nav.ai',          icon: Sparkles,       path: '/ai-guide' },
  { key: 'nav.settings',    icon: Settings,       path: '/settings' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { t } = useLanguage();
  const { isAuthenticated, openAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full z-40 flex flex-col
          w-56 border-r border-umurage-border
          transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ background: 'rgba(13, 8, 3, 0.98)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-umurage-border">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-umurage-gold/30">
            <img src={logoImg} alt="Umurage Hub" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-cinzel text-umurage-gold font-bold text-sm leading-tight tracking-wide">
              UMURAGE HUB
            </h1>
            <p className="text-umurage-gold/60 text-[9px] font-semibold tracking-wide leading-tight uppercase">URWAGASABO RUTEMBA INSHYUSHYU</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 scrollbar-hide">
          {NAV_ITEMS.map(({ key, icon: Icon, path }) => (
            <button
              key={key}
              onClick={() => handleNav(path)}
              className={`sidebar-item w-full text-left ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span>{t(key)}</span>
            </button>
          ))}

          {/* Upload button in sidebar for authenticated users */}
          {isAuthenticated && (
            <button
              onClick={() => handleNav('/upload')}
              className={`sidebar-item w-full text-left ${location.pathname === '/upload' ? 'active' : ''}`}
            >
              <Upload size={16} className="flex-shrink-0" />
              <span>{t('upload')}</span>
            </button>
          )}
        </nav>

        {/* CTA Box */}
        <div className="mx-3 mb-4 p-4 rounded-xl border border-umurage-gold/20"
          style={{ background: 'rgba(200,150,12,0.06)' }}>
          <p className="font-cinzel text-umurage-gold text-xs font-semibold mb-1">
            {t('cta.share')}
          </p>
          <p className="text-umurage-muted text-[11px] mb-3 leading-relaxed">
            {t('cta.together')}
          </p>
          <button
            onClick={() => !isAuthenticated ? openAuth('signup') : handleNav('/upload')}
            className="btn-gold text-xs w-full py-2 text-center"
          >
            {isAuthenticated ? t('upload') : t('cta.contribute')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
