import { useState, useRef, useEffect } from 'react';
import { Sliders, Calendar, Music, Zap, ChevronDown } from 'lucide-react';

type DateFilter = 'today' | 'weekend' | 'week' | 'all';
type PriceFilter = 'all' | 'free' | 'paid';
type GenreFilter = 'electro' | 'techno' | 'house' | 'pop' | 'rock' | 'indie' | 'r&b' | 'jazz';
type VibeFilter = 'chill' | 'rave' | 'afterwork' | 'cosy' | 'concert';

export interface Filters {
  date: DateFilter;
  price: PriceFilter;
  genres: GenreFilter[];
  vibes: VibeFilter[];
  radiusKm: number;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const dateLabels: Record<DateFilter, string> = {
  today: 'Aujourd\'hui',
  weekend: 'Ce week-end',
  week: 'Cette semaine',
  all: 'Tout',
};

const genreOptions: GenreFilter[] = ['electro', 'techno', 'house', 'pop', 'rock', 'indie', 'r&b', 'jazz'];
const vibeOptions: { key: VibeFilter; label: string; emoji: string }[] = [
  { key: 'rave', label: 'Rave', emoji: '⚡' },
  { key: 'chill', label: 'Chill', emoji: '🌊' },
  { key: 'afterwork', label: 'Afterwork', emoji: '🥂' },
  { key: 'cosy', label: 'Cosy', emoji: '🕯️' },
  { key: 'concert', label: 'Concert', emoji: '🎸' },
];

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    }
    if (showPanel) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [showPanel]);

  const activeCount = (filters.genres.length > 0 ? 1 : 0)
    + (filters.vibes.length > 0 ? 1 : 0)
    + (filters.price !== 'all' ? 1 : 0)
    + (filters.date !== 'all' ? 1 : 0);

  function toggleGenre(g: GenreFilter) {
    const next = filters.genres.includes(g)
      ? filters.genres.filter(x => x !== g)
      : [...filters.genres, g];
    onChange({ ...filters, genres: next });
  }

  function toggleVibe(v: VibeFilter) {
    const next = filters.vibes.includes(v)
      ? filters.vibes.filter(x => x !== v)
      : [...filters.vibes, v];
    onChange({ ...filters, vibes: next });
  }

  return (
    <div className="absolute top-14 left-3 right-3 z-[400]" ref={panelRef}>
      {/* Main filter row */}
      <div className="flex items-center gap-2">
        {/* Date pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hidden flex-1">
          {(Object.keys(dateLabels) as DateFilter[]).map(d => (
            <button
              key={d}
              onClick={() => onChange({ ...filters, date: filters.date === d ? 'all' : d })}
              className="shrink-0 h-8 px-3 rounded-full text-xs font-semibold border transition-all"
              style={{
                background: filters.date === d
                  ? 'hsl(183 100% 50%)'
                  : 'hsl(258 55% 11% / 0.92)',
                color: filters.date === d ? 'hsl(258 60% 8%)' : 'hsl(240 20% 80%)',
                borderColor: filters.date === d ? 'hsl(183 100% 50%)' : 'hsl(258 40% 20%)',
                backdropFilter: 'blur(12px)',
                boxShadow: filters.date === d ? '0 0 12px hsl(183 100% 50% / 0.4)' : 'none',
              }}
            >
              {d === 'today' ? 'Soir' : d === 'weekend' ? 'Week-end' : d === 'week' ? 'Semaine' : 'Tout'}
            </button>
          ))}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center border transition-all relative"
          style={{
            background: showPanel || activeCount > 0 ? 'hsl(315 100% 53%)' : 'hsl(258 55% 11% / 0.92)',
            borderColor: showPanel || activeCount > 0 ? 'hsl(315 100% 53%)' : 'hsl(258 40% 20%)',
            color: showPanel || activeCount > 0 ? 'white' : 'hsl(240 20% 70%)',
            backdropFilter: 'blur(12px)',
            boxShadow: showPanel || activeCount > 0 ? '0 0 12px hsl(315 100% 53% / 0.5)' : 'none',
          }}
        >
          <Sliders size={14} />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon-cyan text-surface-1 text-[9px] font-black flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Expanded filter panel */}
      {showPanel && (
        <div
          className="mt-2 rounded-2xl border border-surface-4 overflow-hidden"
          style={{
            background: 'hsl(258 55% 10% / 0.97)',
            backdropFilter: 'blur(20px)',
            animation: 'fade-in 0.2s ease-out',
            boxShadow: '0 8px 32px hsl(258 60% 4% / 0.8)',
          }}
        >
          <div className="p-3 space-y-3">
            {/* Radius */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Sliders size={11} /> Rayon de recherche
                </span>
                <span className="text-xs font-bold text-neon-cyan">{filters.radiusKm} km</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={filters.radiusKm}
                onChange={e => onChange({ ...filters, radiusKm: Number(e.target.value) })}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(183 100% 50%) 0%, hsl(183 100% 50%) ${(filters.radiusKm - 1) / 49 * 100}%, hsl(258 40% 20%) ${(filters.radiusKm - 1) / 49 * 100}%, hsl(258 40% 20%) 100%)`,
                }}
              />
            </div>

            {/* Price */}
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-xs font-semibold text-muted-foreground">💶 Prix</span>
              </div>
              <div className="flex gap-1.5">
                {(['all', 'free', 'paid'] as PriceFilter[]).map(p => (
                  <button
                    key={p}
                    onClick={() => onChange({ ...filters, price: p })}
                    className="flex-1 h-7 rounded-lg text-xs font-semibold border transition-all"
                    style={{
                      background: filters.price === p ? 'hsl(315 100% 53% / 0.2)' : 'hsl(258 40% 14%)',
                      borderColor: filters.price === p ? 'hsl(315 100% 53%)' : 'hsl(258 40% 20%)',
                      color: filters.price === p ? 'hsl(315 100% 53%)' : 'hsl(240 20% 65%)',
                    }}
                  >
                    {p === 'all' ? 'Tous' : p === 'free' ? 'Gratuit' : 'Payant'}
                  </button>
                ))}
              </div>
            </div>

            {/* Genres */}
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <Music size={11} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Genres musicaux</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {genreOptions.map(g => (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className="h-6 px-2.5 rounded-full text-xs font-medium border transition-all"
                    style={{
                      background: filters.genres.includes(g) ? 'hsl(275 71% 58% / 0.2)' : 'hsl(258 40% 14%)',
                      borderColor: filters.genres.includes(g) ? 'hsl(275 71% 58%)' : 'hsl(258 40% 20%)',
                      color: filters.genres.includes(g) ? 'hsl(275 71% 58%)' : 'hsl(240 20% 60%)',
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Vibes */}
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <Zap size={11} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Ambiance</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {vibeOptions.map(v => (
                  <button
                    key={v.key}
                    onClick={() => toggleVibe(v.key)}
                    className="h-6 px-2.5 rounded-full text-xs font-medium border transition-all"
                    style={{
                      background: filters.vibes.includes(v.key) ? 'hsl(183 100% 50% / 0.15)' : 'hsl(258 40% 14%)',
                      borderColor: filters.vibes.includes(v.key) ? 'hsl(183 100% 50%)' : 'hsl(258 40% 20%)',
                      color: filters.vibes.includes(v.key) ? 'hsl(183 100% 50%)' : 'hsl(240 20% 60%)',
                    }}
                  >
                    {v.emoji} {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            {activeCount > 0 && (
              <button
                onClick={() => onChange({ date: 'all', price: 'all', genres: [], vibes: [], radiusKm: 10 })}
                className="w-full h-7 rounded-lg text-xs font-semibold text-muted-foreground border border-surface-4 hover:text-foreground transition-colors"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
