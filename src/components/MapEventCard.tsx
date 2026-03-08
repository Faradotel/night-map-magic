import { useRef, useCallback } from 'react';
import { X, ChevronUp, Users } from 'lucide-react';
import { NightEvent, vibeConfig, typeConfig, getDistance } from '@/data/mockEvents';
import { useDistanceUnit } from '@/hooks/useDistanceUnit';
import { useTheme } from '@/hooks/useTheme';
import { useEventAttendanceCount } from '@/hooks/useEventAttendanceCount';

interface MapEventCardProps {
  event: NightEvent;
  onClose: () => void;
  onDetails: () => void;
  userLocation?: [number, number] | null;
}

export function MapEventCard({ event, onClose, onDetails, userLocation }: MapEventCardProps) {
  const vibe = vibeConfig[event.vibe];
  const type = typeConfig[event.type];
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { formatDistance } = useDistanceUnit();
  const distanceKm = userLocation
    ? getDistance(userLocation[0], userLocation[1], event.lat, event.lng)
    : null;

  const attendanceCount = useEventAttendanceCount(event.id);
  const source = event.id.startsWith('tm-') ? 'Ticketmaster' : event.id.startsWith('shotgun-') ? 'Shotgun' : event.id.startsWith('eb-') ? 'Eventbrite' : null;

  // Swipe tracking
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    const deltaX = Math.abs(touchStartX.current - e.changedTouches[0].clientX);
    touchStartY.current = null;
    touchStartX.current = null;

    // Swipe up (vertical > horizontal, min 40px)
    if (deltaY > 40 && deltaY > deltaX) {
      onDetails();
    }
    // Swipe down
    if (deltaY < -40 && Math.abs(deltaY) > deltaX) {
      onClose();
    }
  }, [onDetails, onClose]);

  return (
    <div className="absolute bottom-20 left-3 right-3 z-[450] pointer-events-auto">
      <div
        className="rounded-2xl overflow-hidden cursor-pointer select-none"
        onClick={onDetails}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          background: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(26, 13, 21, 0.85)',
          backdropFilter: 'blur(16px)',
          border: isLight ? `1px solid ${vibe.color}33` : `1px solid ${vibe.color}55`,
          borderLeftWidth: '4px',
          borderLeftColor: vibe.color,
          boxShadow: isLight ? '0 8px 32px rgba(0,0,0,0.12)' : '0 8px 32px hsl(230 60% 4% / 0.8)',
        }}
      >
        {/* Swipe hint bar + icon */}
        <div className="flex flex-col items-center pt-2 pb-0 gap-0.5">
          <div className="w-8 h-1 rounded-full opacity-30" style={{ background: isLight ? 'hsl(230 25% 30%)' : 'hsl(0 0% 60%)' }} />
          <ChevronUp size={14} className="opacity-30" style={{ color: isLight ? 'hsl(230 25% 30%)' : 'hsl(0 0% 60%)' }} />
        </div>

        <div className="px-3 py-1.5 flex items-center gap-3">
          {/* Emoji icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
            style={{
              background: `linear-gradient(135deg, ${vibe.color}33, ${vibe.color}55)`,
              border: '1px solid hsl(0 0% 100% / 0.1)',
            }}
          >
            {type.emoji}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: vibe.color }}>
                {vibe.emoji} {vibe.label}
              </span>
              {event.isLive && (
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(142 71% 55%)' }} />
              )}
            </div>
            <h3 className="text-sm font-bold tracking-tight leading-tight truncate" style={{ color: isLight ? 'hsl(230 25% 15%)' : undefined }}>{event.name}</h3>
            <p className="text-[11px] flex items-center gap-1 flex-wrap" style={{ color: isLight ? 'hsl(225 15% 40%)' : 'hsl(225 15% 50%)' }}>
              {event.genres[0] || type.label}
              {distanceKm != null && ` • ${formatDistance(distanceKm)}`}
              {event.externalAttendees != null && event.externalAttendees > 0 && (
                <span className="inline-flex items-center gap-0.5 ml-1" title="Inscrits sur la plateforme">
                  <Users size={10} /> {event.externalAttendees}
                </span>
              )}
              {attendanceCount != null && attendanceCount > 0 && (
                <span className="inline-flex items-center gap-0.5 ml-1 opacity-60" title="Via PulseMap">
                  (+{attendanceCount} PulseMap)
                </span>
              )}
            </p>
          </div>

          {/* Source + close */}
          <div className="flex items-center gap-2 shrink-0">
            {source && (
              <span className="text-[8px] uppercase tracking-wider opacity-40 font-medium">{source}</span>
            )}
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
