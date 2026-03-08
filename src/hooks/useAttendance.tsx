import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AttendedEvent {
  id: string;
  name: string;
  city: string;
  date: string;
}

const STORAGE_KEY = 'pulsemap_attended';

function loadLocal(): AttendedEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function useAttendance() {
  const { user } = useAuth();
  const [attended, setAttended] = useState<AttendedEvent[]>(loadLocal);
  const [dbLoaded, setDbLoaded] = useState(false);

  // Load from DB when authenticated
  useEffect(() => {
    if (!user || dbLoaded) return;
    (async () => {
      const { data } = await supabase
        .from('event_attendance')
        .select('event_id, event_name, event_city, event_date')
        .eq('user_id', user.id);
      if (data) {
        const events: AttendedEvent[] = data.map(d => ({
          id: d.event_id,
          name: d.event_name,
          city: d.event_city,
          date: d.event_date || '',
        }));
        setAttended(events);
        setDbLoaded(true);
      }
    })();
  }, [user, dbLoaded]);

  const toggleAttendance = useCallback(async (event: AttendedEvent) => {
    const exists = attended.some(e => e.id === event.id);

    if (user) {
      if (exists) {
        await supabase.from('event_attendance').delete().eq('user_id', user.id).eq('event_id', event.id);
      } else {
        await supabase.from('event_attendance').insert({
          user_id: user.id,
          event_id: event.id,
          event_name: event.name,
          event_city: event.city,
          event_date: event.date || null,
        });
      }
    }

    setAttended(prev => {
      const next = exists ? prev.filter(e => e.id !== event.id) : [...prev, event];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [attended, user]);

  const isAttended = useCallback((id: string) => {
    return attended.some(e => e.id === id);
  }, [attended]);

  const stats = {
    totalEvents: attended.length,
    uniqueCities: new Set(attended.map(e => e.city)).size,
  };

  return { attended, toggleAttendance, isAttended, stats };
}
