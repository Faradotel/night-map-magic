import { X, MapPin, Clock, Ticket, ExternalLink } from 'lucide-react';
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
        className="rounded-2xl overflow-hidden border border-surface-4"
        style={{
          background: 'hsl(258 55% 9% / 0.97)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 -4px 24px hsl(258 60% 4% / 0.8)',
        }}
      >
        {/* Color accent */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${vibe.color}, hsl(315 100% 53%))` }} />

        <div className="p-3 flex gap-3 items-start">
          {/* Fake image placeholder with gradient */}
          <div
            className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center text-2xl"
            style={{
              background: `linear-gradient(135deg, ${vibe.color}33, ${event.imageColor || vibe.color}55)`,
              border: `1px solid ${vibe.color}44`,
            }}
          >
            {type.emoji}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-semibold" style={{ color: vibe.color }}>
                {vibe.emoji} {vibe.label}
              </span>
              {event.isLive && (
                <span className="text-[10px] font-bold text-neon-pink flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-pink inline-block" style={{ animation: 'neon-pulse 1s infinite' }} />
                  LIVE
                </span>
              )}
            </div>
            <h3 className="text-sm font-black tracking-tight leading-tight truncate">{event.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 truncate">
                <MapPin size={10} className="text-neon-pink shrink-0" />
                {event.venue}
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <Clock size={10} className="text-neon-cyan" />
                {formatTime(event.startTime)}
              </span>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-surface-3 text-muted-foreground hover:text-foreground transition-colors shrink-0"
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
              background: 'linear-gradient(135deg, hsl(183 100% 40%), hsl(195 100% 35%))',
              color: 'hsl(258 60% 8%)',
              boxShadow: '0 0 12px hsl(183 100% 50% / 0.3)',
            }}
          >
            Voir détails
          </button>
          {event.ticketUrl && (
            <button
              onClick={() => window.open(event.ticketUrl, '_blank')}
              className="h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1 border border-surface-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Ticket size={12} /> Billets
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
