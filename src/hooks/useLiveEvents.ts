import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LiveEvent {
  event_id: string;
  event_name: string;
  event_city: string;
  event_date: string | null;
  check_ins: number;
}

/**
 * useLiveEvents — retourne les events ayant reçu des check-ins récents.
 * Rafraîchit automatiquement via realtime sur la table event_attendance.
 */
export function useLiveEvents(options?: { sinceHours?: number; limit?: number; enabled?: boolean }) {
  const sinceHours = options?.sinceHours ?? 6;
  const limit = options?.limit ?? 50;
  const enabled = options?.enabled ?? true;

  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('get_live_events' as any, {
      _since_hours: sinceHours,
      _limit: limit,
    });
    if (!error && Array.isArray(data)) {
      setEvents(data as LiveEvent[]);
    }
    setLoading(false);
  }, [enabled, sinceHours, limit]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime : quand un check-in survient, on recharge (debounce 1.5s)
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel('live-events-pulse')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_attendance' },
        () => {
          if (reloadTimer.current) clearTimeout(reloadTimer.current);
          reloadTimer.current = setTimeout(() => load(), 1500);
        },
      )
      .subscribe();

    return () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      supabase.removeChannel(channel);
    };
  }, [enabled, load]);

  // Map event_id → count pour un lookup rapide depuis EventMap
  const liveCountById = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.event_id] = e.check_ins;
    return acc;
  }, {});

  return { events, liveCountById, loading, reload: load };
}
