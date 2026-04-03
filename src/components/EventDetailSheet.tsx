import { X, MapPin, Clock, Ticket, ExternalLink, Check } from 'lucide-react';
import { NightEvent, vibeConfig, typeConfig, formatTime, formatDate } from '@/data/mockEvents';
import { getSourceEmoji } from '@/lib/sourceEmoji';
import { useEffect, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface EventDetailSheetProps {
  event: NightEvent | null;
  onClose: () => void;
}

export function EventDetailSheet({ event, onClose }: EventDetailSheetProps) {
  const [checkedIn, setCheckedIn] = useState(false);
  const [visible, setVisible] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === 'light';

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
  const isBrocabrac = event.id.startsWith('bb-');
  const isRunTrail = event.id.startsWith('rt-');
  const isOpenAgenda = event.id.startsWith('oa-');

  const priceColor =
    event.priceRange === 'gratuit' ? 'hsl(130 60% 55%)' :
    event.priceRange === '€1-10' ? 'hsl(130 60% 55%)' :
    event.priceRange === '€10-20' ? 'hsl(45 100% 55%)' : 'hsl(325 89% 50%)';

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 pointer-events-auto"
        style={{
          background: 'linear-gradient(to top, hsl(230 60% 4% / 0.7) 0%, transparent 40%)',
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
          <div className="w-10 h-1 rounded-full opacity-40" style={{ background: 'hsl(230 20% 40%)' }} />
        </div>

        <div
          className="mx-2 mb-2 rounded-2xl overflow-hidden border"
          style={{
            background: isLight ? 'hsl(0 0% 98%)' : 'hsl(230 50% 8%)',
            borderColor: isLight ? 'hsl(230 15% 85%)' : 'hsl(230 25% 16%)',
            boxShadow: isLight ? '0 -8px 40px rgba(0,0,0,0.08)' : '0 -8px 40px hsl(230 60% 4% / 0.8)',
          }}
        >
          {/* Color bar top */}
          <div
            className="h-1 w-full"
            style={{ background: `linear-gradient(90deg, hsl(325 89% 50%), hsl(275 71% 58%))` }}
          />

          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full border" style={{
                    borderColor: 'hsl(325 89% 50% / 0.3)',
                    color: 'hsl(325 89% 55%)',
                    background: 'hsl(325 89% 50% / 0.1)',
                  }}>
                    {vibe.emoji} {vibe.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{getSourceEmoji(event.id, type.emoji)} {type.label}</span>
                  {event.isLive && (
                    <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'hsl(325 89% 50%)' }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'hsl(325 89% 50%)', animation: 'neon-pulse 1s infinite' }} />
                      LIVE
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-extrabold tracking-tight leading-tight text-foreground truncate">
                  {isBrocabrac ? '🧺 ' : isRunTrail ? '🏃‍♂️ ' : isOpenAgenda ? '🗓️ ' : ''}{event.name}
                </h2>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                style={{ background: isLight ? 'hsl(230 15% 92%)' : 'hsl(230 35% 14%)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Info row */}
            <div className="flex flex-wrap gap-3 mb-3 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock size={13} style={{ color: 'hsl(225 15% 55%)' }} />
                <span>{formatDate(event.startTime)}, {formatTime(event.startTime)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin size={13} style={{ color: 'hsl(325 89% 50%)' }} />
                <span className="truncate max-w-[160px]">{event.venue}, {event.city}</span>
              </div>
              <span className="font-bold text-sm" style={{ color: priceColor }}>{event.priceRange}</span>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {event.description}
            </p>

            {/* Music tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {event.genres.map(g => (
                <span
                  key={g}
                  className="text-xs px-2 py-0.5 rounded-full border"
                  style={{
                    background: isLight ? 'hsl(230 15% 92%)' : 'hsl(230 35% 14%)',
                    borderColor: isLight ? 'hsl(230 15% 85%)' : 'hsl(230 25% 20%)',
                    color: isLight ? 'hsl(225 15% 40%)' : 'hsl(225 15% 60%)',
                  }}
                >
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
                    ? 'hsl(325 89% 50% / 0.15)'
                    : 'hsl(325 89% 50%)',
                  color: checkedIn ? 'hsl(325 89% 55%)' : 'white',
                  border: checkedIn ? '1.5px solid hsl(325 89% 50% / 0.5)' : 'none',
                  boxShadow: checkedIn ? 'none' : '0 0 16px hsl(325 89% 50% / 0.4)',
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
                  className="h-10 px-4 rounded-xl font-bold text-sm flex items-center gap-1.5 border text-muted-foreground hover:text-foreground transition-colors"
                  style={{ borderColor: isLight ? 'hsl(230 15% 85%)' : 'hsl(230 25% 20%)' }}
                >
                  <Ticket size={14} />
                  Billets
                </button>
              )}

              <button
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address + ', ' + event.city)}`, '_blank')}
                className="h-10 px-4 rounded-xl font-bold text-sm flex items-center gap-1.5 border text-muted-foreground hover:text-foreground transition-colors"
                style={{ borderColor: isLight ? 'hsl(230 15% 85%)' : 'hsl(230 25% 20%)' }}
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
