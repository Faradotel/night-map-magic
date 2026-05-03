import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LiveEvent {
  event_id: string;
  event_name: string;
  event_city: string;
  event_date: string | null;
  check_ins: number;
}

/**
 * Fetches events with recent check-ins (Live Pulse).
 * Subscribes to realtime inserts on event_attendance to refresh the list.
 *
 * @param sinceHours how far back to look for check-ins (default 6h)
 * @param enabled toggle live tracking (default true)
 */
export function useLiveEvents(sinceHours = 6, enabled = true) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('get_live_events' as any, {
      _since_hours: sinceHours,
      _limit: 100,
    });
    if (!error && Array.isArray(data)) {
      setEvents(data as LiveEvent[]);
    }
    setLoading(false);
  }, [sinceHours, enabled]);

  useEffect(() => {
    if (!enabled) {
      setEvents([]);
      return;
    }
    refresh();

    const channel = supabase
      .channel('live-pulse-attendance')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_attendance' },
        () => { refresh(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [enabled, refresh]);

  // Map for O(1) lookup by event id
  const liveMap = new Map<string, number>(events.map(e => [e.event_id, Number(e.check_ins)]));

  return { events, liveMap, loading, refresh };
}
