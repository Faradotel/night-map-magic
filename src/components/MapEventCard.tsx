import { useRef, useCallback, useMemo } from 'react';
import { X, ChevronUp, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { NightEvent, vibeConfig, typeConfig, getDistance } from '@/data/mockEvents';
import { useDistanceUnit } from '@/hooks/useDistanceUnit';
import { useTheme } from '@/hooks/useTheme';
import { useEventAttendanceCount } from '@/hooks/useEventAttendanceCount';
import { formatDate, formatTime } from '@/data/mockEvents';

interface MapEventCardProps {
  event: NightEvent;
  onClose: () => void;
  onDetails: () => void;
  userLocation?: [number, number] | null;
  /** All co-located events (same address/coords). If provided, enables swiping. */
  coLocatedEvents?: NightEvent[];
  onEventChange?: (event: NightEvent) => void;
}

export function MapEventCard({ event, onClose, onDetails, userLocation, coLocatedEvents, onEventChange }: MapEventCardProps) {
  const vibe = vibeConfig[event.vibe];
  const type = typeConfig[event.type];
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { formatDistance } = useDistanceUnit();
  const distanceKm = userLocation
    ? getDistance(userLocation[0], userLocation[1], event.lat, event.lng)
    : null;

  const attendanceCount = useEventAttendanceCount(event.id);
  const source = event.id.startsWith('tm-') ? 'Ticketmaster' : event.id.startsWith('shotgun-') ? 'Shotgun' : event.id.startsWith('eb-') ? 'Eventbrite' : event.id.startsWith('mu-') ? 'Meetup' : event.id.startsWith('ic-') ? 'InfoConcert' : event.id.startsWith('bb-') ? 'Brocabrac' : null;
  const isBrocabrac = event.id.startsWith('bb-');

  // Co-located navigation
  const group = useMemo(() => coLocatedEvents && coLocatedEvents.length > 1 ? coLocatedEvents : null, [coLocatedEvents]);
  const currentIndex = group ? group.findIndex(e => e.id === event.id) : 0;
  const hasMultiple = group !== null;

  const goNext = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!group || !onEventChange) return;
    const next = (currentIndex + 1) % group.length;
    onEventChange(group[next]);
  }, [group, currentIndex, onEventChange]);

  const goPrev = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!group || !onEventChange) return;
    const prev = (currentIndex - 1 + group.length) % group.length;
    onEventChange(group[prev]);
  }, [group, currentIndex, onEventChange]);

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
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    touchStartY.current = null;
    touchStartX.current = null;

    // Horizontal swipe takes priority when there are multiple events
    if (hasMultiple && absDeltaX > 40 && absDeltaX > absDeltaY) {
      if (deltaX > 0 && group && onEventChange) {
        // Swipe left → next
        const next = (currentIndex + 1) % group.length;
        onEventChange(group[next]);
      } else if (deltaX < 0 && group && onEventChange) {
        // Swipe right → prev
        const prev = (currentIndex - 1 + group.length) % group.length;
        onEventChange(group[prev]);
      }
      return;
    }

    // Vertical swipe
    if (deltaY > 40 && absDeltaY > absDeltaX) {
      onDetails();
    }
    if (deltaY < -40 && absDeltaY > absDeltaX) {
      onClose();
    }
  }, [onDetails, onClose, hasMultiple, group, currentIndex, onEventChange]);

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
          {/* Left arrow for co-located nav */}
          {hasMultiple && (
            <button
              onClick={goPrev}
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform"
              style={{
                background: isLight ? 'hsl(0 0% 0% / 0.06)' : 'hsl(0 0% 100% / 0.08)',
                color: isLight ? 'hsl(230 25% 30%)' : 'hsl(0 0% 70%)',
              }}
            >
              <ChevronLeft size={14} />
            </button>
          )}

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
              {hasMultiple && (
                <span className="text-[9px] font-medium opacity-40">
                  {currentIndex + 1}/{group!.length}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold tracking-tight leading-tight truncate" style={{ color: isLight ? 'hsl(230 25% 15%)' : undefined }}>{isBrocabrac ? '🧺 ' : ''}{event.name}</h3>
            <p className="text-[11px] flex items-center gap-1 flex-wrap" style={{ color: isLight ? 'hsl(225 15% 40%)' : 'hsl(225 15% 50%)' }}>
              {formatDate(event.startTime)} • {formatTime(event.startTime)}
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

          {/* Right arrow for co-located nav */}
          {hasMultiple && (
            <button
              onClick={goNext}
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform"
              style={{
                background: isLight ? 'hsl(0 0% 0% / 0.06)' : 'hsl(0 0% 100% / 0.08)',
                color: isLight ? 'hsl(230 25% 30%)' : 'hsl(0 0% 70%)',
              }}
            >
              <ChevronRight size={14} />
            </button>
          )}

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
