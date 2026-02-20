import { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, Search, ChevronDown, X } from 'lucide-react';

export interface City {
  name: string;
  lat: number;
  lng: number;
}

export const CITIES: City[] = [
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Lyon', lat: 45.7640, lng: 4.8357 },
  { name: 'Marseille', lat: 43.2965, lng: 5.3698 },
  { name: 'Toulouse', lat: 43.6047, lng: 1.4442 },
  { name: 'Nice', lat: 43.7102, lng: 7.2620 },
  { name: 'Nantes', lat: 47.2184, lng: -1.5536 },
  { name: 'Montpellier', lat: 43.6108, lng: 3.8767 },
  { name: 'Strasbourg', lat: 48.5734, lng: 7.7521 },
  { name: 'Bordeaux', lat: 44.8378, lng: -0.5792 },
  { name: 'Lille', lat: 50.6292, lng: 3.0573 },
  { name: 'Rennes', lat: 48.1173, lng: -1.6778 },
  { name: 'Reims', lat: 49.2583, lng: 4.0317 },
  { name: 'Saint-Étienne', lat: 45.4397, lng: 4.3872 },
  { name: 'Le Havre', lat: 49.4944, lng: 0.1079 },
  { name: 'Toulon', lat: 43.1242, lng: 5.9280 },
  { name: 'Grenoble', lat: 45.1885, lng: 5.7245 },
  { name: 'Dijon', lat: 47.3220, lng: 5.0415 },
  { name: 'Angers', lat: 47.4784, lng: -0.5632 },
  { name: 'Nîmes', lat: 43.8367, lng: 4.3601 },
  { name: 'Clermont-Ferrand', lat: 45.7772, lng: 3.0870 },
  { name: 'Aix-en-Provence', lat: 43.5297, lng: 5.4474 },
  { name: 'Brest', lat: 48.3904, lng: -4.4861 },
  { name: 'Tours', lat: 47.3941, lng: 0.6848 },
  { name: 'Limoges', lat: 45.8336, lng: 1.2611 },
  { name: 'Amiens', lat: 49.8941, lng: 2.2958 },
  { name: 'Metz', lat: 49.1193, lng: 6.1757 },
  { name: 'Rouen', lat: 49.4432, lng: 1.0999 },
  { name: 'Perpignan', lat: 42.6887, lng: 2.8948 },
  { name: 'Orléans', lat: 47.9029, lng: 1.9093 },
  { name: 'Caen', lat: 49.1829, lng: -0.3707 },
];

export type LocationModeType = 'nearby' | 'city';

interface LocationModeProps {
  mode: LocationModeType;
  selectedCity: string | null;
  onModeChange: (mode: LocationModeType) => void;
  onCitySelect: (city: City) => void;
  locating?: boolean;
}

export function LocationMode({ mode, selectedCity, onModeChange, onCitySelect, locating }: LocationModeProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setSearchQuery('');
      }
    }
    if (showDropdown) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  const filteredCities = CITIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleSwitchToNearby() {
    onModeChange('nearby');
    setShowDropdown(false);
    setSearchQuery('');
  }

  function handleCityClick(city: City) {
    onCitySelect(city);
    setShowDropdown(false);
    setSearchQuery('');
  }

  return (
    <div className="flex items-center gap-1.5" ref={ref}>
      {/* Near me pill */}
      <button
        onClick={handleSwitchToNearby}
        className="flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold transition-all shrink-0"
        style={{
          background: mode === 'nearby' ? 'hsl(325 89% 50%)' : 'rgba(26, 13, 21, 0.8)',
          backdropFilter: 'blur(12px)',
          border: mode === 'nearby' ? 'none' : '1px solid hsl(325 89% 50% / 0.1)',
          color: mode === 'nearby' ? 'white' : 'hsl(225 15% 70%)',
          boxShadow: mode === 'nearby' ? '0 0 16px hsl(325 89% 50% / 0.3)' : '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <Navigation size={11} className={locating && mode === 'nearby' ? 'animate-spin' : ''} />
        <span>Près de moi</span>
      </button>

      {/* City dropdown trigger */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold transition-all shrink-0"
          style={{
            background: mode === 'city' ? 'hsl(275 71% 58%)' : 'rgba(26, 13, 21, 0.8)',
            backdropFilter: 'blur(12px)',
            border: mode === 'city' ? 'none' : '1px solid hsl(325 89% 50% / 0.1)',
            color: mode === 'city' ? 'white' : 'hsl(225 15% 70%)',
            boxShadow: mode === 'city' ? '0 0 16px hsl(275 71% 58% / 0.3)' : '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <MapPin size={11} />
          <span>{mode === 'city' && selectedCity ? selectedCity : 'Choisir une ville'}</span>
          <ChevronDown size={10} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        {showDropdown && (
          <div
            className="absolute top-full left-0 mt-2 w-60 rounded-2xl overflow-hidden"
            style={{
              zIndex: 9999,
              background: 'hsl(230 55% 8%)',
              border: '1px solid hsl(325 89% 50% / 0.15)',
              boxShadow: '0 12px 40px hsl(230 60% 4% / 0.9)',
            }}
          >
            {/* Search */}
            <div className="p-2.5">
              <div
                className="flex items-center gap-2 h-9 px-3 rounded-xl"
                style={{
                  background: 'hsl(230 40% 12%)',
                  border: '1px solid hsl(230 25% 20%)',
                }}
              >
                <Search size={12} style={{ color: 'hsl(225 15% 50%)' }} className="shrink-0" />
                <input
                  type="text"
                  placeholder="Rechercher une ville…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground min-w-0"
                  style={{ color: 'hsl(220 20% 90%)' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="shrink-0">
                    <X size={11} style={{ color: 'hsl(225 15% 50%)' }} />
                  </button>
                )}
              </div>
            </div>

            {/* City list */}
            <div className="max-h-64 overflow-y-auto pb-1.5">
              {filteredCities.length === 0 ? (
                <div className="px-3 py-4 text-xs text-center" style={{ color: 'hsl(225 15% 45%)' }}>
                  Aucune ville trouvée
                </div>
              ) : (
                filteredCities.map(city => (
                  <button
                    key={city.name}
                    onClick={() => handleCityClick(city)}
                    className="w-full text-left px-3 py-2.5 text-xs font-medium flex items-center gap-2.5 transition-colors"
                    style={{
                      color: selectedCity === city.name ? 'hsl(275 71% 70%)' : 'hsl(225 15% 75%)',
                      background: selectedCity === city.name ? 'hsl(275 71% 58% / 0.12)' : 'transparent',
                    }}
                    onMouseEnter={e => {
                      if (selectedCity !== city.name) e.currentTarget.style.background = 'hsl(230 40% 14%)';
                    }}
                    onMouseLeave={e => {
                      if (selectedCity !== city.name) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <MapPin size={11} style={{ opacity: 0.4 }} className="shrink-0" />
                    {city.name}
                    {selectedCity === city.name && (
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'hsl(275 71% 58% / 0.2)', color: 'hsl(275 71% 65%)' }}>
                        ✓
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
