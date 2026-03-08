import { useRef, useCallback } from 'react';
import { X, MapPin, Clock, Ticket, ExternalLink, Check, ChevronDown, Share2, Music, Users, Info } from 'lucide-react';
import { NightEvent, vibeConfig, typeConfig, formatTime, formatDate } from '@/data/mockEvents';
import { useEventAttendanceCount } from '@/hooks/useEventAttendanceCount';
import type { useAttendance } from '@/hooks/useAttendance';

interface EventDetailPageProps {
  event: NightEvent;
  onClose: () => void;
  userLocation?: [number, number] | null;
  attendance: ReturnType<typeof useAttendance>;
}

export function EventDetailPage({ event, onClose, userLocation, attendance }: EventDetailPageProps) {
  const checkedIn = attendance.isAttended(event.id);
  const attendanceCount = useEventAttendanceCount(event.id);

  // Swipe down to close
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartX.current);
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    touchStartY.current = null;
    touchStartX.current = null;

    // Swipe down when scrolled to top
    if (deltaY > 60 && deltaY > deltaX && scrollTop <= 5) {
      onClose();
    }
  }, [onClose]);
  const vibe = vibeConfig[event.vibe];
  const type = typeConfig[event.type];

  const source = event.id.startsWith('tm-') ? 'Ticketmaster' : event.id.startsWith('shotgun-') ? 'Shotgun' : event.id.startsWith('eb-') ? 'Eventbrite' : 'PulseMap';
  const sourceColor = source === 'Ticketmaster' ? 'hsl(210 100% 56%)' : source === 'Shotgun' ? 'hsl(25 95% 55%)' : source === 'Eventbrite' ? 'hsl(15 85% 55%)' : 'hsl(var(--primary))';

  const priceColor =
    event.priceRange === 'gratuit' ? 'hsl(130 60% 55%)' :
    event.priceRange === '€1-10' ? 'hsl(130 60% 55%)' :
    event.priceRange === '€10-20' ? 'hsl(45 100% 55%)' : 'hsl(var(--accent))';

  const handleShare = async () => {
    const shareText = `Hey, rejoins-moi ici ! 🎶\n${event.name} — ${event.venue}, ${event.city}`;
    if (navigator.share) {
      await navigator.share({ title: event.name, text: shareText, url: event.ticketUrl || window.location.href });
    }
  };

  return (
    <div ref={scrollRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="absolute inset-0 z-[600] flex flex-col overflow-y-auto" style={{ background: 'hsl(var(--background))' }}>
      {/* Hero header */}
      <div className="relative shrink-0">
        {/* Gradient bg */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${vibe.color}33, hsl(var(--background)))`,
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-20"
          style={{ background: 'linear-gradient(to top, hsl(var(--background)), transparent)' }}
        />

        {/* Swipe-down hint + share */}
        <div className="relative flex items-center justify-between pt-6 pb-2 px-4">
          <div className="flex-1 flex flex-col items-center">
            <div className="w-10 h-1 rounded-full opacity-30 mb-1" style={{ background: 'hsl(0 0% 50%)' }} />
            <ChevronDown size={16} className="opacity-30" style={{ color: 'hsl(0 0% 50%)' }} />
          </div>
          <button
            onClick={onClose}
            className="absolute right-4 top-6 w-9 h-9 rounded-full flex items-center justify-center border text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: 'hsl(var(--secondary))', borderColor: 'hsl(var(--border))' }}
          >
            <X size={16} />
          </button>
          <button
            onClick={handleShare}
            className="absolute right-4 top-[68px] w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-90"
            style={{
              background: 'hsl(var(--secondary))',
              borderColor: 'hsl(var(--border))',
            }}
          >
            <Share2 size={16} className="text-foreground" />
          </button>
        </div>
        <div className="relative pb-1" />
        </div>

        {/* Event icon + title */}
        <div className="relative px-5 pb-6">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 border-2"
              style={{
                background: `linear-gradient(135deg, ${vibe.color}30, ${vibe.color}15)`,
                borderColor: `${vibe.color}50`,
                boxShadow: `0 0 20px ${vibe.color}22`,
              }}
            >
              {type.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  style={{
                    borderColor: `${vibe.color}40`,
                    color: vibe.color,
                    background: `${vibe.color}15`,
                  }}
                >
                  {vibe.emoji} {vibe.label}
                </span>
                <span className="text-[10px] text-muted-foreground">{type.emoji} {type.label}</span>
                {event.isLive && (
                  <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: 'hsl(var(--accent))' }}>
                    <span className="w-1.5 h-1.5 rounded-full inline-block neon-pulse" style={{ background: 'hsl(var(--accent))' }} />
                    LIVE
                  </span>
                )}
              </div>
              <h1 className="text-xl font-black tracking-tight leading-tight text-foreground">
                {event.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 pb-32">
        {/* Source badge */}
        <div className="px-5 mb-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold"
            style={{
              borderColor: `${sourceColor}40`,
              color: sourceColor,
              background: `${sourceColor}10`,
            }}
          >
            <Info size={12} />
            Source : {source}
          </div>
          {event.externalAttendees != null && event.externalAttendees > 0 && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ml-2"
              style={{
                borderColor: 'hsl(var(--accent) / 0.4)',
                color: 'hsl(var(--accent))',
                background: 'hsl(var(--accent) / 0.1)',
              }}
            >
              <Users size={12} />
              {event.externalAttendees} inscrit{event.externalAttendees > 1 ? 's' : ''}
            </div>
          )}
          {attendanceCount != null && attendanceCount > 0 && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ml-2"
              style={{
                borderColor: 'hsl(var(--primary) / 0.4)',
                color: 'hsl(var(--primary))',
                background: 'hsl(var(--primary) / 0.1)',
              }}
            >
              <Users size={12} />
              {attendanceCount} via PulseMap
            </div>
          )}
        </div>

        {/* Info cards */}
        <div className="px-5 mb-4 space-y-2">
          {/* Date & Time */}
          <div
            className="rounded-xl p-3 border flex items-center gap-3"
            style={{ background: 'var(--profile-card-bg)', borderColor: 'hsl(var(--border))' }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--accent) / 0.12)' }}>
              <Clock size={18} style={{ color: 'hsl(var(--accent))' }} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{formatDate(event.startTime)}</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(event.startTime)}
                {event.endTime && ` — ${formatTime(event.endTime)}`}
              </p>
            </div>
          </div>

          {/* Venue & Location */}
          <div
            className="rounded-xl p-3 border flex items-center gap-3"
            style={{ background: 'var(--profile-card-bg)', borderColor: 'hsl(var(--border))' }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--accent) / 0.12)' }}>
              <MapPin size={18} style={{ color: 'hsl(var(--accent))' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{event.venue}</p>
              <p className="text-xs text-muted-foreground truncate">{event.address}, {event.city}</p>
            </div>
            <button
              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(event.address + ', ' + event.city)}`, '_blank')}
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              <ExternalLink size={14} className="text-muted-foreground" />
            </button>
          </div>

          {/* Price */}
          <div
            className="rounded-xl p-3 border flex items-center gap-3"
            style={{ background: 'var(--profile-card-bg)', borderColor: 'hsl(var(--border))' }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${priceColor}18` }}>
              <Ticket size={18} style={{ color: priceColor }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: priceColor }}>{event.priceRange}</p>
              <p className="text-xs text-muted-foreground">
                {event.priceRange === 'gratuit' ? 'Entrée libre' : 'Prix estimé'}
              </p>
            </div>
          </div>
        </div>

        {/* Genres */}
        <div className="px-5 mb-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Music size={12} /> Genres
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {event.genres.map(g => (
              <span
                key={g}
                className="text-xs px-3 py-1 rounded-full border font-medium"
                style={{
                  background: 'hsl(var(--secondary))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
              >
                #{g}
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="px-5 mb-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Info size={12} /> À propos
          </h3>
          <div
            className="rounded-xl p-4 border"
            style={{ background: 'var(--profile-card-bg)', borderColor: 'hsl(var(--border))' }}
          >
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {event.description || 'Aucune description disponible pour cet événement.'}
            </p>
          </div>
        </div>

        {/* Source details */}
        <div className="px-5 mb-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users size={12} /> Détails {source}
          </h3>
          <div
            className="rounded-xl p-4 border"
            style={{ background: 'var(--profile-card-bg)', borderColor: 'hsl(var(--border))' }}
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plateforme</span>
                <span className="font-bold" style={{ color: sourceColor }}>{source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium text-foreground">{type.emoji} {type.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ambiance</span>
                <span className="font-medium text-foreground">{vibe.emoji} {vibe.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ville</span>
                <span className="font-medium text-foreground">{event.city}</span>
              </div>
              {event.ticketUrl && (
                <button
                  onClick={() => window.open(event.ticketUrl, '_blank')}
                  className="w-full mt-2 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all active:scale-95"
                  style={{
                    borderColor: `${sourceColor}40`,
                    color: sourceColor,
                    background: `${sourceColor}10`,
                  }}
                >
                  <ExternalLink size={12} />
                  Voir sur {source}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom action bar */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 py-3 border-t"
        style={{
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          borderColor: 'var(--nav-border)',
        }}
      >
        <div className="flex gap-2">
          <button
            onClick={() => attendance.toggleAttendance({ id: event.id, name: event.name, city: event.city, date: event.startTime })}
            className="flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{
              background: checkedIn ? 'hsl(var(--accent) / 0.15)' : 'hsl(var(--accent))',
              color: checkedIn ? 'hsl(var(--accent))' : 'white',
              border: checkedIn ? '1.5px solid hsl(var(--accent) / 0.5)' : 'none',
              boxShadow: checkedIn ? 'none' : '0 0 16px hsl(var(--accent) / 0.4)',
            }}
          >
            {checkedIn ? <><Check size={16} /> J'y suis allé !</> : <>✓ J'y vais</>}
          </button>

          {event.ticketUrl && (
            <button
              onClick={() => window.open(event.ticketUrl, '_blank')}
              className="h-12 px-5 rounded-xl font-bold text-sm flex items-center gap-1.5 border transition-all active:scale-95"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              <Ticket size={14} />
              Billets
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
