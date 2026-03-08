import { MapPin, Calendar, Clock, Music, Sparkles, Tag, Euro } from 'lucide-react';
import { EventFormData, vibeOptions, typeOptions } from './types';

interface Props {
  data: EventFormData;
}

export function StepPreview({ data }: Props) {
  const typeInfo = typeOptions.find(t => t.key === data.type);
  const vibeInfo = vibeOptions.find(v => v.key === data.vibe);
  const dateFormatted = data.date
    ? new Date(data.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground text-center mb-2">
        Vérifie les informations avant de publier
      </p>

      {/* Card preview */}
      <div
        className="rounded-2xl overflow-hidden border"
        style={{
          background: 'hsl(258 45% 11%)',
          borderColor: 'hsl(258 40% 20%)',
        }}
      >
        {/* Header band */}
        <div
          className="h-20 flex items-end px-4 pb-3"
          style={{
            background: 'linear-gradient(135deg, hsl(275 71% 30%), hsl(183 80% 25%))',
          }}
        >
          <h3 className="text-base font-black text-white tracking-tight leading-tight">
            {data.name || 'Sans nom'}
          </h3>
        </div>

        <div className="p-4 space-y-3">
          {/* Type & Vibe */}
          <div className="flex flex-wrap gap-2">
            {typeInfo && (
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: 'hsl(275 71% 58% / 0.2)', color: 'hsl(275 71% 70%)' }}
              >
                {typeInfo.emoji} {typeInfo.label}
              </span>
            )}
            {vibeInfo && (
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: 'hsl(183 100% 50% / 0.12)', color: 'hsl(183 100% 60%)' }}
              >
                {vibeInfo.emoji} {vibeInfo.label}
              </span>
            )}
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar size={11} /> {dateFormatted || '—'}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} /> {data.time || '—'}
            </span>
          </div>

          {/* Location */}
          {data.selectedAddress && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <MapPin size={11} className="mt-0.5 shrink-0" style={{ color: 'hsl(183 100% 50%)' }} />
              <span className="leading-relaxed">
                {data.venue ? <strong className="text-foreground">{data.venue} · </strong> : null}
                {data.selectedAddress.display_name.split(', ').slice(0, 3).join(', ')}
              </span>
            </div>
          )}

          {/* Genres */}
          {data.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.genres.map(g => (
                <span
                  key={g}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'hsl(315 100% 53% / 0.15)', color: 'hsl(315 100% 65%)' }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {data.description && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {data.description}
            </p>
          )}

          {/* Price */}
          {data.price && (
            <div className="flex items-center gap-1.5 text-xs">
              <Euro size={11} style={{ color: 'hsl(45 100% 55%)' }} />
              <span style={{ color: 'hsl(45 100% 65%)' }} className="font-semibold">{data.price}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
