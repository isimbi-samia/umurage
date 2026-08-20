import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Play, Pause, Music, Check, Volume2, VolumeX, Info, ShieldCheck, Sparkles } from 'lucide-react';
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
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTogglePreview = (sound: RwandanCulturalMusic, e: React.MouseEvent) => {
    e.stopPropagation();
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
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
    onSelectSound(sound, muteOriginal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-[#2d1e13] bg-[#160f09] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d1e13] bg-[#1a110a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#c8960c]/15 border border-[#c8960c]/30 flex items-center justify-center text-[#d4a24c]">
              <Music size={18} />
            </div>
            <div>
              <h2 className="font-cinzel text-base font-bold text-[#f2e6d8]">Rwandan Cultural Music Library</h2>
              <p className="text-[11px] text-[#a89078]">Authentic, authorized traditional music & heritage sounds</p>
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

        {/* Search & Category Tabs */}
        <div className="p-4 border-b border-[#2d1e13] bg-[#120b06] space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7a6754]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Intore, Inanga, Ingoma, or artist..."
              className="w-full bg-[#1a110a] border border-[#2d1e13] rounded-xl pl-9 pr-4 py-2 text-xs text-[#f2e6d8] placeholder-[#7a6754] focus:outline-none focus:border-[#c8960c]/60"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
            {CATEGORY_TABS.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] px-3 py-1 rounded-full whitespace-nowrap border transition-all duration-150 ${
                  selectedCategory === cat
                    ? 'bg-[#c8960c] text-[#0e0906] font-bold border-[#c8960c]'
                    : 'bg-[#1a110a] text-[#a89078] border-[#2d1e13] hover:text-[#f2e6d8] hover:border-[#3d2719]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Original Sound Toggle */}
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
          {isVideoMedia && selected !== null && (
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

        {/* Sound List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {filteredSounds.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#a89078]">
              No authentic cultural music found matching "{searchQuery}"
            </div>
          ) : (
            filteredSounds.map(sound => {
              const isSelected = selected?.id === sound.id;
              const isPlaying = playingId === sound.id;
              const isExpanded = expandedInfoId === sound.id;

              return (
                <div
                  key={sound.id}
                  onClick={() => setSelected(sound)}
                  className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'border-[#c8960c] bg-[#24170d]'
                      : 'border-[#2d1e13] bg-[#1a110a] hover:border-[#3d2719] hover:bg-[#1f140c]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
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

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-[#f2e6d8] truncate">{sound.title}</p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2a1b0f] text-[#d4a24c] border border-[#3d2719] font-mono">
                            {sound.category}
                          </span>
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
                        title="View cultural context & licensing"
                      >
                        <Info size={15} />
                      </button>

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
                    </div>
                  </div>

                  {/* Cultural Context & License Info Accordion */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#2d1e13] text-[11px] space-y-1.5 animate-fade-in bg-[#120c07] p-2.5 rounded-lg">
                      <div className="flex items-center gap-1.5 text-[#d4a24c] font-semibold">
                        <Sparkles size={12} />
                        <span>Cultural Significance:</span>
                      </div>
                      <p className="text-[#b8a694] leading-relaxed">{sound.cultural_context}</p>

                      <div className="pt-1.5 flex items-center justify-between text-[10px] text-[#8a7563] border-t border-[#24170d]">
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={11} className="text-emerald-400" />
                          {sound.license}
                        </span>
                        <span>Source: {sound.attribution}</span>
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
            className="btn-gold px-6 py-2 text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
