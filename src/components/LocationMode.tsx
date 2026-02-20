import { useState } from 'react';
import { MapPin, Navigation, Search, X } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredCities = searchQuery
    ? CITIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : CITIES;

  function handleSwitchToNearby() {
    onModeChange('nearby');
    setSearchQuery('');
    setShowSearch(false);
  }

  function handleCityClick(city: City) {
    onCitySelect(city);
    setSearchQuery('');
    setShowSearch(false);
  }

  return (
    <div className="flex items-center gap-1.5" style={{ width: 'max-content' }}>
      {/* Near me pill */}
      <button
        onClick={handleSwitchToNearby}
        className="flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold transition-all shrink-0"
        style={{
          background: mode === 'nearby'
            ? 'hsl(325 89% 50%)'
            : 'rgba(26, 13, 21, 0.8)',
          backdropFilter: 'blur(12px)',
          border: mode === 'nearby' ? 'none' : '1px solid hsl(325 89% 50% / 0.1)',
          color: mode === 'nearby' ? 'white' : 'hsl(225 15% 70%)',
          boxShadow: mode === 'nearby' ? '0 0 16px hsl(325 89% 50% / 0.3)' : '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <Navigation size={11} className={locating && mode === 'nearby' ? 'animate-spin' : ''} />
        <span>Près de moi</span>
      </button>

      {/* Search toggle */}
      <button
        onClick={() => setShowSearch(!showSearch)}
        className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 transition-all"
        style={{
          background: showSearch ? 'hsl(325 89% 50% / 0.2)' : 'rgba(26, 13, 21, 0.8)',
          backdropFilter: 'blur(12px)',
          border: showSearch ? '1px solid hsl(325 89% 50% / 0.4)' : '1px solid hsl(325 89% 50% / 0.1)',
          color: showSearch ? 'hsl(325 89% 55%)' : 'hsl(225 15% 70%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {showSearch ? <X size={12} /> : <Search size={12} />}
      </button>

      {/* Search input (inline) */}
      {showSearch && (
        <div
          className="flex items-center gap-1.5 h-9 px-3 rounded-full shrink-0"
          style={{
            background: 'rgba(26, 13, 21, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid hsl(325 89% 50% / 0.2)',
            minWidth: '140px',
          }}
        >
          <Search size={10} style={{ color: 'hsl(225 15% 50%)' }} />
          <input
            type="text"
            placeholder="Ville…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground w-20"
            style={{ color: 'hsl(220 20% 90%)' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X size={10} style={{ color: 'hsl(225 15% 50%)' }} />
            </button>
          )}
        </div>
      )}

      {/* Scrollable city pills */}
      {filteredCities.map(city => (
        <button
          key={city.name}
          onClick={() => handleCityClick(city)}
          className="flex items-center gap-1 h-9 px-3 rounded-full text-xs font-semibold transition-all shrink-0 whitespace-nowrap"
          style={{
            background: selectedCity === city.name
              ? 'hsl(275 71% 58%)'
              : 'rgba(26, 13, 21, 0.8)',
            backdropFilter: 'blur(12px)',
            border: selectedCity === city.name ? 'none' : '1px solid hsl(325 89% 50% / 0.1)',
            color: selectedCity === city.name ? 'white' : 'hsl(225 15% 70%)',
            boxShadow: selectedCity === city.name ? '0 0 16px hsl(275 71% 58% / 0.3)' : '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <MapPin size={10} />
          {city.name}
        </button>
      ))}
    </div>
  );
}
