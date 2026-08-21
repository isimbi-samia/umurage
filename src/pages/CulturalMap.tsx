import React, { useState } from 'react';
import { Map, MapPin, Search, ExternalLink, ShieldCheck, BookOpen, Clock, Loader2, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { CulturalPlace } from '@/types';

export const CulturalMap: React.FC = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<CulturalPlace | null>(null);
  const [activeProvinceFilter, setActiveProvinceFilter] = useState<string>('All');

  const { data: places = [], isLoading } = useQuery({
    queryKey: ['cultural-places'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cultural_places')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('Error querying cultural places:', error);
        return [];
      }
      return (data || []) as CulturalPlace[];
    },
    staleTime: 60000,
  });

  const provinces = ['All', 'Kigali City', 'Northern Province', 'Southern Province', 'Eastern Province', 'Western Province'];

  const filteredPlaces = places.filter((place) => {
    const matchProvince = activeProvinceFilter === 'All' || place.province.toLowerCase() === activeProvinceFilter.toLowerCase();
    const matchSearch =
      !search ||
      place.name.toLowerCase().includes(search.toLowerCase()) ||
      place.district.toLowerCase().includes(search.toLowerCase()) ||
      place.description.toLowerCase().includes(search.toLowerCase()) ||
      place.cultural_significance.toLowerCase().includes(search.toLowerCase());
    return matchProvince && matchSearch;
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-700/40 flex items-center justify-center">
            <Map size={22} className="text-umurage-gold" />
          </div>
          <h1 className="font-cinzel text-3xl text-umurage-gold font-bold">{t('nav.map')}</h1>
        </div>
        <p className="text-umurage-muted text-base">
          Discover Rwanda's heritage sites, royal palaces, museum institutions, and sacred cultural landscapes with verified academic sources.
        </p>
      </div>

      {/* Search & Province Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search place name (e.g. Kigali, Musanze, Nyanza, Huye)..."
            className="w-full bg-umurage-card border border-umurage-border rounded-xl pl-11 pr-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/50"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {provinces.map((prov) => (
            <button
              key={prov}
              onClick={() => setActiveProvinceFilter(prov)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                activeProvinceFilter === prov
                  ? 'bg-umurage-gold text-umurage-bg border-umurage-gold font-bold'
                  : 'bg-umurage-card border-umurage-border text-umurage-muted hover:border-umurage-gold/40 hover:text-umurage-cream'
              }`}
            >
              {prov}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View & Place Pins */}
        <div className="lg:col-span-2 umurage-card rounded-2xl overflow-hidden min-h-[500px] border border-umurage-border relative flex flex-col">
          {/* Map Top Banner */}
          <div className="p-4 bg-[#1e140a] border-b border-umurage-border flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-xs font-medium text-umurage-muted">
              <Sparkles size={14} className="text-umurage-gold" />
              Interactive Rwandan Cultural Map ({filteredPlaces.length} verified locations)
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-green-900/40 text-green-300 border border-green-800/40">
              Verified Heritage
            </span>
          </div>

          {/* Interactive Map Visual */}
          <div className="relative flex-1 w-full bg-[#120b06] min-h-[440px] flex items-center justify-center p-6">
            <img
              src="https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=1000&h=600&fit=crop"
              alt="Rwanda landscape"
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#120b06] via-[#120b06]/80 to-transparent" />

            {/* Place Pins Grid View */}
            {isLoading ? (
              <div className="relative z-10 flex items-center text-umurage-muted text-sm">
                <Loader2 size={20} className="mr-2 animate-spin text-umurage-gold" />
                Loading cultural map data...
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="relative z-10 text-center text-umurage-muted text-sm p-6">
                No verified cultural sites found matching "{search}".
              </div>
            ) : (
              <div className="relative z-10 w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPlaces.map((place) => {
                  const isSelected = selectedPlace?.id === place.id;
                  return (
                    <div
                      key={place.id}
                      onClick={() => setSelectedPlace(place)}
                      className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 ${
                        isSelected
                          ? 'bg-umurage-gold/20 border-2 border-umurage-gold shadow-[0_0_20px_rgba(200,150,12,0.3)]'
                          : 'bg-[#1e130a]/90 border-umurage-border hover:border-umurage-gold/50 hover:bg-[#281a0e]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className={isSelected ? 'text-umurage-gold' : 'text-amber-500'} />
                          <h4 className="text-umurage-cream font-semibold text-sm leading-snug">{place.name}</h4>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40 flex-shrink-0">
                          {place.district}
                        </span>
                      </div>
                      <p className="text-umurage-muted text-xs line-clamp-2 leading-relaxed">{place.cultural_significance}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Detailed Place Information Sidebar */}
        <div className="space-y-4">
          {selectedPlace ? (
            <div className="umurage-card rounded-2xl p-6 border border-umurage-gold/30 animate-fade-in space-y-4">
              {selectedPlace.image && (
                <div className="relative h-44 rounded-xl overflow-hidden mb-2">
                  <img src={selectedPlace.image} alt={selectedPlace.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-amber-300 font-semibold border border-amber-600/40">
                    {selectedPlace.category || 'Heritage Site'}
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-cinzel text-xl text-umurage-gold font-bold">{selectedPlace.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-umurage-subtle mt-1">
                    <MapPin size={12} className="text-amber-400" />
                    <span>{selectedPlace.district}, {selectedPlace.province}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-umurage-gold uppercase tracking-wider mb-1">Cultural Significance</h4>
                <p className="text-umurage-cream text-xs leading-relaxed">{selectedPlace.cultural_significance}</p>
              </div>

              {selectedPlace.historical_context && (
                <div>
                  <h4 className="text-xs font-semibold text-umurage-gold uppercase tracking-wider mb-1">Historical Context</h4>
                  <p className="text-umurage-muted text-xs leading-relaxed">{selectedPlace.historical_context}</p>
                </div>
              )}

              {selectedPlace.sources && (
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1">
                    <ShieldCheck size={14} /> Verified Sources & Attribution
                  </div>
                  <p className="text-umurage-subtle text-[11px] leading-relaxed">{selectedPlace.sources}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="umurage-card rounded-2xl p-6 text-center border border-dashed border-umurage-border">
              <MapPin size={36} className="text-umurage-gold/40 mx-auto mb-3" />
              <h3 className="text-umurage-cream font-semibold text-sm mb-1">Select a Cultural Location</h3>
              <p className="text-umurage-muted text-xs leading-relaxed">
                Click any place pin on the map or select from the list to view historical context, cultural significance, and verified academic sources.
              </p>
            </div>
          )}

          {/* Quick List of Places */}
          <div className="umurage-card rounded-2xl p-4 border border-umurage-border">
            <h4 className="text-xs font-semibold text-umurage-gold uppercase tracking-wider mb-3">All Verified Locations</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredPlaces.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlace(p)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                    selectedPlace?.id === p.id
                      ? 'bg-umurage-gold/15 border-umurage-gold text-umurage-cream font-semibold'
                      : 'bg-[#181009] border-umurage-border text-umurage-muted hover:text-umurage-cream'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  <span className="text-[10px] text-umurage-subtle flex-shrink-0 ml-2">{p.district}</span>
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
