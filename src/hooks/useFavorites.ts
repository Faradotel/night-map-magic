import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface FavoriteEvent {
  event_id: string;
  event_name: string;
  event_city: string;
  event_date: string | null;
  created_at: string;
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    supabase
      .from('event_favorites')
      .select('event_id, event_name, event_city, event_date, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setFavorites((data as FavoriteEvent[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const isFavorite = useCallback(
    (eventId: string) => favorites.some(f => f.event_id === eventId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (event: { id: string; name: string; city: string; startTime: string }) => {
      if (!user) {
        toast.error('Connecte-toi pour sauvegarder des favoris');
        return;
      }

      const exists = favorites.some(f => f.event_id === event.id);

      if (exists) {
        setFavorites(prev => prev.filter(f => f.event_id !== event.id));
        await supabase
          .from('event_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', event.id);
        toast.success('Retiré des favoris');
      } else {
        const newFav: FavoriteEvent = {
          event_id: event.id,
          event_name: event.name,
          event_city: event.city,
          event_date: event.startTime,
          created_at: new Date().toISOString(),
        };
        setFavorites(prev => [newFav, ...prev]);
        await supabase.from('event_favorites').insert({
          user_id: user.id,
          event_id: event.id,
          event_name: event.name,
          event_city: event.city,
          event_date: event.startTime,
        } as any);
        toast.success('Ajouté aux favoris ❤️');
      }
    },
    [user, favorites]
  );

  return { favorites, loading, isFavorite, toggleFavorite };
}
