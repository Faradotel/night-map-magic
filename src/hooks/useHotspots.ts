import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Hotspot {
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

/**
 * useHotspots — top events pour ce soir (global) + hotspots amis.
 */
export function useHotspots(options?: { tonightLimit?: number; minFriends?: number }) {
  const { user } = useAuth();
  const tonightLimit = options?.tonightLimit ?? 5;
  const minFriends = options?.minFriends ?? 2;

  const [tonight, setTonight] = useState<Hotspot[]>([]);
  const [friendHotspots, setFriendHotspots] = useState<FriendHotspot[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const tonightReq = supabase.rpc('get_tonight_hotspots' as any, { _limit: tonightLimit });
    const friendsReq = user
      ? supabase.rpc('get_friend_hotspots' as any, { _min_friends: minFriends, _limit: 10 })
      : Promise.resolve({ data: [], error: null } as any);

    const [tonightRes, friendsRes] = await Promise.all([tonightReq, friendsReq]);

    if (!tonightRes.error && Array.isArray(tonightRes.data)) {
      setTonight(tonightRes.data as Hotspot[]);
    }
    if (!friendsRes.error && Array.isArray(friendsRes.data)) {
      setFriendHotspots(friendsRes.data as FriendHotspot[]);
    }
    setLoading(false);
  }, [user, tonightLimit, minFriends]);

  useEffect(() => {
    load();
  }, [load]);

  return { tonight, friendHotspots, loading, reload: load };
}
