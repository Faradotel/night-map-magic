import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { vibeConfig, typeConfig, EventVibe } from '@/data/mockEvents';
import { pickVibeStockPhoto } from '@/data/vibeStockPhotos';

export interface EventCardData {
  id: string;
  name: string;
  venue: string;
  city: string;
  start_time: string;
  price_range: string;
  type: string;
  vibe: string;
  image_url: string | null;
  image_color: string;
}

interface EventCardProps {
  event: EventCardData;
  href: string;
  dateLabel: string;
  variant?: 'hero' | 'grid';
}

const NEON_SHADOW_BY_VIBE: Record<string, string> = {
  rave: 'shadow-neon-pink',
  party: 'shadow-neon-pink',
  nightlife: 'shadow-neon-purple',
  dance: 'shadow-neon-purple',
  concert: 'shadow-neon-purple',
  chill: 'shadow-neon-cyan',
  culture: 'shadow-neon-cyan',
  sport: 'shadow-neon-green',
};

function priceColor(priceRange: string): string {
  if (priceRange === 'gratuit' || priceRange === '€1-10') return 'hsl(130 60% 65%)';
  if (priceRange === '€10-20') return 'hsl(45 100% 65%)';
  return 'hsl(0 0% 100%)';
}

export function EventCard({ event, href, dateLabel, variant = 'grid' }: EventCardProps) {
  const resolvedVibe: EventVibe = (event.vibe as EventVibe) in vibeConfig ? (event.vibe as EventVibe) : 'nightlife';
  const vibeInfo = vibeConfig[resolvedVibe];
  const typeInfo = typeConfig[event.type] ?? typeConfig.autre;
  // image_color is a near-black scraper/upload placeholder (e.g. '#1a0f2e'),
  // not a meaningful per-event hue — vibeConfig is the only reliably vivid
  // color source, so it alone drives the card's background.
  const accent = vibeInfo.color;
  const isHero = variant === 'hero';
  // Real event photo if we have one, else a curated free-license stock photo
  // for the vibe (see src/data/vibeStockPhotos.ts) — almost no scraped event
  // has a real image_url, so this is what most cards actually show.
  const photoUrl = event.image_url || pickVibeStockPhoto(resolvedVibe, event.id);
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <Link
      to={href}
      className={`block group relative overflow-hidden rounded-3xl transition-transform active:scale-[0.98] ${
        isHero
          ? `aspect-[16/10] sm:aspect-[21/9] ${NEON_SHADOW_BY_VIBE[event.vibe] ?? 'shadow-xl shadow-black/30'}`
          : 'aspect-[4/5] sm:aspect-square rounded-2xl hover:-translate-y-0.5'
      }`}
    >
      {!photoFailed ? (
        <img
          src={photoUrl}
          alt=""
          loading="lazy"
          onError={() => setPhotoFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${accent}, hsl(var(--surface-1)) 200%)` }}
        />
      )}
      {/* Fixed black scrim, not a theme token: --surface-1 flips to near-white
          in light mode, which would wash out the white overlay text below. */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.72) 100%)' }}
      />

      {isHero && (
        <span className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold bg-white/15 text-white backdrop-blur-sm border border-white/20">
          {event.price_range}
        </span>
      )}

      <div className={`absolute bottom-0 left-0 right-0 ${isHero ? 'p-5 sm:p-8' : 'p-3'}`}>
        <div
          className={`flex items-center gap-1 font-bold uppercase tracking-wider text-white/90 ${
            isHero ? 'text-[11px] mb-2' : 'text-[10px] mb-1'
          }`}
        >
          <span
            className={isHero ? 'px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20' : ''}
          >
            {vibeInfo.emoji} {vibeInfo.label}
          </span>
          {isHero && <span className="normal-case font-medium text-white/70">{typeInfo.emoji} {typeInfo.label}</span>}
        </div>

        <h3
          className={`font-black text-white leading-tight line-clamp-2 ${
            isHero ? 'text-2xl sm:text-4xl tracking-tight mb-2' : 'text-sm font-extrabold mb-1'
          }`}
        >
          {event.name}
        </h3>

        {isHero ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> {dateLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} /> {event.venue}, {event.city}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-white/75 font-medium">
            <span>{dateLabel}</span>
            <span style={{ color: priceColor(event.price_range) }}>{event.price_range}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
