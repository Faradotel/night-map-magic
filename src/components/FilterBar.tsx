import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useDistanceUnit, convertDistance } from '@/hooks/useDistanceUnit';

type DateFilter = 'today' | 'weekend' | 'week' | 'all';
type GenreFilter = 'electro' | 'techno' | 'house' | 'pop' | 'rock' | 'indie' | 'r&b' | 'jazz';
type VibeFilter = 'chill' | 'rave' | 'afterwork' | 'cosy' | 'concert' | 'culture' | 'sport' | 'party' | 'nightlife' | 'dance' | 'family' | 'energy';
export type SourceFilter = 'concert' | 'brocante' | 'sport' | 'agenda' | 'festival' | 'meetup';

// Category maps to vibes + sources for filtering
type CategoryKey = 'nightlife' | 'party' | 'concert' | 'festival' | 'chill' | 'afterwork' | 'sport' | 'culture' | 'famille';
type AdvancedGenre = 'electronic' | 'pop' | 'rock' | 'other';

export interface Filters {
  date: DateFilter;
  price: PriceFilter;
  genres: GenreFilter[];
  vibes: VibeFilter[];
  sources: SourceFilter[];
  radiusKm: number;
}

export const SOURCE_OPTIONS: { key: SourceFilter; label: string; emoji: string; prefixes: string[] }[] = [
  { key: 'concert', label: 'Concert', emoji: '🎵', prefixes: ['ic-', 'tm-', 'eb-', 'shotgun-'] },
  { key: 'festival', label: 'Festival', emoji: '🎪', prefixes: ['rdf-'] },
  { key: 'brocante', label: 'Brocante', emoji: '🧺', prefixes: ['bb-'] },
  { key: 'sport', label: 'Sport', emoji: '🏃‍♂️', prefixes: ['rt-'] },
  { key: 'agenda', label: 'Agenda', emoji: '🗓️', prefixes: ['oa-'] },
  { key: 'meetup', label: 'Meetup', emoji: '👥', prefixes: ['mu-'] },
];

interface FilterBarProps {
  filters: Filters;
  onChange: (f: Filters) => void;
  isNearbyMode?: boolean;
}

// Category chips (ordre = priorité d'affichage attendue pour l'user "sortir")
const categoryOptions: { key: CategoryKey; label: string; emoji: string }[] = [
  { key: 'nightlife', label: 'Nightlife', emoji: '🌙' },
  { key: 'party', label: 'Soirée', emoji: '🎉' },
  { key: 'concert', label: 'Concert', emoji: '🎸' },
  { key: 'festival', label: 'Festival', emoji: '🎪' },
  { key: 'chill', label: 'Chill', emoji: '🍹' },
  { key: 'afterwork', label: 'Afterwork', emoji: '🥂' },
  { key: 'culture', label: 'Culture', emoji: '🎭' },
  { key: 'sport', label: 'Sport', emoji: '⚽' },
  { key: 'famille', label: 'Famille', emoji: '👨‍👩‍👧' },
];

// Map categories to vibes and sources
const categoryToVibes: Record<CategoryKey, VibeFilter[]> = {
  nightlife: ['nightlife', 'rave', 'dance'],
  party: ['party', 'rave', 'cosy'],
  concert: ['concert', 'energy'],
  festival: [],
  chill: ['chill'],
  afterwork: ['afterwork'],
  sport: ['sport'],
  culture: ['culture'],
  famille: ['family'],
};
const categoryToSources: Record<CategoryKey, SourceFilter[]> = {
  nightlife: [],
  party: [],
  concert: ['concert'],
  festival: ['festival'],
  chill: [],
  afterwork: [],
  sport: ['sport'],
  culture: ['agenda'],
  famille: [],
};


// Advanced genre mapping
const advancedGenreMap: Record<AdvancedGenre, GenreFilter[]> = {
  electronic: ['electro', 'techno', 'house'],
  pop: ['pop'],
  rock: ['rock', 'indie'],
  other: ['r&b', 'jazz'],
};

const advancedGenreOptions: { key: AdvancedGenre; label: string }[] = [
  { key: 'electronic', label: 'Électronique' },
  { key: 'pop', label: 'Pop' },
  { key: 'rock', label: 'Rock' },
  { key: 'other', label: 'Autre' },
];

const dateChips: { key: DateFilter; label: string }[] = [
  { key: 'today', label: 'Ce soir' },
  { key: 'weekend', label: 'Week-end' },
  { key: 'week', label: 'Semaine' },
  { key: 'all', label: 'Tout' },
];

function getActiveCategories(filters: Filters): CategoryKey[] {
  const active: CategoryKey[] = [];
  for (const cat of categoryOptions) {
    const vibes = categoryToVibes[cat.key];
    const sources = categoryToSources[cat.key];
    const vibeMatch = vibes.length > 0 && vibes.every(v => filters.vibes.includes(v));
    const sourceMatch = sources.length > 0 && sources.every(s => filters.sources.includes(s));
    if (vibeMatch || sourceMatch) active.push(cat.key);
  }
  return active;
}

function getActiveAdvancedGenres(filters: Filters): AdvancedGenre[] {
  const active: AdvancedGenre[] = [];
  for (const ag of advancedGenreOptions) {
    const mapped = advancedGenreMap[ag.key];
    if (mapped.every(g => filters.genres.includes(g))) active.push(ag.key);
  }
  return active;
}

export function FilterBar({ filters, onChange, isNearbyMode = false }: FilterBarProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { unit, cycleUnit, unitLabel } = useDistanceUnit();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    }
    if (showPanel) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [showPanel]);

  const activeCategories = getActiveCategories(filters);
  const activeAdvancedGenres = getActiveAdvancedGenres(filters);

  const activeCount =
    (filters.date !== 'all' ? 1 : 0) +
    (filters.price !== 'all' ? 1 : 0) +
    (activeCategories.length > 0 ? 1 : 0) +
    (filters.genres.length > 0 ? 1 : 0);

  function toggleCategory(cat: CategoryKey) {
    const isActive = activeCategories.includes(cat);
    let newVibes = [...filters.vibes];
    let newSources = [...filters.sources];
    const vibes = categoryToVibes[cat];
    const sources = categoryToSources[cat];

    if (isActive) {
      newVibes = newVibes.filter(v => !vibes.includes(v));
      newSources = newSources.filter(s => !sources.includes(s));
    } else {
      for (const v of vibes) if (!newVibes.includes(v)) newVibes.push(v);
      for (const s of sources) if (!newSources.includes(s)) newSources.push(s);
    }
    onChange({ ...filters, vibes: newVibes, sources: newSources });
  }

  function toggleAdvancedGenre(ag: AdvancedGenre) {
    const mapped = advancedGenreMap[ag];
    const isActive = activeAdvancedGenres.includes(ag);
    let newGenres = [...filters.genres];
    if (isActive) {
      newGenres = newGenres.filter(g => !mapped.includes(g));
    } else {
      for (const g of mapped) if (!newGenres.includes(g)) newGenres.push(g);
    }
    onChange({ ...filters, genres: newGenres });
  }

  const chipStyle = (active: boolean) => ({
    background: active ? 'hsl(325 89% 50%)' : isLight ? 'hsl(0 0% 0% / 0.06)' : 'hsl(0 0% 100% / 0.08)',
    color: active ? 'white' : isLight ? 'hsl(230 25% 15%)' : 'hsl(225 15% 70%)',
    boxShadow: active ? '0 0 16px hsl(325 89% 50% / 0.3)' : 'none',
  });

  return (
    <div className="absolute top-32 left-0 right-0 bottom-0 z-[600] pointer-events-none" ref={panelRef}>
      <button data-filter-toggle onClick={() => setShowPanel(!showPanel)} className="hidden" />

      {showPanel && (
        <div className="absolute inset-x-3 top-0 pointer-events-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <div
            className="rounded-2xl border overflow-hidden flex flex-col"
            style={{
              background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(26, 13, 21, 0.95)',
              borderColor: isLight ? 'hsl(325 89% 50% / 0.12)' : 'hsl(325 89% 50% / 0.15)',
              backdropFilter: 'blur(20px)',
              animation: 'fade-in 0.2s ease-out',
              boxShadow: isLight ? '0 12px 40px rgba(0,0,0,0.1)' : '0 12px 40px hsl(230 60% 4% / 0.8)',
              maxHeight: 'calc(100vh - 200px)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
              <span className="text-sm font-bold" style={{ color: isLight ? 'hsl(230 25% 15%)' : 'hsl(225 15% 80%)' }}>Filtres</span>
              <button
                onClick={() => setShowPanel(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ background: isLight ? 'hsl(0 0% 0% / 0.06)' : 'hsl(0 0% 100% / 0.08)', color: isLight ? 'hsl(230 25% 25%)' : 'hsl(225 15% 70%)' }}
              >
                ✕
              </button>
            </div>

            <div className="p-3 pt-0 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
              {/* When */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Quand</span>
                <div className="flex gap-1.5 flex-wrap">
                  {dateChips.map(d => (
                    <button
                      key={d.key}
                      onClick={() => onChange({ ...filters, date: filters.date === d.key ? 'all' : d.key })}
                      className="h-7 px-2.5 rounded-full text-[11px] font-semibold transition-all"
                      style={chipStyle(filters.date === d.key)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Radius - only when nearby mode */}
              {isNearbyMode && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rayon</span>
                    <button
                      onClick={cycleUnit}
                      className="text-[11px] font-bold px-1.5 py-0.5 rounded-md transition-colors"
                      style={{ color: 'hsl(325 89% 50%)', background: 'hsl(325 89% 50% / 0.1)' }}
                    >
                      {unit === 'meters'
                        ? `${Math.round(convertDistance(filters.radiusKm, unit))} ${unitLabel}`
                        : `${convertDistance(filters.radiusKm, unit).toFixed(1)} ${unitLabel}`}
                    </button>
                  </div>
                  <input
                    type="range" min={1} max={50} value={filters.radiusKm}
                    onChange={e => onChange({ ...filters, radiusKm: Number(e.target.value) })}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, hsl(325 89% 50%) 0%, hsl(325 89% 50%) ${(filters.radiusKm - 1) / 49 * 100}%, hsl(0 0% 100% / 0.1) ${(filters.radiusKm - 1) / 49 * 100}%, hsl(0 0% 100% / 0.1) 100%)`,
                    }}
                  />
                </div>
              )}

              {/* Price */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Prix</span>
                <div className="flex gap-1.5">
                  {(['all', 'free', 'paid'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => onChange({ ...filters, price: p })}
                      className="flex-1 h-7 rounded-full text-[11px] font-semibold transition-all"
                      style={{
                        background: filters.price === p ? 'hsl(325 89% 50% / 0.2)' : isLight ? 'hsl(0 0% 0% / 0.04)' : 'hsl(0 0% 100% / 0.06)',
                        color: filters.price === p ? 'hsl(325 89% 55%)' : isLight ? 'hsl(230 25% 15%)' : 'hsl(225 15% 60%)',
                        border: filters.price === p ? '1px solid hsl(325 89% 50% / 0.5)' : isLight ? '1px solid hsl(0 0% 0% / 0.08)' : '1px solid transparent',
                      }}
                    >
                      {p === 'all' ? 'Tous' : p === 'free' ? 'Gratuit' : 'Payant'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Catégorie</span>
                <div className="flex flex-wrap gap-1.5">
                  {categoryOptions.map(cat => {
                    const active = activeCategories.includes(cat.key);
                    return (
                      <button
                        key={cat.key}
                        onClick={() => toggleCategory(cat.key)}
                        className="h-7 px-2.5 rounded-full text-[11px] font-semibold transition-all"
                        style={chipStyle(active)}
                      >
                        {cat.emoji} {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced filters (collapsible) */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 w-full text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-1"
                >
                  <span>Filtres avancés</span>
                  <ChevronDown
                    className="w-3.5 h-3.5 transition-transform duration-200"
                    style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                  {filters.genres.length > 0 && (
                    <span
                      className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'hsl(325 89% 50% / 0.2)', color: 'hsl(325 89% 55%)' }}
                    >
                      {filters.genres.length}
                    </span>
                  )}
                </button>
                {showAdvanced && (
                  <div className="pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Genres musicaux</span>
                    <div className="flex flex-wrap gap-1.5">
                      {advancedGenreOptions.map(ag => {
                        const active = activeAdvancedGenres.includes(ag.key);
                        return (
                          <button
                            key={ag.key}
                            onClick={() => toggleAdvancedGenre(ag.key)}
                            className="h-7 px-2.5 rounded-full text-[11px] font-semibold transition-all"
                            style={chipStyle(active)}
                          >
                            {ag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Reset */}
              {activeCount > 0 && (
                <button
                  onClick={() => onChange({ date: 'all', price: 'all', genres: [], vibes: [], sources: [], radiusKm: 10 })}
                  className="w-full h-7 rounded-full text-[11px] font-semibold transition-colors"
                  style={{ background: isLight ? 'hsl(0 0% 0% / 0.04)' : 'hsl(0 0% 100% / 0.06)', color: isLight ? 'hsl(230 25% 25%)' : 'hsl(225 15% 55%)' }}
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
