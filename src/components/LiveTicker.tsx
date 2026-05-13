import type { LiveEvent } from '@/hooks/useLiveEvents';
import { Flame } from 'lucide-react';
import { NightEvent } from '@/data/mockEvents';

interface LiveTickerProps {
  liveEvents: LiveEvent[];
  allEvents: NightEvent[];
  onSelect: (event: NightEvent) => void;
}

/**
 * Discreet horizontal marquee shown only in LIVE MODE: scrolls the names of
 * events with recent check-ins. Tap → focus the event. Reinforces the
 * "something is happening RIGHT NOW around me" feeling.
 */
export function LiveTicker({ liveEvents, allEvents, onSelect }: LiveTickerProps) {
  if (!liveEvents || liveEvents.length === 0) return null;

  // Duplicate items so the CSS marquee loops seamlessly
  const items = [...liveEvents, ...liveEvents];

  return (
    <div
      className="pointer-events-auto absolute left-0 right-0 z-[400] overflow-hidden"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 156px)',
        background: 'linear-gradient(90deg, hsl(0 95% 12% / 0.85), hsl(325 80% 12% / 0.85))',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderTop: '1px solid hsl(0 95% 55% / 0.4)',
        borderBottom: '1px solid hsl(0 95% 55% / 0.4)',
        boxShadow: '0 4px 20px hsl(0 95% 30% / 0.4)',
      }}
    >
      <div className="live-ticker-track py-1.5 px-3">
        {items.map((ev, i) => {
          const full = allEvents.find((e) => e.id === ev.event_id);
          return (
            <button
              key={`${ev.event_id}-${i}`}
              onClick={() => full && onSelect(full)}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/95 active:opacity-70"
            >
              <Flame size={11} className="flame-flicker" style={{ color: 'hsl(28 95% 60%)' }} />
              <span className="uppercase tracking-wider truncate max-w-[180px]">{ev.event_name}</span>
              <span
                className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                style={{ background: 'hsl(142 71% 45% / 0.25)', color: 'hsl(142 71% 65%)' }}
              >
                +{ev.check_ins}
              </span>
              <span className="opacity-30">•</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
