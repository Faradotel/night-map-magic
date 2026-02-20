import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Ticket, MapPin } from 'lucide-react';

interface ShotgunScreenProps {
  onGoToMap: () => void;
}

const CITIES = [
  { name: 'Nice', slug: 'nice' },
  { name: 'Paris', slug: 'paris' },
  { name: 'Lyon', slug: 'lyon' },
  { name: 'Marseille', slug: 'marseille' },
  { name: 'Bordeaux', slug: 'bordeaux' },
  { name: 'Lille', slug: 'lille' },
  { name: 'Toulouse', slug: 'toulouse' },
  { name: 'Montpellier', slug: 'montpellier' },
  { name: 'Strasbourg', slug: 'strasbourg' },
  { name: 'Nantes', slug: 'nantes' },
];

// Cities that have a widget placeholder — update this set when you add real embeds
const SUPPORTED_CITIES = new Set(['nice', 'paris', 'lyon', 'marseille', 'bordeaux', 'lille']);

export function ShotgunScreen({ onGoToMap }: ShotgunScreenProps) {
  const [city, setCity] = useState('nice');
  const selected = CITIES.find(c => c.slug === city)!;
  const hasWidget = SUPPORTED_CITIES.has(city);

  return (
    <div className="absolute inset-0 bottom-16 overflow-y-auto z-[300]" style={{ background: 'hsl(var(--background))' }}>
      {/* Header */}
      <div className="px-4 pt-14 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Ticket size={20} className="text-neon-cyan" style={{ filter: 'drop-shadow(0 0 6px hsl(183 100% 50% / 0.6))' }} />
          <h1
            className="text-xl font-black tracking-tight"
            style={{
              background: 'linear-gradient(90deg, hsl(183 100% 60%), hsl(275 71% 70%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Shotgun à {selected.name}
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Événements Shotgun à {selected.name} (via leur widget officiel)
        </p>
      </div>

      {/* City selector */}
      <div className="px-4 mb-4">
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger
            className="w-full border-none h-10 text-sm font-semibold"
            style={{
              background: 'hsl(258 45% 15%)',
              color: 'hsl(183 100% 70%)',
            }}
          >
            <SelectValue placeholder="Choisis une ville" />
          </SelectTrigger>
          <SelectContent
            className="border-none z-[9999]"
            style={{
              background: 'hsl(258 45% 13%)',
              color: 'hsl(0 0% 90%)',
            }}
          >
            {CITIES.map(c => (
              <SelectItem
                key={c.slug}
                value={c.slug}
                className="focus:bg-[hsl(258_45%_20%)] focus:text-neon-cyan cursor-pointer"
              >
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Widget area */}
      <div className="px-4 mb-6">
        {hasWidget ? (
          <div
            className="rounded-xl overflow-hidden border"
            style={{
              borderColor: 'hsl(258 40% 20%)',
              background: 'hsl(258 50% 12%)',
              minHeight: 420,
            }}
          >
            <iframe
              src={`https://shotgun.live/cities/${city}`}
              title={`Shotgun events – ${selected.name}`}
              className="w-full border-0"
              style={{ minHeight: 420, background: 'hsl(258 50% 10%)' }}
              loading="lazy"
              allow="autoplay; fullscreen"
            />
          </div>
        ) : (
          <div
            className="rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center border"
            style={{
              borderColor: 'hsl(258 40% 20%)',
              background: 'hsl(258 50% 12%)',
              minHeight: 200,
            }}
          >
            <Ticket size={32} className="text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pas encore de widget Shotgun pour cette ville
              <br />
              <span className="text-neon-cyan font-semibold">Ajoute tes events toi-même !</span>
            </p>
          </div>
        )}
      </div>

      {/* CTA button */}
      <div className="px-4 pb-8">
        <button
          onClick={onGoToMap}
          className="w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, hsl(183 100% 40%), hsl(275 71% 50%))',
            color: '#fff',
            boxShadow: '0 0 20px hsl(183 100% 50% / 0.3)',
          }}
        >
          <MapPin size={16} />
          Voir sur ma carte
        </button>
      </div>
    </div>
  );
}
