import { useState, useRef, useEffect } from 'react';
import { Sliders, Music, Zap } from 'lucide-react';

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

const genreOptions: GenreFilter[] = ['electro', 'techno', 'house', 'pop', 'rock', 'indie', 'r&b', 'jazz'];
const vibeOptions: { key: VibeFilter; label: string; emoji: string }[] = [
  { key: 'rave', label: 'Rave', emoji: '⚡' },
  { key: 'chill', label: 'Chill', emoji: '🌊' },
  { key: 'afterwork', label: 'Afterwork', emoji: '🥂' },
  { key: 'cosy', label: 'Cosy', emoji: '🕯️' },
  { key: 'concert', label: 'Concert', emoji: '🎸' },
];

const dateChips: { key: DateFilter; label: string }[] = [
  { key: 'today', label: 'Ce soir' },
  { key: 'weekend', label: 'Week-end' },
  { key: 'week', label: 'Semaine' },
  { key: 'all', label: 'Tout' },
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
    <div className="absolute top-32 left-0 right-0 bottom-0 z-[600] pointer-events-none" ref={panelRef}>
      {/* Hidden toggle button triggered from parent */}
      <button
        data-filter-toggle
        onClick={() => setShowPanel(!showPanel)}
        className="hidden"
      />

      {/* Expanded filter panel */}
      {showPanel && (
        <div className="absolute inset-x-3 top-0 pointer-events-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <div
            className="rounded-2xl border overflow-hidden flex flex-col"
            style={{
              background: 'rgba(26, 13, 21, 0.95)',
              borderColor: 'hsl(325 89% 50% / 0.15)',
              backdropFilter: 'blur(20px)',
              animation: 'fade-in 0.2s ease-out',
              boxShadow: '0 12px 40px hsl(230 60% 4% / 0.8)',
              maxHeight: 'calc(100vh - 200px)',
            }}
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
              <span className="text-sm font-bold" style={{ color: 'hsl(225 15% 80%)' }}>Filtres</span>
              <button
                onClick={() => setShowPanel(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ background: 'hsl(0 0% 100% / 0.08)', color: 'hsl(225 15% 70%)' }}
              >
                ✕
              </button>
            </div>

            <div className="p-4 pt-0 space-y-4 overflow-y-auto scrollbar-hidden">
              {/* Date chips */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Quand</span>
                <div className="flex gap-2 flex-wrap">
                  {dateChips.map(d => (
                    <button
                      key={d.key}
                      onClick={() => onChange({ ...filters, date: filters.date === d.key ? 'all' : d.key })}
                      className="h-9 px-3 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: filters.date === d.key ? 'hsl(325 89% 50%)' : 'hsl(0 0% 100% / 0.08)',
                        color: filters.date === d.key ? 'white' : 'hsl(225 15% 70%)',
                        boxShadow: filters.date === d.key ? '0 0 16px hsl(325 89% 50% / 0.3)' : 'none',
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Radius */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rayon</span>
                  <span className="text-xs font-bold" style={{ color: 'hsl(325 89% 50%)' }}>{filters.radiusKm} km</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={filters.radiusKm}
                  onChange={e => onChange({ ...filters, radiusKm: Number(e.target.value) })}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, hsl(325 89% 50%) 0%, hsl(325 89% 50%) ${(filters.radiusKm - 1) / 49 * 100}%, hsl(0 0% 100% / 0.1) ${(filters.radiusKm - 1) / 49 * 100}%, hsl(0 0% 100% / 0.1) 100%)`,
                  }}
                />
              </div>

              {/* Price */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Prix</span>
                <div className="flex gap-2">
                  {(['all', 'free', 'paid'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => onChange({ ...filters, price: p })}
                      className="flex-1 h-9 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: filters.price === p ? 'hsl(325 89% 50% / 0.2)' : 'hsl(0 0% 100% / 0.06)',
                        color: filters.price === p ? 'hsl(325 89% 55%)' : 'hsl(225 15% 60%)',
                        border: filters.price === p ? '1px solid hsl(325 89% 50% / 0.5)' : '1px solid transparent',
                      }}
                    >
                      {p === 'all' ? 'Tous' : p === 'free' ? 'Gratuit' : 'Payant'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genres */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Genres</span>
                <div className="flex flex-wrap gap-1.5">
                  {genreOptions.map(g => (
                    <button
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className="h-8 px-3 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: filters.genres.includes(g) ? 'hsl(325 89% 50%)' : 'hsl(0 0% 100% / 0.08)',
                        color: filters.genres.includes(g) ? 'white' : 'hsl(225 15% 65%)',
                        boxShadow: filters.genres.includes(g) ? '0 0 12px hsl(325 89% 50% / 0.3)' : 'none',
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vibes */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Ambiance</span>
                <div className="flex flex-wrap gap-1.5">
                  {vibeOptions.map(v => (
                    <button
                      key={v.key}
                      onClick={() => toggleVibe(v.key)}
                      className="h-8 px-3 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: filters.vibes.includes(v.key) ? 'hsl(325 89% 50%)' : 'hsl(0 0% 100% / 0.08)',
                        color: filters.vibes.includes(v.key) ? 'white' : 'hsl(225 15% 65%)',
                        boxShadow: filters.vibes.includes(v.key) ? '0 0 12px hsl(325 89% 50% / 0.3)' : 'none',
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
                  className="w-full h-9 rounded-full text-xs font-semibold transition-colors"
                  style={{ background: 'hsl(0 0% 100% / 0.06)', color: 'hsl(225 15% 55%)' }}
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
