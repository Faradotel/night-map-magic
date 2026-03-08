import { Calendar, Clock, Tag } from 'lucide-react';
import { EventFormData, vibeOptions, typeOptions, genreOptions } from './types';
import { MusicGenre } from '@/data/mockEvents';

interface Props {
  data: EventFormData;
  onChange: (patch: Partial<EventFormData>) => void;
  errors: Record<string, string>;
}

export function StepBasicInfo({ data, onChange, errors }: Props) {
  const todayStr = new Date().toISOString().split('T')[0];

  function toggleGenre(g: MusicGenre) {
    const genres = data.genres.includes(g)
      ? data.genres.filter(x => x !== g)
      : [...data.genres, g];
    onChange({ genres });
  }

  return (
    <div className="space-y-5">
      {/* Event name */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
          Nom de l'évènement *
        </label>
        <input
          value={data.name}
          onChange={e => onChange({ name: e.target.value })}
          maxLength={80}
          placeholder="Ex: Nuit Électrique, Jazz Night..."
          className="w-full h-11 px-4 rounded-xl text-sm font-medium outline-none transition-all"
          style={{
            background: 'hsl(258 40% 13%)',
            border: `1.5px solid ${errors.name ? 'hsl(0 80% 55%)' : 'hsl(258 40% 22%)'}`,
            color: 'hsl(240 20% 90%)',
          }}
        />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1">
            <Calendar size={10} /> Date *
          </label>
          <input
            type="date"
            value={data.date}
            min={todayStr}
            onChange={e => onChange({ date: e.target.value })}
            className="w-full h-11 px-3 rounded-xl text-sm outline-none"
            style={{
              background: 'hsl(258 40% 13%)',
              border: `1.5px solid ${errors.date ? 'hsl(0 80% 55%)' : 'hsl(258 40% 22%)'}`,
              color: data.date ? 'hsl(240 20% 90%)' : 'hsl(240 20% 50%)',
              colorScheme: 'dark',
            }}
          />
          {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1">
            <Clock size={10} /> Heure
          </label>
          <input
            type="time"
            value={data.time}
            onChange={e => onChange({ time: e.target.value })}
            className="w-full h-11 px-3 rounded-xl text-sm outline-none"
            style={{
              background: 'hsl(258 40% 13%)',
              border: '1.5px solid hsl(258 40% 22%)',
              color: 'hsl(240 20% 90%)',
              colorScheme: 'dark',
            }}
          />
        </div>
      </div>

      {/* Type */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
          Type d'évènement
        </label>
        <div className="flex gap-2 flex-wrap">
          {typeOptions.map(t => (
            <button
              key={t.key}
              onClick={() => onChange({ type: t.key })}
              className="h-8 px-3 rounded-xl text-xs font-semibold border transition-all"
              style={{
                background: data.type === t.key ? 'hsl(275 71% 58% / 0.2)' : 'hsl(258 40% 13%)',
                borderColor: data.type === t.key ? 'hsl(275 71% 58%)' : 'hsl(258 40% 22%)',
                color: data.type === t.key ? 'hsl(275 71% 70%)' : 'hsl(240 20% 60%)',
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vibe */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
          Ambiance
        </label>
        <div className="flex gap-2 flex-wrap">
          {vibeOptions.map(v => (
            <button
              key={v.key}
              onClick={() => onChange({ vibe: v.key })}
              className="h-8 px-3 rounded-xl text-xs font-semibold border transition-all"
              style={{
                background: data.vibe === v.key ? 'hsl(183 100% 50% / 0.15)' : 'hsl(258 40% 13%)',
                borderColor: data.vibe === v.key ? 'hsl(183 100% 50%)' : 'hsl(258 40% 22%)',
                color: data.vibe === v.key ? 'hsl(183 100% 60%)' : 'hsl(240 20% 60%)',
              }}
            >
              {v.emoji} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Genres */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1">
          <Tag size={10} /> Genres musicaux *
        </label>
        <div className="flex flex-wrap gap-2">
          {genreOptions.map(g => (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              className="h-7 px-3 rounded-full text-xs font-medium border transition-all"
              style={{
                background: data.genres.includes(g) ? 'hsl(315 100% 53% / 0.2)' : 'hsl(258 40% 13%)',
                borderColor: data.genres.includes(g) ? 'hsl(315 100% 53%)' : 'hsl(258 40% 22%)',
                color: data.genres.includes(g) ? 'hsl(315 100% 70%)' : 'hsl(240 20% 60%)',
              }}
            >
              {g}
            </button>
          ))}
        </div>
        {errors.genres && <p className="text-xs text-destructive mt-1">{errors.genres}</p>}
      </div>
    </div>
  );
}
