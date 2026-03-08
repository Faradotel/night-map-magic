import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useEventAttendanceCount(eventId: string | null) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!eventId) { setCount(null); return; }

    (async () => {
      const { data, error } = await supabase.rpc('get_event_attendance_count' as any, { _event_id: eventId });
      if (!error && data != null) setCount(Number(data));
    })();
  }, [eventId]);

  return count;
}
