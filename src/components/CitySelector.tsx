import { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';

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

interface CitySelectorProps {
  selectedCity: string | null;
  onCitySelect: (city: City) => void;
}

export function CitySelector({ selectedCity, onCitySelect }: CitySelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-semibold border transition-all pointer-events-auto"
        style={{
          background: 'hsl(258 55% 11% / 0.92)',
          borderColor: selectedCity ? 'hsl(183 100% 50%)' : 'hsl(258 40% 20%)',
          color: selectedCity ? 'hsl(183 100% 60%)' : 'hsl(240 20% 80%)',
          backdropFilter: 'blur(12px)',
          boxShadow: selectedCity ? '0 0 10px hsl(183 100% 50% / 0.3)' : 'none',
        }}
      >
        <MapPin size={11} />
        <span>{selectedCity || 'Ville'}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 w-44 rounded-xl border border-surface-4 overflow-hidden z-[500]"
          style={{
            background: 'hsl(258 55% 10% / 0.97)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px hsl(258 60% 4% / 0.8)',
          }}
        >
          <div className="py-1 max-h-60 overflow-y-auto">
            {CITIES.map(city => (
              <button
                key={city.name}
                onClick={() => { onCitySelect(city); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs font-medium transition-colors"
                style={{
                  color: selectedCity === city.name ? 'hsl(183 100% 50%)' : 'hsl(240 20% 75%)',
                  background: selectedCity === city.name ? 'hsl(183 100% 50% / 0.1)' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (selectedCity !== city.name) (e.target as HTMLElement).style.background = 'hsl(258 40% 18%)';
                }}
                onMouseLeave={e => {
                  if (selectedCity !== city.name) (e.target as HTMLElement).style.background = 'transparent';
                }}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
