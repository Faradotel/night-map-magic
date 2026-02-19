import { X, MapPin, Clock, Ticket, ExternalLink, Check } from 'lucide-react';
import { NightEvent, vibeConfig, typeConfig, formatTime, formatDate } from '@/data/mockEvents';
import { useEffect, useState } from 'react';

interface EventDetailSheetProps {
  event: NightEvent | null;
  onClose: () => void;
}

export function EventDetailSheet({ event, onClose }: EventDetailSheetProps) {
  const [checkedIn, setCheckedIn] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (event) {
      setCheckedIn(false);
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
    }
  }, [event]);

  if (!event) return null;

  const vibe = vibeConfig[event.vibe];
  const type = typeConfig[event.type];

  const priceColor =
    event.priceRange === 'gratuit' ? 'text-neon-cyan' :
    event.priceRange === '€1-10' ? 'text-green-400' :
    event.priceRange === '€10-20' ? 'text-yellow-400' : 'text-neon-pink';

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 pointer-events-auto"
        style={{
          background: 'linear-gradient(to top, hsl(258 60% 4% / 0.7) 0%, transparent 40%)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="absolute bottom-[64px] left-0 right-0 pointer-events-auto"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(105%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-surface-4 opacity-60" />
        </div>

        <div
          className="mx-2 mb-2 rounded-2xl overflow-hidden border border-surface-4"
          style={{ background: 'hsl(258 55% 9%)', boxShadow: '0 -8px 40px hsl(258 60% 4% / 0.8)' }}
        >
          {/* Color bar top */}
          <div
            className="h-1 w-full"
            style={{ background: `linear-gradient(90deg, ${vibe.color}, hsl(315 100% 53%))` }}
          />

          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full border" style={{
                    borderColor: vibe.color + '44',
                    color: vibe.color,
                    background: vibe.color + '11',
                  }}>
                    {vibe.emoji} {vibe.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{type.emoji} {type.label}</span>
                  {event.isLive && (
                    <span className="text-xs font-bold text-neon-pink flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-neon-pink inline-block" style={{ animation: 'neon-pulse 1s infinite' }} />
                      LIVE
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black tracking-tight leading-tight text-foreground truncate">
                  {event.name}
                </h2>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-3 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Info row */}
            <div className="flex flex-wrap gap-3 mb-3 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock size={13} className="text-neon-cyan shrink-0" />
                <span>{formatDate(event.startTime)}, {formatTime(event.startTime)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin size={13} className="text-neon-pink shrink-0" />
                <span className="truncate max-w-[160px]">{event.venue}, {event.city}</span>
              </div>
              <span className={`font-bold text-sm ${priceColor}`}>{event.priceRange}</span>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {event.description}
            </p>

            {/* Music tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {event.genres.map(g => (
                <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-surface-3 text-muted-foreground border border-surface-4">
                  #{g}
                </span>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setCheckedIn(!checkedIn)}
                className="flex-1 h-10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: checkedIn
                    ? 'hsl(183 100% 50% / 0.15)'
                    : 'linear-gradient(135deg, hsl(183 100% 40%), hsl(195 100% 35%))',
                  color: checkedIn ? 'hsl(183 100% 50%)' : 'hsl(258 60% 8%)',
                  border: checkedIn ? '1.5px solid hsl(183 100% 50% / 0.5)' : 'none',
                  boxShadow: checkedIn ? 'none' : '0 0 16px hsl(183 100% 50% / 0.3)',
                }}
              >
                {checkedIn ? (
                  <><Check size={16} /> J'y suis allé !</>
                ) : (
                  <>✓ J'y vais</>
                )}
              </button>

              {event.ticketUrl && (
                <button
                  onClick={() => window.open(event.ticketUrl, '_blank')}
                  className="h-10 px-4 rounded-xl font-bold text-sm flex items-center gap-1.5 border border-surface-4 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                >
                  <Ticket size={14} />
                  Billets
                </button>
              )}

              <button
                onClick={() => window.open(`https://maps.google.com/?q=${event.address},${event.city}`, '_blank')}
                className="h-10 px-4 rounded-xl font-bold text-sm flex items-center gap-1.5 border border-surface-4 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
              >
                <ExternalLink size={14} />
                Maps
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
