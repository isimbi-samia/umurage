import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Play, Pause, Music, Check, Volume2, VolumeX, Info, ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { useCulturalMusic } from '@/hooks/useCulturalMusic';
import { RwandanCulturalMusic } from '@/data/rwandaCulturalMusic';

interface SoundSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSound: RwandanCulturalMusic | null;
  onSelectSound: (sound: RwandanCulturalMusic | null, muteOriginal: boolean) => void;
  muteOriginalAudio: boolean;
  isVideoMedia?: boolean;
}

const CATEGORY_TABS = [
  'All',
  'Ingoma (Drums)',
  'Inanga (Zither)',
  'Intore Dance',
  'Gakondo / Modern Cultural',
  'Court & Royal',
  'Vocal & Chants',
] as const;

export const SoundSelectorModal: React.FC<SoundSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedSound,
  onSelectSound,
  muteOriginalAudio,
  isVideoMedia = false,
}) => {
  const { data: musicList = [] } = useCulturalMusic();
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'AVAILABLE_TO_USE' | 'LICENSING_REQUIRED'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<RwandanCulturalMusic | null>(selectedSound);
  const [muteOriginal, setMuteOriginal] = useState<boolean>(muteOriginalAudio);
  const [expandedInfoId, setExpandedInfoId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setSelected(selectedSound);
    setMuteOriginal(muteOriginalAudio);
  }, [selectedSound, muteOriginalAudio, isOpen]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const filteredSounds = musicList.filter(s => {
    const matchesStatus =
      selectedStatus === 'ALL' || s.permission_status === selectedStatus;
    const matchesCategory =
      selectedCategory === 'All' || s.category === selectedCategory;
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const handleTogglePreview = (sound: RwandanCulturalMusic, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sound.permission_status === 'LICENSING_REQUIRED' || !sound.audio_url) return;

    if (playingId === sound.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(sound.audio_url);
      audioRef.current = audio;
      audio.play().catch(() => {});
      setPlayingId(sound.id);
      audio.onended = () => setPlayingId(null);
    }
  };

  const handleConfirmSelect = (sound: RwandanCulturalMusic | null) => {
    if (sound && sound.permission_status === 'LICENSING_REQUIRED') return;
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
    onSelectSound(sound, muteOriginal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-[#2d1e13] bg-[#160f09] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d1e13] bg-[#1a110a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#c8960c]/15 border border-[#c8960c]/30 flex items-center justify-center text-[#d4a24c]">
              <Music size={18} />
            </div>
            <div>
              <h2 className="font-cinzel text-base font-bold text-[#f2e6d8]">Rwandan Cultural Music Library</h2>
              <p className="text-[11px] text-[#a89078]">Authentic Gakondo, Intore & Heritage Sound Catalogue</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              onClose();
            }}
            className="p-1.5 text-[#a89078] hover:text-[#f2e6d8] transition-colors rounded-lg hover:bg-[#24170d]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search, Status & Category Filters */}
        <div className="p-4 border-b border-[#2d1e13] bg-[#120b06] space-y-3">
          {/* Status Filter Tabs */}
          <div className="flex bg-[#1a110a] p-1 rounded-xl border border-[#2d1e13]">
            <button
              type="button"
              onClick={() => setSelectedStatus('ALL')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedStatus === 'ALL'
                  ? 'bg-[#c8960c] text-black shadow-xs'
                  : 'text-[#a89078] hover:text-[#f2e6d8]'
              }`}
            >
              All Catalogue ({musicList.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('AVAILABLE_TO_USE')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                selectedStatus === 'AVAILABLE_TO_USE'
                  ? 'bg-[#c8960c] text-black shadow-xs'
                  : 'text-emerald-400/90 hover:text-emerald-300'
              }`}
            >
              <ShieldCheck size={13} />
              <span>Available to Use ({musicList.filter(m => m.permission_status === 'AVAILABLE_TO_USE').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('LICENSING_REQUIRED')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                selectedStatus === 'LICENSING_REQUIRED'
                  ? 'bg-[#c8960c] text-black shadow-xs'
                  : 'text-amber-400/90 hover:text-amber-300'
              }`}
            >
              <Lock size={12} />
              <span>Licensing Required ({musicList.filter(m => m.permission_status === 'LICENSING_REQUIRED').length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7a6754]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Massamba, Ruti Joel, Kayirebwa, Intore, Inanga..."
              className="w-full bg-[#1a110a] border border-[#2d1e13] rounded-xl pl-9 pr-4 py-2 text-xs text-[#f2e6d8] placeholder-[#7a6754] focus:outline-none focus:border-[#c8960c]/60"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
            {CATEGORY_TABS.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] px-3 py-1 rounded-full whitespace-nowrap border transition-all duration-150 ${
                  selectedCategory === cat
                    ? 'bg-[#28180d] text-[#d4a24c] font-bold border-[#c8960c]'
                    : 'bg-[#1a110a] text-[#a89078] border-[#2d1e13] hover:text-[#f2e6d8] hover:border-[#3d2719]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Original Audio Option */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#1a110a] border border-[#2d1e13] rounded-xl">
            <span className="text-xs text-[#f2e6d8] font-medium">Original Audio</span>
            <button
              onClick={() => {
                setSelected(null);
                handleConfirmSelect(null);
              }}
              className="text-xs font-semibold text-[#d4a24c] hover:underline"
            >
              Use Original Sound Only
            </button>
          </div>

          {/* Mute Original Video Audio */}
          {isVideoMedia && selected !== null && selected.permission_status === 'AVAILABLE_TO_USE' && (
            <div className="flex items-center justify-between px-3 py-2 bg-[#1e130a] border border-[#382415] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-[#b8a694]">
                {muteOriginal ? <VolumeX size={14} className="text-amber-400" /> : <Volume2 size={14} className="text-[#a89078]" />}
                <span>Mute original video sound while music plays</span>
              </div>
              <input
                type="checkbox"
                checked={muteOriginal}
                onChange={e => setMuteOriginal(e.target.checked)}
                className="w-4 h-4 accent-[#c8960c] cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Music Sound List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {filteredSounds.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#a89078]">
              No cultural music entries found matching your query.
            </div>
          ) : (
            filteredSounds.map(sound => {
              const isAvailable = sound.permission_status === 'AVAILABLE_TO_USE';
              const isSelected = selected?.id === sound.id;
              const isPlaying = playingId === sound.id;
              const isExpanded = expandedInfoId === sound.id;

              return (
                <div
                  key={sound.id}
                  onClick={() => isAvailable && setSelected(sound)}
                  className={`p-3.5 rounded-xl border transition-all duration-150 ${
                    isSelected
                      ? 'border-[#c8960c] bg-[#24170d]'
                      : isAvailable
                      ? 'border-[#2d1e13] bg-[#1a110a] hover:border-[#3d2719] hover:bg-[#1f140c] cursor-pointer'
                      : 'border-[#251910] bg-[#140d08]/80 opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {isAvailable ? (
                        <button
                          onClick={(e) => handleTogglePreview(sound, e)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 ${
                            isPlaying
                              ? 'bg-[#c8960c] text-black shadow-lg'
                              : 'bg-[#28190e] border border-[#3d2719] text-[#d4a24c] hover:border-[#c8960c]'
                          }`}
                          title={isPlaying ? 'Pause preview' : 'Play preview'}
                        >
                          {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#1f140c] border border-[#382415] flex items-center justify-center text-amber-500/70 flex-shrink-0">
                          <Lock size={15} />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-[#f2e6d8] truncate">{sound.title}</p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2a1b0f] text-[#d4a24c] border border-[#3d2719] font-mono">
                            {sound.category}
                          </span>
                          {!isAvailable && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium flex items-center gap-1">
                              <Lock size={9} />
                              Available after licensing
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#a89078] truncate mt-0.5">{sound.artist} · {sound.duration}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedInfoId(isExpanded ? null : sound.id);
                        }}
                        className="p-1.5 text-[#a89078] hover:text-[#d4a24c] transition-colors rounded"
                        title="View cultural context & rights info"
                      >
                        <Info size={15} />
                      </button>

                      {isAvailable ? (
                        <button
                          onClick={() => {
                            setSelected(sound);
                            handleConfirmSelect(sound);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-[#c8960c] text-[#0e0906] font-bold'
                              : 'bg-[#28180d] border border-[#3d2719] text-[#d4a24c] hover:bg-[#382213]'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Use'}
                        </button>
                      ) : (
                        <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-[#1e140b] text-amber-400/80 border border-amber-500/20">
                          Licensing Required
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cultural Context & License Info Accordion */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#2d1e13] text-[11px] space-y-1.5 animate-fade-in bg-[#120c07] p-3 rounded-lg">
                      <div className="flex items-center gap-1.5 text-[#d4a24c] font-semibold">
                        <Sparkles size={12} />
                        <span>Cultural Significance:</span>
                      </div>
                      <p className="text-[#b8a694] leading-relaxed">{sound.cultural_context}</p>

                      <div className="pt-1.5 flex items-center justify-between text-[10px] text-[#8a7563] border-t border-[#24170d]">
                        <span className="flex items-center gap-1">
                          {isAvailable ? <ShieldCheck size={11} className="text-emerald-400" /> : <Lock size={11} className="text-amber-400" />}
                          {sound.license}
                        </span>
                        <span>{sound.attribution}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2d1e13] bg-[#1a110a] flex items-center justify-between">
          <button
            onClick={() => {
              setSelected(null);
              handleConfirmSelect(null);
            }}
            className="text-xs text-[#a89078] hover:text-red-400 transition-colors"
          >
            Remove Music
          </button>

          <button
            onClick={() => handleConfirmSelect(selected)}
            disabled={selected?.permission_status === 'LICENSING_REQUIRED'}
            className="btn-gold px-6 py-2 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
