import { useState } from 'react';
import { Search, MapPin, Clock, X } from 'lucide-react';
import { mockEvents, NightEvent, vibeConfig, typeConfig, formatTime, formatDate } from '@/data/mockEvents';

interface SearchScreenProps {
  onEventSelect: (event: NightEvent) => void;
}

export function SearchScreen({ onEventSelect }: SearchScreenProps) {
  const [query, setQuery] = useState('');

  const results = query.trim().length > 1
    ? mockEvents.filter(e =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.city.toLowerCase().includes(query.toLowerCase()) ||
        e.venue.toLowerCase().includes(query.toLowerCase()) ||
        e.genres.some(g => g.includes(query.toLowerCase())) ||
        e.type.includes(query.toLowerCase())
      )
    : mockEvents;

  return (
    <div className="absolute inset-0 z-[300] flex flex-col" style={{ background: 'hsl(var(--surface-1))' }}>
      {/* Header */}
      <div className="pt-safe pt-4 px-4 pb-3" style={{ borderBottom: '1px solid hsl(258 40% 15%)' }}>
        <h1 className="text-lg font-black mb-3 tracking-tight">
          <span className="text-neon-cyan">Rechercher</span> une soirée
        </h1>
        <div
          className="flex items-center gap-3 h-11 px-3 rounded-xl border"
          style={{ background: 'hsl(258 45% 13%)', borderColor: 'hsl(258 40% 20%)' }}
        >
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Nom, ville, genre, lieu..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden pb-16">
        <div className="px-4 py-2">
          <p className="text-xs text-muted-foreground mb-3">
            {results.length} événement{results.length !== 1 ? 's' : ''} {query ? 'trouvé' + (results.length !== 1 ? 's' : '') : 'ce soir'}
          </p>

          <div className="space-y-2">
            {results.map(event => {
              const vibe = vibeConfig[event.vibe];
              const type = typeConfig[event.type];
              return (
                <button
                  key={event.id}
                  onClick={() => onEventSelect(event)}
                  className="w-full text-left rounded-xl border overflow-hidden transition-all active:scale-[0.98]"
                  style={{
                    background: 'hsl(258 55% 11%)',
                    borderColor: 'hsl(258 40% 18%)',
                  }}
                >
                  {/* Color accent left bar */}
                  <div className="flex">
                    <div className="w-1 shrink-0" style={{ background: vibe.color }} />
                    <div className="flex-1 p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-semibold" style={{ color: vibe.color }}>
                              {vibe.emoji} {vibe.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{type.emoji} {type.label}</span>
                            {event.isLive && (
                              <span className="text-[10px] font-bold text-neon-pink">● LIVE</span>
                            )}
                          </div>
                          <h3 className="text-sm font-black tracking-tight">{event.name}</h3>
                        </div>
                        <span
                          className="text-xs font-bold shrink-0 mt-0.5"
                          style={{
                            color: event.priceRange === 'gratuit' ? 'hsl(183 100% 50%)' :
                              event.priceRange === '€1-10' ? '#4ade80' :
                              event.priceRange === '€10-20' ? '#facc15' : 'hsl(315 100% 53%)',
                          }}
                        >
                          {event.priceRange}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin size={10} className="text-neon-pink" />
                          {event.venue}, {event.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} className="text-neon-cyan" />
                          {formatDate(event.startTime)} · {formatTime(event.startTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
