import { Flame, Users } from 'lucide-react';
import { useHotspots } from '@/hooks/useHotspots';
import { NightEvent } from '@/data/mockEvents';

interface Props {
  events: NightEvent[];
  onEventSelect: (event: NightEvent) => void;
}

/**
 * Horizontal banner displayed at the top of the map showing
 * - tonight's most popular events (by check-ins)
 * - events where the user has friends going (if logged in)
 */
export function TonightsHotspotsBanner({ events, onEventSelect }: Props) {
  const { tonight, friends } = useHotspots(8);

  // Build a quick lookup for resolving event_id → NightEvent
  const eventById = new Map(events.map(e => [e.id, e]));

  const friendChips = friends
    .map(f => ({ ...f, event: eventById.get(f.event_id) }))
    .filter(f => f.event);

  const tonightChips = tonight
    .map(t => ({ ...t, event: eventById.get(t.event_id) }))
    .filter(t => t.event && !friendChips.some(f => f.event_id === t.event_id));

  if (friendChips.length === 0 && tonightChips.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto scrollbar-hidden pointer-events-auto">
      <div className="flex items-center gap-2 px-1 py-1">
        {friendChips.map((f) => (
          <button
            key={`f-${f.event_id}`}
            onClick={() => onEventSelect(f.event!)}
            className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-xs font-bold transition-all active:scale-95"
            style={{
              background: 'hsl(var(--accent) / 0.15)',
              borderColor: 'hsl(var(--accent) / 0.4)',
              color: 'hsl(var(--accent))',
              backdropFilter: 'blur(12px)',
            }}
          >
            <Users size={12} />
            <span className="max-w-[140px] truncate">{f.event!.name}</span>
            <span
              className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-black"
              style={{ background: 'hsl(var(--accent))', color: 'white' }}
            >
              {f.friend_count}
            </span>
          </button>
        ))}
        {tonightChips.map((t) => (
          <button
            key={`t-${t.event_id}`}
            onClick={() => onEventSelect(t.event!)}
            className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-xs font-bold transition-all active:scale-95"
            style={{
              background: 'var(--controls-bg)',
              borderColor: 'var(--controls-border)',
              color: 'hsl(var(--foreground))',
              backdropFilter: 'blur(12px)',
              boxShadow: 'var(--controls-shadow)',
            }}
          >
            <Flame size={12} style={{ color: 'hsl(20 100% 55%)' }} />
            <span className="max-w-[140px] truncate">{t.event!.name}</span>
            <span
              className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-black"
              style={{ background: 'hsl(20 100% 55%)', color: 'white' }}
            >
              +{t.check_ins}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
