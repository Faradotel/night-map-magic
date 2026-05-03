import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TonightHotspot {
  event_id: string;
  event_name: string;
  event_city: string;
  event_date: string | null;
  check_ins: number;
}

export interface FriendHotspot {
  event_id: string;
  event_name: string;
  event_city: string;
  event_date: string | null;
  friend_count: number;
  friend_usernames: string[] | null;
}

export function useHotspots(limit = 10) {
  const { user } = useAuth();
  const [tonight, setTonight] = useState<TonightHotspot[]>([]);
  const [friends, setFriends] = useState<FriendHotspot[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const tonightPromise = supabase.rpc('get_tonight_hotspots' as any, { _limit: limit });
    const friendPromise = user
      ? supabase.rpc('get_friend_hotspots' as any, { _min_friends: 2, _limit: limit })
      : Promise.resolve({ data: [], error: null });

    const [tonightRes, friendRes] = await Promise.all([tonightPromise, friendPromise]);
    if (!tonightRes.error && Array.isArray(tonightRes.data)) {
      setTonight(tonightRes.data as TonightHotspot[]);
    }
    if (!friendRes.error && Array.isArray(friendRes.data)) {
      setFriends(friendRes.data as FriendHotspot[]);
    }
    setLoading(false);
  }, [limit, user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { tonight, friends, loading, refresh };
}
