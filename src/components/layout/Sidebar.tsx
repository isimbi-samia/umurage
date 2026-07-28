import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Radio,
  Mic,
  Map,
  MessageSquare,
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
  { label: 'Discussions', icon: MessageSquare, path: '/discussions' },
  { label: 'Events', icon: Calendar, path: '/events' },
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
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-full z-40 flex flex-col
          w-[220px] border-r border-[#4a2a12]/80 bg-[#1a100b]
          shadow-[12px_0_40px_rgba(0,0,0,0.26)]
          transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ paddingTop: '4rem' }}
      >
        <div className="flex items-center gap-3 border-b border-[#5c3417]/50 px-4 py-4">
          <div className="w-9 h-9 rounded-2xl overflow-hidden flex-shrink-0 border border-amber-400/30 shadow-[0_0_12px_rgba(212,162,76,0.18)]">
            <img src={logoImg} alt="Umurage Hub" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-cinzel text-amber-300 font-bold text-xs leading-tight tracking-[0.25em]">
              UMURAGE HUB
            </h1>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-amber-200/60">
              Preserve. Connect. Celebrate.
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-amber-400/40">
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              onClick={() => handleNav(path)}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs font-medium transition-all duration-200 ${location.pathname === path ? 'bg-[#3f260f] text-amber-200 shadow-[0_10px_24px_rgba(0,0,0,0.18)]' : 'text-[#f5e6d0]/80 hover:bg-[#2f1b0c] hover:text-amber-100'}`}
            >
              <Icon size={14} className={`flex-shrink-0 ${location.pathname === path ? 'text-amber-300' : 'text-amber-200/70'}`} />
              <span className="truncate">{label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => (!isAuthenticated ? openAuth('login') : handleNav('/upload'))}
            className="mt-2 flex w-full items-center gap-3 rounded-lg bg-amber-400/90 px-2 py-2 text-left text-xs font-semibold text-[#140c06] transition-all duration-200 hover:bg-amber-300"
          >
            <Upload size={14} className="flex-shrink-0 text-[#140c06]" />
            <span className="truncate">Share a Story</span>
          </button>

          {isAuthenticated && (
            <button
              onClick={() => handleNav('/upload')}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${location.pathname === '/upload' ? 'bg-[#3f260f] text-amber-200' : 'text-[#f5e6d0]/80 hover:bg-[#2f1b0c] hover:text-amber-100'}`}
            >
              <Upload size={16} className={`flex-shrink-0 ${location.pathname === '/upload' ? 'text-amber-300' : 'text-amber-200/70'}`} />
              <span>Upload</span>
            </button>
          )}
        </nav>

        <div className="mx-3 mb-4 rounded-[24px] border border-amber-400/20 bg-[linear-gradient(135deg,rgba(138,87,17,0.18),rgba(39,20,8,0.92))] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.2)]">
          <p className="mb-1 font-cinzel text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200">
            Share. Preserve. Inspire.
          </p>
          <p className="mb-3 text-[11px] leading-relaxed text-[#f7e7c8]/70">
            Add your voice, story, and cultural memory to the living archive.
          </p>
          <button
            onClick={() => (!isAuthenticated ? openAuth('signup') : handleNav('/upload'))}
            className="w-full rounded-full border border-amber-300/40 bg-amber-400/90 px-3 py-2 text-center text-xs font-semibold text-[#140c06] transition-all duration-200 hover:bg-amber-300"
          >
            Contribute Now
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
