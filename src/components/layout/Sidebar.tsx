import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Radio,
  Mic,
  Map,
  MessageSquare,
  Bell,
  Calendar,
  ShoppingBag,
  GraduationCap,
  Heart,
  Sparkles,
  Settings,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import logoImg from '@/assets/logo.png';

const NAV_ITEMS = [
  { key: 'nav.home', label: 'Home', icon: Home, path: '/' },
  { key: 'nav.library', label: 'Library', icon: BookOpen, path: '/library' },
  { key: 'nav.stories', label: 'Stories', icon: Radio, path: '/stories' },
  { key: 'nav.oral', label: 'Oral History', icon: Mic, path: '/oral-history' },
  { key: 'nav.map', label: 'Map', icon: Map, path: '/cultural-map' },
  { key: 'nav.messages', label: 'Messages', icon: MessageSquare, path: '/messages' },
  { key: 'nav.discussions', label: 'Discussions', icon: MessageSquare, path: '/discussions' },
  { key: 'nav.notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
  { key: 'nav.events', label: 'Cultural Events', icon: Calendar, path: '/cultural-events' },
  { key: 'nav.marketplace', label: 'Marketplace', icon: ShoppingBag, path: '/marketplace' },
  { key: 'nav.courses', label: 'Courses', icon: GraduationCap, path: '/courses' },
  { key: 'nav.heritage', label: 'My Heritage', icon: Heart, path: '/my-heritage' },
  { key: 'nav.ai', label: 'AI Cultural Guide', icon: Sparkles, path: '/ai-guide' },
  { key: 'nav.settings', label: 'Settings', icon: Settings, path: '/settings' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { isAuthenticated, openAuth } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/70 z-30 lg:hidden backdrop-blur-xs" onClick={onClose} />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-full z-40 flex flex-col
          w-[250px] border-r border-[#2d1e13] bg-[#120c08]
          transition-transform duration-200 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ paddingTop: '4rem' }}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 border-b border-[#291b10] px-4 py-3.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-[#c8960c]/30">
            <img src={logoImg} alt="Umurage Hub" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-cinzel text-[#d4a24c] font-bold text-xs leading-tight tracking-wider">
              UMURAGE HUB
            </h1>
            <p className="text-[10px] text-[#a89078] tracking-tight">
              Preserve. Connect. Celebrate.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium
                  transition-all duration-150 group text-left
                  ${
                    active
                      ? 'bg-[#28180d] text-[#d4a24c] border border-[#3d2719] font-semibold shadow-xs'
                      : 'text-[#c2b29f] hover:bg-[#1a110a] hover:text-[#f2e6d8]'
                  }
                `}
              >
                <Icon
                  size={16}
                  className={`flex-shrink-0 transition-colors ${
                    active ? 'text-[#c8960c]' : 'text-[#8c7662] group-hover:text-[#d4a24c]'
                  }`}
                />
                <span className="truncate">{t(item.key)}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Button & Sign In CTA */}
        <div className="p-3 border-t border-[#291b10] space-y-2">
          {isAuthenticated ? (
            <button
              onClick={() => handleNav('/upload')}
              className="btn-gold w-full py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Upload size={14} />
              <span>{t('nav.upload')}</span>
            </button>
          ) : (
            <button
              onClick={() => openAuth('login')}
              className="btn-gold w-full py-2.5 px-3 text-xs font-semibold text-center block"
            >
              {t('auth.login')}
            </button>
          )}

          <p className="text-[10px] text-[#7a6754] text-center pt-1">
            {t('poweredBy')}
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
