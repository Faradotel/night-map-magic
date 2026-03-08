import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EventPass {
  id: string;
  event_id: string;
  event_name: string;
  qr_data: string | null;
  image_path: string | null;
  created_at: string;
}

export function useEventPass(eventId: string) {
  const { user } = useAuth();
  const [pass, setPass] = useState<EventPass | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPass(null);
      setLoading(false);
      return;
    }
    supabase
      .from('event_passes')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .maybeSingle()
      .then(({ data }) => {
        setPass(data as EventPass | null);
        setLoading(false);
      });
  }, [user, eventId]);

  const savePass = useCallback(
    async (opts: { eventName: string; qrData: string | null; imageFile?: File }) => {
      if (!user) return null;

      let imagePath: string | null = null;

      if (opts.imageFile) {
        const ext = opts.imageFile.name.split('.').pop() || 'png';
        const path = `${user.id}/${eventId}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('event-passes')
          .upload(path, opts.imageFile, { upsert: true });
        if (!uploadErr) imagePath = path;
      }

      const row = {
        user_id: user.id,
        event_id: eventId,
        event_name: opts.eventName,
        qr_data: opts.qrData,
        image_path: imagePath,
      };

      const { data, error } = await supabase
        .from('event_passes')
        .upsert(row as any, { onConflict: 'user_id,event_id' })
        .select()
        .single();

      if (!error && data) {
        setPass(data as EventPass);
      }
      return error ? null : data;
    },
    [user, eventId],
  );

  const deletePass = useCallback(async () => {
    if (!user || !pass) return;
    if (pass.image_path) {
      await supabase.storage.from('event-passes').remove([pass.image_path]);
    }
    await supabase.from('event_passes').delete().eq('user_id', user.id).eq('event_id', eventId);
    setPass(null);
  }, [user, pass, eventId]);

  return { pass, loading, savePass, deletePass, hasPass: !!pass };
}
