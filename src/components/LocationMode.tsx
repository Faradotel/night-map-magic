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
  { name: 'Bordeaux', lat: 44.8378, lng: -0.5792 },
  { name: 'Lille', lat: 50.6292, lng: 3.0573 },
  { name: 'Nantes', lat: 47.2184, lng: -1.5536 },
  { name: 'Strasbourg', lat: 48.5734, lng: 7.7521 },
  { name: 'Montpellier', lat: 43.6108, lng: 3.8767 },
  { name: 'Rennes', lat: 48.1173, lng: -1.6778 },
  { name: 'Nice', lat: 43.7102, lng: 7.2620 },
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
  const [showCityList, setShowCityList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowCityList(false);
        setSearchQuery('');
      }
    }
    if (showCityList) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCityList]);

  const filteredCities = CITIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleSwitchToNearby() {
    onModeChange('nearby');
    setShowCityList(false);
    setSearchQuery('');
  }

  function handleSwitchToCity() {
    onModeChange('city');
    setShowCityList(true);
  }

  function handleCityClick(city: City) {
    onCitySelect(city);
    setShowCityList(false);
    setSearchQuery('');
  }

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1">
        {/* Near me pill */}
        <button
          onClick={handleSwitchToNearby}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-semibold border transition-all"
          style={{
            background: mode === 'nearby'
              ? 'hsl(325 89% 50% / 0.15)'
              : 'hsl(230 50% 10% / 0.92)',
            borderColor: mode === 'nearby' ? 'hsl(325 89% 50%)' : 'hsl(230 25% 20%)',
            color: mode === 'nearby' ? 'hsl(325 89% 55%)' : 'hsl(225 15% 60%)',
            backdropFilter: 'blur(12px)',
            boxShadow: mode === 'nearby' ? '0 0 10px hsl(325 89% 50% / 0.25)' : 'none',
          }}
        >
          <Navigation size={10} className={locating && mode === 'nearby' ? 'animate-spin' : ''} />
          <span>Près de moi</span>
        </button>

        {/* City pill */}
        <button
          onClick={() => {
            if (mode === 'city') {
              setShowCityList(!showCityList);
            } else {
              handleSwitchToCity();
            }
          }}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-semibold border transition-all"
          style={{
            background: mode === 'city'
              ? 'hsl(275 71% 58% / 0.15)'
              : 'hsl(230 50% 10% / 0.92)',
            borderColor: mode === 'city' ? 'hsl(275 71% 58%)' : 'hsl(230 25% 20%)',
            color: mode === 'city' ? 'hsl(275 71% 65%)' : 'hsl(225 15% 60%)',
            backdropFilter: 'blur(12px)',
            boxShadow: mode === 'city' ? '0 0 10px hsl(275 71% 58% / 0.25)' : 'none',
          }}
        >
          <MapPin size={10} />
          <span>{mode === 'city' && selectedCity ? selectedCity : 'Autre ville'}</span>
          <ChevronDown size={9} className={`transition-transform ${showCityList ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* City dropdown */}
      {showCityList && (
        <div
          className="absolute top-full left-0 mt-2 w-56 rounded-2xl border overflow-hidden z-[600]"
          style={{
            background: 'hsl(230 50% 8% / 0.97)',
            borderColor: 'hsl(230 25% 16%)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 12px 40px hsl(230 60% 4% / 0.85)',
          }}
        >
          {/* Search input */}
          <div className="px-3 pt-3 pb-2">
            <div
              className="flex items-center gap-2 h-8 px-2.5 rounded-xl border"
              style={{
                background: 'hsl(230 35% 12%)',
                borderColor: 'hsl(230 25% 20%)',
              }}
            >
              <Search size={12} style={{ color: 'hsl(225 15% 50%)' }} />
              <input
                type="text"
                placeholder="Rechercher une ville…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                style={{ color: 'hsl(220 20% 90%)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X size={11} style={{ color: 'hsl(225 15% 50%)' }} />
                </button>
              )}
            </div>
          </div>

          {/* City list */}
          <div className="pb-2 max-h-52 overflow-y-auto">
            <div className="px-3 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(225 15% 40%)' }}>
                Villes populaires
              </span>
            </div>
            {filteredCities.length === 0 ? (
              <div className="px-3 py-3 text-xs text-center" style={{ color: 'hsl(225 15% 45%)' }}>
                Aucune ville trouvée
              </div>
            ) : (
              filteredCities.map(city => (
                <button
                  key={city.name}
                  onClick={() => handleCityClick(city)}
                  className="w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-2"
                  style={{
                    color: selectedCity === city.name ? 'hsl(275 71% 65%)' : 'hsl(225 15% 70%)',
                    background: selectedCity === city.name ? 'hsl(275 71% 58% / 0.1)' : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (selectedCity !== city.name) (e.currentTarget as HTMLElement).style.background = 'hsl(230 35% 14%)';
                  }}
                  onMouseLeave={e => {
                    if (selectedCity !== city.name) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <MapPin size={11} style={{ opacity: 0.5 }} />
                  {city.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
