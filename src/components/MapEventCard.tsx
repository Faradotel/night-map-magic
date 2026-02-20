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
        <div className="p-4 flex items-start gap-4">
          {/* Left content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Badges */}
            <div className="flex items-center gap-2">
              {event.isLive && (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: 'hsl(142 71% 45% / 0.2)', color: 'hsl(142 71% 55%)' }}
                >
                  <span className="mr-1 w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'hsl(142 71% 55%)' }} />
                  Animé
                </span>
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(325 89% 50%)' }}>
                {vibe.emoji} {vibe.label}
              </span>
            </div>

            {/* Title */}
            <div>
              <h3 className="text-xl font-bold tracking-tight leading-tight truncate">{event.name}</h3>
              <p className="text-sm font-medium" style={{ color: 'hsl(225 15% 50%)' }}>
                {event.genres[0] || type.label}
                {distance && ` • ${distance}km`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={onDetails}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all active:scale-95"
                style={{
                  background: 'hsl(325 89% 50%)',
                  boxShadow: '0 0 16px hsl(325 89% 50% / 0.3)',
                }}
              >
                <Navigation size={16} />
                Détails
              </button>
              <button
                className="p-2.5 rounded-full transition-all"
                style={{ background: 'hsl(0 0% 100% / 0.1)' }}
              >
                <Heart size={18} style={{ color: 'hsl(225 15% 70%)' }} />
              </button>
            </div>
          </div>

          {/* Right: Image placeholder + close */}
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'hsl(0 0% 100% / 0.1)', color: 'hsl(225 15% 60%)' }}
            >
              <X size={14} />
            </button>
            <div
              className="w-24 h-24 rounded-xl flex items-center justify-center text-3xl"
              style={{
                background: `linear-gradient(135deg, hsl(325 89% 50% / 0.2), hsl(275 71% 58% / 0.3))`,
                border: '1px solid hsl(0 0% 100% / 0.1)',
              }}
            >
              {type.emoji}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
