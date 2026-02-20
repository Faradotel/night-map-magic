import { X, MapPin, Navigation, Heart } from 'lucide-react';
import { NightEvent, vibeConfig, typeConfig, formatTime, getDistance } from '@/data/mockEvents';

interface MapEventCardProps {
  event: NightEvent;
  onClose: () => void;
  onDetails: () => void;
  userLocation?: [number, number] | null;
}

export function MapEventCard({ event, onClose, onDetails, userLocation }: MapEventCardProps) {
  const vibe = vibeConfig[event.vibe];
  const type = typeConfig[event.type];

  const distance = userLocation
    ? getDistance(userLocation[0], userLocation[1], event.lat, event.lng).toFixed(1)
    : null;

  return (
    <div className="absolute bottom-20 left-3 right-3 z-[450] pointer-events-auto">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(26, 13, 21, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid hsl(325 89% 50% / 0.3)',
          borderLeftWidth: '4px',
          borderLeftColor: 'hsl(325 89% 50%)',
          boxShadow: '0 8px 32px hsl(230 60% 4% / 0.8)',
        }}
      >
        <div className="px-3 py-2.5 flex items-center gap-3">
          {/* Emoji icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
            style={{
              background: `linear-gradient(135deg, hsl(325 89% 50% / 0.2), hsl(275 71% 58% / 0.3))`,
              border: '1px solid hsl(0 0% 100% / 0.1)',
            }}
          >
            {type.emoji}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'hsl(325 89% 50%)' }}>
                {vibe.emoji} {vibe.label}
              </span>
              {event.isLive && (
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(142 71% 55%)' }} />
              )}
            </div>
            <h3 className="text-sm font-bold tracking-tight leading-tight truncate">{event.name}</h3>
            <p className="text-[11px]" style={{ color: 'hsl(225 15% 50%)' }}>
              {event.genres[0] || type.label}
              {distance && ` • ${distance}km`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onDetails}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold text-white active:scale-95"
              style={{
                background: 'hsl(325 89% 50%)',
                boxShadow: '0 0 12px hsl(325 89% 50% / 0.3)',
              }}
            >
              Détails
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'hsl(0 0% 100% / 0.1)', color: 'hsl(225 15% 60%)' }}
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
