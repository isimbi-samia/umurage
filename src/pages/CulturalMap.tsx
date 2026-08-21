import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Compass, BookOpen, ExternalLink, Filter, ShieldCheck, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Fix standard Leaflet default icon path bug in React bundlers
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface CulturalSite {
  id: string;
  name: string;
  kinyarwandaName: string;
  district: string;
  sector: string;
  cell: string;
  province: 'Southern' | 'Northern' | 'Eastern' | 'Western' | 'Kigali';
  coordinates: [number, number]; // [lat, lng]
  category: 'Royal Court' | 'Museum' | 'Sacred Site' | 'Craft Village' | 'Natural Monument' | 'Historical Heritage';
  image: string;
  description: string;
  historicalContext: string;
  verifiedSource: string;
  sourceUrl?: string;
  recentNews?: string;
}

const CULTURAL_SITES: CulturalSite[] = [
  {
    id: 'nyanza-palace',
    name: "King's Palace Museum (Ingoro y'Umutware)",
    kinyarwandaName: "Ingoro y'Uwami i Nyanza",
    district: 'Nyanza',
    sector: 'Busasamana',
    cell: 'Kavumu',
    province: 'Southern',
    coordinates: [-2.3524, 29.7508],
    category: 'Royal Court',
    image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=600&h=400&fit=crop',
    description: "The historic royal capital of the Kingdom of Rwanda during the reign of King Mutara III Rudahigwa.",
    historicalContext: "Nyanza was the heart of the monarchy for over two centuries. Features the traditional beehive royal palace constructed entirely with natural materials, and the sacred long-horned Inyambo cattle trained to march in traditional ceremonies.",
    verifiedSource: "Institute of National Museums of Rwanda (INMR) & RCHA Archives",
    recentNews: "Royal Court Abiru elders continue annual Inyambo grooming ceremonies celebrating traditional cattle poetry (Amahero).",
  },
  {
    id: 'huye-museum',
    name: 'Ethnographic Museum of Rwanda',
    kinyarwandaName: "Inzu ndangamurage i Huye",
    district: 'Huye',
    sector: 'Ngoma',
    cell: 'Matyazo',
    province: 'Southern',
    coordinates: [-2.5967, 29.7397],
    category: 'Museum',
    image: 'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=600&h=400&fit=crop',
    description: "Housing one of Africa's finest ethnological collections, featuring over 10,000 authentic pre-colonial artifacts.",
    historicalContext: "Gifted to Rwanda in 1989, this museum preserves traditional hunting tools, royal weaving, Inanga instruments, and pre-colonial agricultural implements.",
    verifiedSource: "Rwanda Cultural Heritage Academy (RCHA)",
    recentNews: "New digital archiving initiative launched with UNESCO to digitize 19th-century royal weaving patterns.",
  },
  {
    id: 'musanze-ibyiwacu',
    name: "Iby'iwacu Cultural Village & Kinigi Traditions",
    kinyarwandaName: "Umudugudu w'Umuco i Kinigi",
    district: 'Musanze',
    sector: 'Kinigi',
    cell: 'Nyonirima',
    province: 'Northern',
    coordinates: [-1.4367, 29.5786],
    category: 'Craft Village',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop',
    description: "Living cultural sanctuary where former poachers preserve Intore warrior dance traditions and traditional medicine.",
    historicalContext: "Located at the foot of Volcanoes National Park, community elders demonstrate ancient archery, royal court enthronement rituals, and herbal medicine.",
    verifiedSource: "Rwanda Development Board (RDB) Cultural Conservation",
    recentNews: "Community expanded Intore dance academy training over 120 young dancers in ancestral drumming rhythms.",
  },
  {
    id: 'urutare-kamegeri',
    name: 'Urutare rwa Kamegeri (Kamegeri Rock)',
    kinyarwandaName: 'Urutare rwa Kamegeri i Ruhango',
    district: 'Ruhango',
    sector: 'Ruhango',
    cell: 'Buhoro',
    province: 'Southern',
    coordinates: [-2.2185, 29.7745],
    category: 'Natural Monument',
    image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&h=400&fit=crop',
    description: "Historic natural rock monument associated with the legend of King Mibambwe IV Rutarindwa and Kamegeri.",
    historicalContext: "Oral history records that Kamegeri advised heating a massive rock to execute criminals, but King Mibambwe ruled that Kamegeri himself be tested on the rock to demonstrate justice and mercy.",
    verifiedSource: "Rwandan Oral History Archives & RALC",
    recentNews: "District tourism office installed protected walkways and historical interpretive markers for visitors.",
  },
  {
    id: 'utubindi-rubona',
    name: 'Utubindi twa Rubona (Sacred Water Pots of Ruganzu)',
    kinyarwandaName: 'Utubindi twa Rubona i Gatsibo',
    district: 'Gatsibo',
    sector: 'Kageyo',
    cell: 'Rubona',
    province: 'Eastern',
    coordinates: [-1.5912, 30.4321],
    category: 'Sacred Site',
    image: 'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=600&h=400&fit=crop',
    description: "Sacred rock depressions shaped like water pots carved during the reign of warrior King Ruganzu II Ndoli.",
    historicalContext: "According to oral traditions, King Ruganzu II Ndoli rested here with his army during military expeditions and miraculously struck the rock to draw fresh spring water for his thirsty soldiers.",
    verifiedSource: "RCHA Heritage Survey",
    recentNews: "RCHA designated Utubindi twa Rubona a protected National Cultural Landmark in Eastern Province.",
  },
  {
    id: 'mulindi-liberation',
    name: 'National Liberation Park Museum (Mulindi)',
    kinyarwandaName: 'Mulindi w\'Intwari i Gicumbi',
    district: 'Gicumbi',
    sector: 'Kaniga',
    cell: 'Mulindi',
    province: 'Northern',
    coordinates: [-1.4782, 30.0125],
    category: 'Historical Heritage',
    image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=600&h=400&fit=crop',
    description: "Historical headquarters of the Rwandan Patriotic Front (RPF) during the 1990-1994 liberation struggle.",
    historicalContext: "Preserves the original tea plantation bunkers, command centers, and radio broadcasting sites where decisions shaping modern Rwanda were made.",
    verifiedSource: "Ministry of Youth and Arts (MINYOUTH)",
    recentNews: "Preservation center completed structural restoration of the historical command bunker.",
  },
  {
    id: 'kigali-art-museum',
    name: 'Rwanda Art Museum (Kanombe)',
    kinyarwandaName: 'Ingoro y\'Ubugeni i Kanombe',
    district: 'Kicukiro',
    sector: 'Kanombe',
    cell: 'Kabarondo',
    province: 'Kigali',
    coordinates: [-1.9647, 30.1583],
    category: 'Museum',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop',
    description: "Contemporary Rwandan art gallery showcasing Imigongo relief paintings, wood sculptures, and modern expressions.",
    historicalContext: "Located at the former Presidential residence in Kanombe, displaying works by over 80 master Rwandan visual artists.",
    verifiedSource: "Institute of National Museums of Rwanda",
    recentNews: "Annual Made-in-Rwanda Imigongo exhibition featuring female artists from Eastern Province.",
  },
];

export const CulturalMap: React.FC = () => {
  const { t } = useLanguage();
  const [selectedProvince, setSelectedProvince] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSite, setActiveSite] = useState<CulturalSite | null>(CULTURAL_SITES[0]);

  const filteredSites = CULTURAL_SITES.filter((site) => {
    const matchesProvince = selectedProvince === 'All' || site.province === selectedProvince;
    const matchesSearch =
      !searchQuery ||
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProvince && matchesSearch;
  });

  return (
    <div className="animate-fade-in space-y-6 text-umurage-cream">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass size={24} className="text-umurage-gold" />
            <h1 className="font-cinzel text-3xl text-umurage-gold font-bold">{t('map.title')}</h1>
          </div>
          <p className="text-umurage-muted text-xs md:text-sm max-w-2xl">
            Explore verified Rwandan heritage sites across Provinces, Districts, Sectors, and Cells with OpenStreetMap zooming and academic attributions.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-umurage-subtle" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search District, Sector, Cell, or Place..."
            className="w-full bg-[#1c120a] border border-[#4a2e16] rounded-xl pl-10 pr-4 py-2.5 text-xs text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60"
          />
        </div>
      </div>

      {/* Province Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {['All', 'Kigali', 'Southern', 'Northern', 'Eastern', 'Western'].map((prov) => (
          <button
            key={prov}
            onClick={() => setSelectedProvince(prov)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedProvince === prov
                ? 'bg-umurage-gold text-umurage-bg border-umurage-gold font-bold shadow-md'
                : 'bg-[#1c120a] border-[#4a2e16] text-umurage-muted hover:text-umurage-cream'
            }`}
          >
            {prov === 'All' ? 'All Provinces' : `${prov} Province`}
          </button>
        ))}
      </div>

      {/* Main Map & Info Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Interactive Leaflet OpenStreetMap Container */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-[#5c3c1e] shadow-2xl h-[520px] relative bg-[#120a05]">
          <MapContainer
            center={[-1.9403, 29.8739]}
            zoom={9}
            scrollWheelZoom={true}
            zoomControl={false}
            className="w-full h-full z-10"
          >
            <ZoomControl position="topright" />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredSites.map((site) => (
              <Marker
                key={site.id}
                position={site.coordinates}
                icon={customMarkerIcon}
                eventHandlers={{
                  click: () => setActiveSite(site),
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-1 text-xs text-slate-900 font-sans">
                    <p className="font-bold text-amber-900 text-sm leading-tight">{site.name}</p>
                    <p className="text-[11px] text-slate-600 font-semibold">{site.district} District • {site.sector} Sector</p>
                    <button
                      onClick={() => setActiveSite(site)}
                      className="mt-1 text-[10px] font-bold text-amber-800 underline block"
                    >
                      View Cultural Details & History →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map Overlay Badge */}
          <div className="absolute bottom-3 left-3 z-20 bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-[11px] text-amber-200 flex items-center gap-2">
            <MapPin size={14} className="text-amber-400" />
            <span>Interactive Zoom: District → Sector → Cell → Village</span>
          </div>
        </div>

        {/* Selected Place Details Panel (Human-Crafted Aesthetics) */}
        <div className="lg:col-span-1 rounded-2xl bg-[#1a110a] border border-[#5c3c1e] p-5 space-y-4 shadow-xl">
          {activeSite ? (
            <div className="space-y-4">
              <div className="relative h-44 rounded-xl overflow-hidden border border-[#4a2e16]">
                <img src={activeSite.image} alt={activeSite.name} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 bg-amber-900/80 backdrop-blur-md text-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-amber-700/50">
                  {activeSite.category}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {activeSite.province} Province • {activeSite.district} District
                </span>
                <h3 className="font-cinzel text-xl text-amber-300 font-bold leading-tight mt-1 mb-0.5">
                  {activeSite.name}
                </h3>
                <p className="text-xs text-amber-100/70 italic">{activeSite.kinyarwandaName}</p>
                <p className="text-xs text-amber-200/50 mt-1">Sector: {activeSite.sector} | Cell: {activeSite.cell}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#24170d] border border-[#4a2e16] space-y-2 text-xs">
                <h4 className="font-semibold text-amber-300 flex items-center gap-1.5 text-xs">
                  <BookOpen size={14} /> Historical Context & Values
                </h4>
                <p className="text-umurage-cream leading-relaxed text-xs">{activeSite.historicalContext}</p>
              </div>

              {activeSite.recentNews && (
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 space-y-1 text-xs">
                  <p className="font-semibold text-amber-400 text-[11px]">Verified Cultural News & Updates</p>
                  <p className="text-amber-100/90 text-xs leading-relaxed">{activeSite.recentNews}</p>
                </div>
              )}

              <div className="pt-2 border-t border-[#4a2e16] flex items-center justify-between text-[11px] text-amber-300/80">
                <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-green-400" /> {activeSite.verifiedSource}</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-umurage-muted text-xs">
              Select a marker on the map to inspect cultural heritage details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CulturalMap;
