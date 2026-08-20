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
import logoImg from '@/assets/logo.png';

const NAV_ITEMS = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Library', icon: BookOpen, path: '/library' },
  { label: 'Stories', icon: Radio, path: '/stories' },
  { label: 'Oral History', icon: Mic, path: '/oral-history' },
  { label: 'Map', icon: Map, path: '/cultural-map' },
  { label: 'Messages', icon: MessageSquare, path: '/messages' },
  { label: 'Discussions', icon: MessageSquare, path: '/discussions' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
  { label: 'Cultural Events', icon: Calendar, path: '/cultural-events' },
  { label: 'Marketplace', icon: ShoppingBag, path: '/marketplace' },
  { label: 'Courses', icon: GraduationCap, path: '/courses' },
  { label: 'My Heritage', icon: Heart, path: '/my-heritage' },
  { label: 'AI Cultural Guide', icon: Sparkles, path: '/ai-guide' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { isAuthenticated, openAuth } = useAuth();
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

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scrollbar-thin">
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={label}
                onClick={() => handleNav(path)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#24170d] text-[#d4a24c] font-semibold border-l-2 border-[#c8960c]'
                    : 'text-[#c2b29f] hover:bg-[#1c120a] hover:text-[#f2e6d8]'
                }`}
              >
                <Icon size={15} className={`flex-shrink-0 ${isActive ? 'text-[#d4a24c]' : 'text-[#8c7662]'}`} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => (!isAuthenticated ? openAuth('login') : handleNav('/upload'))}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#c8960c] px-3 py-2 text-xs font-semibold text-[#0e0906] transition-colors duration-150 hover:bg-[#d8a416]"
          >
            <Upload size={14} className="flex-shrink-0 text-[#0e0906]" />
            <span>Share Cultural Content</span>
          </button>
        </nav>

        {/* Contribution Footer Card */}
        <div className="m-3 rounded-xl border border-[#2d1e13] bg-[#1a110a] p-3">
          <p className="font-cinzel text-[11px] font-semibold text-[#d4a24c] mb-1">
            Preserve Our Heritage
          </p>
          <p className="text-[11px] leading-relaxed text-[#a89078] mb-2.5">
            Add your voice, stories, and cultural memory to the living digital archive.
          </p>
          <button
            onClick={() => (!isAuthenticated ? openAuth('signup') : handleNav('/upload'))}
            className="w-full rounded-lg border border-[#c8960c]/40 bg-[#c8960c]/10 py-1.5 text-center text-xs font-medium text-[#e6c885] transition-colors duration-150 hover:bg-[#c8960c]/20"
          >
            Contribute Now
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
