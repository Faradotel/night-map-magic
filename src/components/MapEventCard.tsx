import { X, MapPin, Clock, Ticket } from 'lucide-react';
import { NightEvent, vibeConfig, typeConfig, formatTime, formatDate } from '@/data/mockEvents';

interface MapEventCardProps {
  event: NightEvent;
  onClose: () => void;
  onDetails: () => void;
}

export function MapEventCard({ event, onClose, onDetails }: MapEventCardProps) {
  const vibe = vibeConfig[event.vibe];
  const type = typeConfig[event.type];

  return (
    <div
      className="absolute bottom-20 left-2 right-2 z-[450] pointer-events-auto"
      style={{ maxWidth: 380 }}
    >
      <div
        className="rounded-2xl overflow-hidden border"
        style={{
          background: 'hsl(230 50% 8% / 0.97)',
          borderColor: 'hsl(230 25% 16% / 0.6)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 -4px 24px hsl(230 60% 4% / 0.8)',
        }}
      >
        {/* Color accent */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, hsl(325 89% 50%), hsl(275 71% 58%))` }} />

        <div className="p-3 flex gap-3 items-start">
          {/* Image placeholder */}
          <div
            className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center text-2xl"
            style={{
              background: `linear-gradient(135deg, hsl(325 89% 50% / 0.2), hsl(275 71% 58% / 0.3))`,
              border: `1px solid hsl(325 89% 50% / 0.3)`,
            }}
          >
            {type.emoji}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-semibold" style={{ color: 'hsl(325 89% 55%)' }}>
                {vibe.emoji} {vibe.label}
              </span>
              {event.isLive && (
                <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: 'hsl(325 89% 50%)' }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'hsl(325 89% 50%)', animation: 'neon-pulse 1s infinite' }} />
                  LIVE
                </span>
              )}
            </div>
            <h3 className="text-sm font-extrabold tracking-tight leading-tight truncate">{event.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 truncate">
                <MapPin size={10} style={{ color: 'hsl(325 89% 50%)' }} />
                {event.venue}
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <Clock size={10} style={{ color: 'hsl(225 15% 55%)' }} />
                {formatTime(event.startTime)}
              </span>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0"
            style={{ background: 'hsl(230 35% 14%)', color: 'hsl(225 15% 55%)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Action row */}
        <div className="px-3 pb-3 flex gap-2">
          <button
            onClick={onDetails}
            className="flex-1 h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: 'hsl(325 89% 50%)',
              color: 'white',
              boxShadow: '0 0 16px hsl(325 89% 50% / 0.4)',
            }}
          >
            Voir détails
          </button>
          {event.ticketUrl && (
            <button
              onClick={() => window.open(event.ticketUrl, '_blank')}
              className="h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1 border transition-colors"
              style={{ borderColor: 'hsl(230 25% 20%)', color: 'hsl(225 15% 60%)' }}
            >
              <Ticket size={12} /> Billets
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
