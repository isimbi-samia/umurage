import React, { useState } from 'react';
import { Map, MapPin, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const REGIONS = [
  { id: 'kigali', name: 'Kigali City', x: 52, y: 45, traditions: 34, stories: 89, events: 12, color: '#C8960C', highlight: 'Home of modern Rwanda\'s cultural renaissance' },
  { id: 'northern', name: 'Northern Province', x: 48, y: 22, traditions: 67, stories: 134, events: 8, color: '#D4820A', highlight: 'Land of volcanoes and gorilla conservation culture' },
  { id: 'southern', name: 'Southern Province', x: 40, y: 65, traditions: 89, stories: 201, events: 15, color: '#8B6914', highlight: 'Birthplace of ancient kingdoms — Nyanza royal palace' },
  { id: 'eastern', name: 'Eastern Province', x: 72, y: 50, traditions: 55, stories: 112, events: 7, color: '#E8B422', highlight: 'Home of Imigongo art and Inyambo cattle traditions' },
  { id: 'western', name: 'Western Province', x: 25, y: 48, traditions: 71, stories: 158, events: 11, color: '#A07820', highlight: 'Lake Kivu region — fishing traditions and mountain culture' },
];

const CulturalMap: React.FC = () => {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<typeof REGIONS[0] | null>(null);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Map size={24} className="text-umurage-gold" />
          <h1 className="font-cinzel text-3xl text-umurage-gold font-bold">{t('nav.map')}</h1>
        </div>
        <p className="text-umurage-muted text-base">Explore Rwanda's culture by region — stories, traditions, and heritage by location.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map visual */}
        <div className="lg:col-span-2 umurage-card rounded-2xl overflow-hidden" style={{ minHeight: '460px' }}>
          <div className="relative w-full h-full" style={{ minHeight: '460px' }}>
            {/* Rwanda map background */}
            <img
              src="https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=800&h=500&fit=crop"
              alt="Rwanda landscape"
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-umurage-bg/60" />

            {/* Rwanda shape overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-72 h-72">
                {/* Simplified Rwanda shape */}
                <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
                  <path
                    d="M60 30 L80 20 L120 25 L150 40 L165 70 L160 100 L150 130 L130 160 L100 175 L70 165 L45 145 L35 115 L30 80 L40 55 Z"
                    fill="rgba(200,150,12,0.08)"
                    stroke="rgba(200,150,12,0.4)"
                    strokeWidth="1.5"
                  />
                  {/* Region dots */}
                  {REGIONS.map(r => (
                    <g key={r.id}>
                      <circle
                        cx={r.x * 2}
                        cy={r.y * 2}
                        r="8"
                        fill={selected?.id === r.id ? r.color : 'rgba(200,150,12,0.3)'}
                        stroke={r.color}
                        strokeWidth="1.5"
                        className="cursor-pointer transition-all duration-200"
                        onClick={() => setSelected(r)}
                      />
                      <circle
                        cx={r.x * 2}
                        cy={r.y * 2}
                        r="14"
                        fill="transparent"
                        stroke={r.color}
                        strokeWidth="0.5"
                        opacity="0.4"
                        className="cursor-pointer"
                        onClick={() => setSelected(r)}
                      />
                    </g>
                  ))}
                </svg>

                {/* Region labels */}
                {REGIONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 cursor-pointer group"
                    style={{ left: `${r.x}%`, top: `${r.y}%` }}
                  >
                    <MapPin size={20} style={{ color: r.color }} className="group-hover:scale-125 transition-transform" />
                    <span className="text-[9px] text-umurage-cream/80 whitespace-nowrap font-medium bg-umurage-bg/70 px-1.5 py-0.5 rounded">
                      {r.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Region info */}
        <div className="space-y-4">
          {selected ? (
            <div className="umurage-card rounded-2xl p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={18} style={{ color: selected.color }} />
                <h3 className="font-cinzel text-umurage-gold font-bold text-lg">{selected.name}</h3>
              </div>
              <p className="text-umurage-muted text-sm leading-relaxed mb-5">{selected.highlight}</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Traditions', value: selected.traditions, icon: '🌿' },
                  { label: 'Stories', value: selected.stories, icon: '📖' },
                  { label: 'Events', value: selected.events, icon: '🎪' },
                ].map(stat => (
                  <div key={stat.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(200,150,12,0.07)', border: '1px solid rgba(200,150,12,0.15)' }}>
                    <span className="text-xl block mb-1">{stat.icon}</span>
                    <p className="text-umurage-gold font-bold text-lg font-cinzel">{stat.value}</p>
                    <p className="text-umurage-subtle text-[10px]">{stat.label}</p>
                  </div>
                ))}
              </div>
              <button className="btn-gold w-full mt-4 py-2.5 text-sm">Explore {selected.name}</button>
            </div>
          ) : (
            <div className="umurage-card rounded-2xl p-5 text-center">
              <Info size={32} className="text-umurage-gold/40 mx-auto mb-3" />
              <h3 className="text-umurage-cream font-semibold mb-2">Select a Region</h3>
              <p className="text-umurage-muted text-sm">Click any region pin on the map to explore its cultural traditions, stories, and events.</p>
            </div>
          )}

          {/* All regions list */}
          <div className="umurage-card rounded-2xl p-4">
            <h4 className="text-umurage-gold font-semibold text-sm mb-3">All Regions</h4>
            <div className="space-y-2">
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-all duration-200 ${selected?.id === r.id ? 'bg-umurage-surface border border-umurage-gold/30' : 'hover:bg-umurage-surface'}`}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  <span className="text-umurage-cream text-sm font-medium flex-1 text-left">{r.name}</span>
                  <span className="text-umurage-subtle text-xs">{r.traditions} traditions</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CulturalMap;
