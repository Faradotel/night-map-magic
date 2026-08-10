import { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, Search, ChevronDown, X, Globe } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { getDistance } from '@/data/mockEvents';

export interface City {
  name: string;
  lat: number;
  lng: number;
}

export const CITIES: City[] = [
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Marseille', lat: 43.2965, lng: 5.3698 },
  { name: 'Lyon', lat: 45.7640, lng: 4.8357 },
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
  { name: 'Mulhouse', lat: 47.7508, lng: 7.3359 },
  { name: 'Nancy', lat: 48.6921, lng: 6.1844 },
  { name: 'Saint-Denis (Réunion)', lat: -20.8823, lng: 55.4504 },
  { name: 'Argenteuil', lat: 48.9472, lng: 2.2467 },
  { name: 'Montreuil', lat: 48.8638, lng: 2.4484 },
  { name: 'Roubaix', lat: 50.6942, lng: 3.1746 },
  { name: 'Tourcoing', lat: 50.7239, lng: 3.1612 },
  { name: 'Dunkerque', lat: 51.0343, lng: 2.3768 },
  { name: 'Avignon', lat: 43.9493, lng: 4.8055 },
  { name: 'Nanterre', lat: 48.8924, lng: 2.2071 },
  { name: 'Poitiers', lat: 46.5802, lng: 0.3404 },
  { name: 'Versailles', lat: 48.8014, lng: 2.1301 },
  { name: 'Courbevoie', lat: 48.8966, lng: 2.2529 },
  { name: 'Vitry-sur-Seine', lat: 48.7875, lng: 2.3924 },
  { name: 'Créteil', lat: 48.7909, lng: 2.4551 },
  { name: 'Pau', lat: 43.2951, lng: -0.3708 },
  { name: 'Colombes', lat: 48.9226, lng: 2.2537 },
  { name: 'La Rochelle', lat: 46.1603, lng: -1.1511 },
  { name: 'Besançon', lat: 47.2378, lng: 6.0241 },
  { name: 'Valence', lat: 44.9334, lng: 4.8924 },
  { name: 'Monaco', lat: 43.7384, lng: 7.4246 },
];

const NEARBY_CITY_MAX_KM = 30;

// Nearest-neighbor lookup against CITIES, used to auto-detect a default city
// from geolocation coords (boot-time detection and onboarding "use my location").
export function findNearestCity(lat: number, lng: number): City | null {
  let best: City | null = null;
  let bestDist = Infinity;
  for (const c of CITIES) {
    const d = getDistance(lat, lng, c.lat, c.lng);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best && bestDist <= NEARBY_CITY_MAX_KM ? best : null;
}

export type LocationModeType = 'nearby' | 'city' | 'france';

interface LocationModeProps {
  mode: LocationModeType;
  selectedCity: string | null;
  onModeChange: (mode: LocationModeType) => void;
  onCitySelect: (city: City) => void;
  locating?: boolean;
  onFranceMode?: () => void;
}

export function LocationMode({ mode, selectedCity, onModeChange, onCitySelect, locating, onFranceMode }: LocationModeProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
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

  const secondaryBg = isLight ? 'rgba(255,253,250,0.82)' : 'rgba(26, 13, 21, 0.8)';
  const secondaryBorder = isLight ? '1px solid hsl(30 30% 80% / 0.6)' : '1px solid hsl(325 89% 50% / 0.1)';
  const secondaryColor = isLight ? 'hsl(260 20% 30%)' : 'hsl(225 15% 70%)';
  const secondaryShadow = isLight
    ? '0 4px 14px hsl(280 30% 20% / 0.08), 0 1px 3px hsl(280 30% 20% / 0.05)'
    : '0 2px 8px rgba(0,0,0,0.3)';

  return (
    <div className="flex items-center gap-1.5" ref={ref}>
      {/* Near me pill — secondary */}
      <button
        onClick={handleSwitchToNearby}
        className="flex items-center gap-1.5 h-9 px-3 rounded-full text-[11px] font-semibold transition-all shrink-0 active:scale-95"
        style={{
          background: mode === 'nearby' ? 'hsl(325 95% 54%)' : secondaryBg,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: mode === 'nearby' ? 'none' : secondaryBorder,
          color: mode === 'nearby' ? 'white' : secondaryColor,
          boxShadow: mode === 'nearby'
            ? '0 0 18px hsl(325 95% 54% / 0.45), 0 4px 12px hsl(325 95% 54% / 0.25)'
            : secondaryShadow,
        }}
      >
        <Navigation size={11} className={locating && mode === 'nearby' ? 'animate-spin' : ''} />
        <span>Près de moi</span>
      </button>

      {/* France pill — tertiary */}
      <button
        onClick={onFranceMode}
        className="flex items-center gap-1.5 h-9 px-3 rounded-full text-[11px] font-semibold transition-all shrink-0 active:scale-95"
        style={{
          background: mode === 'france' ? 'hsl(210 85% 52%)' : secondaryBg,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: mode === 'france' ? 'none' : secondaryBorder,
          color: mode === 'france' ? 'white' : secondaryColor,
          boxShadow: mode === 'france'
            ? '0 0 18px hsl(210 85% 52% / 0.45), 0 4px 12px hsl(210 85% 52% / 0.25)'
            : secondaryShadow,
        }}
      >
        <Globe size={11} />
        <span>France</span>
      </button>

      {/* City dropdown trigger — PRIMARY (visually dominant) */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1.5 h-10 px-4 rounded-full text-xs font-bold transition-all shrink-0 active:scale-95"
          style={{
            background: mode === 'city'
              ? 'linear-gradient(135deg, hsl(325 95% 54%), hsl(285 80% 58%))'
              : isLight
                ? 'linear-gradient(135deg, hsl(325 95% 54% / 0.12), hsl(285 80% 58% / 0.12))'
                : 'rgba(26, 13, 21, 0.85)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: mode === 'city'
              ? 'none'
              : isLight
                ? '1.5px solid hsl(325 95% 54% / 0.35)'
                : '1.5px solid hsl(325 89% 50% / 0.25)',
            color: mode === 'city' ? 'white' : isLight ? 'hsl(325 95% 40%)' : 'hsl(325 89% 70%)',
            boxShadow: mode === 'city'
              ? '0 0 24px hsl(325 95% 54% / 0.55), 0 6px 20px hsl(285 80% 58% / 0.35)'
              : isLight
                ? '0 4px 14px hsl(325 95% 54% / 0.18), 0 1px 3px hsl(280 30% 20% / 0.06)'
                : '0 2px 10px rgba(0,0,0,0.35)',
          }}
        >
          <MapPin size={12} strokeWidth={2.5} />
          <span>{mode === 'city' && selectedCity ? selectedCity : 'Choisir une ville'}</span>
          <ChevronDown size={11} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        {showDropdown && (
          <div
            className="absolute top-full left-0 mt-2 w-60 rounded-2xl overflow-hidden"
            style={{
              zIndex: 9999,
              background: isLight ? 'hsl(0 0% 99%)' : 'hsl(230 55% 8%)',
              border: isLight ? '1px solid hsl(230 15% 85%)' : '1px solid hsl(325 89% 50% / 0.15)',
              boxShadow: isLight ? '0 12px 40px rgba(0,0,0,0.12)' : '0 12px 40px hsl(230 60% 4% / 0.9)',
            }}
          >
            {/* Search */}
            <div className="p-2.5">
              <div
                className="flex items-center gap-2 h-9 px-3 rounded-xl"
                style={{
                  background: isLight ? 'hsl(230 15% 94%)' : 'hsl(230 40% 12%)',
                  border: isLight ? '1px solid hsl(230 15% 88%)' : '1px solid hsl(230 25% 20%)',
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
                  style={{ color: isLight ? 'hsl(230 20% 25%)' : 'hsl(220 20% 90%)' }}
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
                      color: selectedCity === city.name ? 'hsl(275 71% 70%)' : isLight ? 'hsl(230 20% 30%)' : 'hsl(225 15% 75%)',
                      background: selectedCity === city.name ? 'hsl(275 71% 58% / 0.12)' : 'transparent',
                    }}
                    onMouseEnter={e => {
                      if (selectedCity !== city.name) e.currentTarget.style.background = isLight ? 'hsl(230 15% 94%)' : 'hsl(230 40% 14%)';
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
