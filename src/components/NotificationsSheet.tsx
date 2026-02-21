import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Check, X, PartyPopper } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  related_event_id: string | null;
  read_at: string | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read_at).length);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    load();
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
    load();
  };

  return { notifications, unreadCount, markRead, markAllRead, reload: load };
}

interface NotificationsSheetProps {
  open: boolean;
  onClose: () => void;
  onEventClick?: (eventId: string) => void;
}

export function NotificationsSheet({ open, onClose, onEventClick }: NotificationsSheetProps) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[550] flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      <div className="px-4 pt-10 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-foreground">Notifications</h2>
          <p className="text-xs text-muted-foreground">{unreadCount} non lue{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
              Tout lire
            </button>
          )}
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--secondary))' }}>
            <X size={16} className="text-foreground" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden pb-20 px-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={32} className="mx-auto text-muted-foreground mb-2 opacity-40" />
            <p className="text-xs text-muted-foreground">Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.read_at) markRead(n.id);
                  if (n.related_event_id && onEventClick) onEventClick(n.related_event_id);
                }}
                className="w-full text-left rounded-xl border p-3 transition-all"
                style={{
                  borderColor: n.read_at ? 'hsl(var(--border))' : 'hsl(var(--accent) / 0.3)',
                  background: n.read_at ? 'var(--profile-card-bg)' : 'hsl(var(--accent) / 0.05)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--accent) / 0.15)' }}>
                    <PartyPopper size={14} style={{ color: 'hsl(var(--accent))' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground">{n.title}</p>
                    {n.body && <p className="text-[10px] text-muted-foreground mt-0.5">{n.body}</p>}
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.read_at && (
                    <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: 'hsl(var(--accent))' }} />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
