import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, Search, X, UserPlus, Link2, Copy, Check, Clock, UserCheck, UserX, ChevronRight } from 'lucide-react';
import { EventDetailPage } from '@/components/EventDetailPage';
import { AuthScreen } from '@/components/AuthScreen';
import { NightEvent } from '@/data/mockEvents';
import { toast } from 'sonner';
import { useFavorites } from '@/hooks/useFavorites';

interface Friend {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  created_at: string;
  from_username?: string;
  to_username?: string;
}

interface FriendAttendance {
  event_id: string;
  event_name: string;
  event_city: string;
  event_date: string | null;
  username: string;
}

interface FriendsScreenProps {
  allEvents: NightEvent[];
  attendance: any;
}

export function FriendsScreen({ allEvents, attendance }: FriendsScreenProps) {
  const { user } = useAuth();
  const favoritesFriends = useFavorites();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friendAttendance, setFriendAttendance] = useState<FriendAttendance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searching, setSearching] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [detailEvent, setDetailEvent] = useState<NightEvent | null>(null);
  const [tab, setTab] = useState<'friends' | 'requests'>('friends');

  const loadData = useCallback(async () => {
    if (!user) return;

    // Load friends
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_a, user_b')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

    if (friendships) {
      const friendIds = friendships.map(f => f.user_a === user.id ? f.user_b : f.user_a);
      if (friendIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .in('user_id', friendIds);
        setFriends(profiles || []);

        // Load friend attendance
        const { data: att } = await supabase
          .from('event_attendance')
          .select('event_id, event_name, event_city, event_date, user_id')
          .in('user_id', friendIds);

        if (att && profiles) {
          const mapped = att.map(a => ({
            ...a,
            event_date: a.event_date,
            username: profiles.find(p => p.user_id === a.user_id)?.username || '?',
          }));
          setFriendAttendance(mapped);
        }
      }
    }

    // Load requests
    const { data: reqs } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('status', 'pending')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

    if (reqs) {
      const userIds = [...new Set(reqs.flatMap(r => [r.from_user_id, r.to_user_id]))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const enriched = reqs.map(r => ({
        ...r,
        from_username: profiles?.find(p => p.user_id === r.from_user_id)?.username,
        to_username: profiles?.find(p => p.user_id === r.to_user_id)?.username,
      }));
      setRequests(enriched);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .ilike('username', `%${searchQuery}%`)
      .neq('user_id', user.id)
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  const sendRequest = async (toUserId: string) => {
    if (!user) return;
    const { error } = await supabase.from('friend_requests').insert({
      from_user_id: user.id,
      to_user_id: toUserId,
    });
    if (error) {
      toast.error('Demande déjà envoyée');
    } else {
      toast.success('Demande envoyée !');
      setSearchResults([]);
      setSearchQuery('');
      loadData();
    }
  };

  const respondToRequest = async (requestId: string, accept: boolean) => {
    await supabase
      .from('friend_requests')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', requestId);
    toast.success(accept ? 'Ami ajouté !' : 'Demande refusée');
    loadData();
  };

  const generateShareCode = async () => {
    if (!user) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('share_codes').insert({ user_id: user.id, code, expires_at: expires });
    setShareCode(code);
  };

  const useShareCode = async () => {
    if (!joinCode.trim() || !user) return;
    const { data } = await supabase
      .from('share_codes')
      .select('user_id')
      .eq('code', joinCode.toUpperCase())
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!data) { toast.error('Code invalide ou expiré'); return; }
    if (data.user_id === user.id) { toast.error('Tu ne peux pas utiliser ton propre code'); return; }

    await sendRequest(data.user_id);
    setJoinCode('');
  };

  const copyCode = () => {
    if (shareCode) {
      navigator.clipboard.writeText(shareCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const pendingIncoming = requests.filter(r => r.to_user_id === user?.id);

  if (!user) {
    return (
      <div className="absolute inset-0 z-[300] overflow-y-auto scrollbar-hidden" style={{ background: 'hsl(var(--background))' }}>
        <div className="relative pb-20">
          <div className="px-4 pt-10 pb-4">
            <p className="text-xs text-muted-foreground font-medium mb-0.5">Social</p>
            <h1 className="text-2xl font-black tracking-tight">
              Mes <span style={{ color: 'hsl(var(--primary))' }}>Amis</span>
            </h1>
          </div>
          <div className="px-4">
            <div className="rounded-2xl border p-6 text-center" style={{ borderColor: 'hsl(var(--border))', background: 'var(--profile-card-bg)' }}>
              <div className="text-4xl mb-3">👥</div>
              <h2 className="text-base font-black text-foreground mb-1">Connecte-toi</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Crée un compte ou connecte-toi pour ajouter des amis et voir leurs soirées.
              </p>
              <AuthScreen inline />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (detailEvent) {
    return <EventDetailPage event={detailEvent} onClose={() => setDetailEvent(null)} attendance={attendance} favorites={useFavorites()} />;
  }

  return (
    <div className="absolute inset-0 z-[300] overflow-y-auto scrollbar-hidden" style={{ background: 'hsl(var(--background))' }}>
      <div className="relative pb-20">
        {/* Header */}
        <div className="px-4 pt-10 pb-4">
          <p className="text-xs text-muted-foreground font-medium mb-0.5">Social</p>
          <h1 className="text-2xl font-black tracking-tight">
            Mes <span style={{ color: 'hsl(var(--primary))' }}>Amis</span>
          </h1>
        </div>

        {/* Tabs */}
        <div className="px-4 mb-4 flex gap-2">
          {[
            { key: 'friends' as const, label: 'Amis', count: friends.length },
            { key: 'requests' as const, label: 'Demandes', count: pendingIncoming.length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-full text-xs font-bold transition-all"
              style={{
                background: tab === t.key ? 'hsl(var(--accent))' : 'hsl(var(--secondary))',
                color: tab === t.key ? 'white' : 'hsl(var(--foreground))',
              }}
            >
              {t.label} {t.count > 0 && `(${t.count})`}
            </button>
          ))}
        </div>

        {tab === 'friends' && (
          <>
            {/* Search users */}
            <div className="px-4 mb-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Chercher un pseudo..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border text-xs bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  />
                </div>
                <button onClick={handleSearch} className="h-10 px-4 rounded-xl text-xs font-bold" style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
                  Chercher
                </button>
              </div>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="px-4 mb-4">
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))', background: 'var(--profile-card-bg)' }}>
                  {searchResults.map(u => {
                    const isFriend = friends.some(f => f.user_id === u.user_id);
                    const hasPending = requests.some(r => r.to_user_id === u.user_id || r.from_user_id === u.user_id);
                    return (
                      <div key={u.user_id} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0" style={{ borderColor: 'hsl(var(--border))' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: 'hsl(var(--secondary))' }}>
                            {u.username[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-foreground">{u.username}</span>
                        </div>
                        {isFriend ? (
                          <span className="text-[10px] text-muted-foreground">Déjà ami</span>
                        ) : hasPending ? (
                          <span className="text-[10px] text-muted-foreground">En attente</span>
                        ) : (
                          <button onClick={() => sendRequest(u.user_id)} className="p-2 rounded-lg" style={{ background: 'hsl(var(--accent) / 0.15)', color: 'hsl(var(--accent))' }}>
                            <UserPlus size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Share code section */}
            <div className="px-4 mb-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Link2 size={12} /> Code d'invitation
              </h3>
              <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: 'hsl(var(--border))', background: 'var(--profile-card-bg)' }}>
                {shareCode ? (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-center text-lg font-black tracking-widest" style={{ color: 'hsl(var(--primary))' }}>
                      {shareCode}
                    </span>
                    <button onClick={copyCode} className="p-2 rounded-lg" style={{ background: 'hsl(var(--secondary))' }}>
                      {codeCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-muted-foreground" />}
                    </button>
                  </div>
                ) : (
                  <button onClick={generateShareCode} className="w-full py-2 rounded-lg text-xs font-bold" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
                    Générer un code
                  </button>
                )}
                <div className="flex gap-2">
                  <input
                    placeholder="Entrer un code ami"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-lg border text-xs bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  />
                  <button onClick={useShareCode} disabled={!joinCode.trim()} className="h-9 px-3 rounded-lg text-xs font-bold disabled:opacity-40" style={{ background: 'hsl(var(--accent))', color: 'white' }}>
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            {/* Friends list */}
            <div className="px-4 mb-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {friends.length} ami{friends.length !== 1 ? 's' : ''}
              </h3>
              {friends.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Ajoute tes premiers amis !</p>
              ) : (
                <div className="space-y-2">
                  {friends.map(friend => {
                    const events = friendAttendance.filter(a => a.username === friend.username);
                    return (
                      <div key={friend.user_id} className="rounded-xl border p-3" style={{ borderColor: 'hsl(var(--border))', background: 'var(--profile-card-bg)' }}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'hsl(var(--accent) / 0.15)', color: 'hsl(var(--accent))' }}>
                            {friend.username[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{friend.username}</p>
                            <p className="text-[10px] text-muted-foreground">{events.length} soirée{events.length !== 1 ? 's' : ''} prévue{events.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        {events.length > 0 && (
                          <div className="space-y-1 ml-12">
                            {events.slice(0, 3).map(ev => {
                              const fullEvent = allEvents.find(e => e.id === ev.event_id);
                              const eventToShow = fullEvent || {
                                id: ev.event_id,
                                name: ev.event_name,
                                city: ev.event_city,
                                venue: '',
                                address: '',
                                lat: 0,
                                lng: 0,
                                startTime: ev.event_date || '',
                                endTime: '',
                                genres: [],
                                vibe: 'chill' as const,
                                type: 'soirée' as const,
                                priceRange: '€10-20' as const,
                                description: '',
                                imageColor: '#1a0f2e',
                                isLive: false,
                              } as NightEvent;
                              return (
                                <button
                                  key={ev.event_id}
                                  onClick={() => setDetailEvent(eventToShow)}
                                  className="w-full text-left flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">{ev.event_name}</p>
                                    <p className="text-[10px] text-muted-foreground">{ev.event_city}</p>
                                  </div>
                                  <ChevronRight size={12} className="text-muted-foreground shrink-0" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'requests' && (
          <div className="px-4">
            {pendingIncoming.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Aucune demande en attente</p>
            ) : (
              <div className="space-y-2">
                {pendingIncoming.map(r => (
                  <div key={r.id} className="rounded-xl border p-3 flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))', background: 'var(--profile-card-bg)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
                        {r.from_username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{r.from_username}</p>
                        <p className="text-[10px] text-muted-foreground">Veut être ton ami</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => respondToRequest(r.id, true)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
                        <UserCheck size={14} />
                      </button>
                      <button onClick={() => respondToRequest(r.id, false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--destructive) / 0.15)', color: 'hsl(var(--destructive))' }}>
                        <UserX size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
