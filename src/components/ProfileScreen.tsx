import { allBadges } from '@/data/badges';
import { AllBadgesScreen } from '@/components/AllBadgesScreen';
import { useUnlockedBadges } from '@/hooks/useUnlockedBadges';
import { AuthScreen } from '@/components/AuthScreen';
import { PrivacyPolicyScreen } from '@/components/PrivacyPolicyScreen';
import { Settings, ChevronRight, MapPin, Calendar, Star, Sun, Moon, LogOut, Bell, Pencil, Check, X, Heart, Clock } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAttendance } from '@/hooks/useAttendance';
import { usePreferredCity } from '@/hooks/usePreferredCity';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useDistanceUnit, DistanceUnit } from '@/hooks/useDistanceUnit';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useFavorites } from '@/hooks/useFavorites';
import { formatDate } from '@/data/mockEvents';

export function ProfileScreen() {
  const { theme, toggleTheme } = useTheme();
  const { unit, cycleUnit } = useDistanceUnit();
  const { stats, attended } = useAttendance();
  const { preferredCity } = usePreferredCity();
  const { favorites, toggleFavorite } = useFavorites();
  const { user, signOut } = useAuth();
  const [username, setUsername] = useState(() => {
    const funnyNames = ['Fantôme Dansant 👻', 'Hibou Anonyme 🦉', 'Ninja du Dancefloor 🥷', 'Licorne Nocturne 🦄', 'Loup Solitaire 🐺'];
    return funnyNames[Math.floor(Math.random() * funnyNames.length)];
  });
  const [editingUsername, setEditingUsername] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [friendNotifs, setFriendNotifs] = useState(true);

  const badges = useUnlockedBadges(attended);
  const unlockedBadges = badges.filter(b => b.unlocked);
  const lockedBadges = badges.filter(b => !b.unlocked);

  // Load profile data
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .maybeSingle();
      if (profile) setUsername(profile.username);

      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('friend_attendance_enabled')
        .eq('user_id', user.id)
        .maybeSingle();
      if (prefs) setFriendNotifs(prefs.friend_attendance_enabled);
    })();
  }, [user]);

  const toggleFriendNotifs = async () => {
    const next = !friendNotifs;
    setFriendNotifs(next);
    if (user) {
      await supabase
        .from('notification_preferences')
        .update({ friend_attendance_enabled: next })
        .eq('user_id', user.id);
    }
  };

  const saveUsername = async () => {
    const trimmed = editValue.trim();
    if (trimmed.length < 3) {
      toast.error('Le pseudo doit faire au moins 3 caractères');
      return;
    }
    if (trimmed === username) {
      setEditingUsername(false);
      return;
    }
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', trimmed)
      .neq('user_id', user?.id ?? '')
      .maybeSingle();
    if (existing) {
      toast.error('Ce pseudo est déjà pris');
      return;
    }
    if (user) {
      await supabase.from('profiles').update({ username: trimmed }).eq('user_id', user.id);
      setUsername(trimmed);
      toast.success('Pseudo mis à jour !');
    }
    setEditingUsername(false);
  };

  const thisWeekCount = attended.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }).length;

  return (
    <div
      className="absolute inset-0 z-[300] overflow-y-auto scrollbar-hidden"
      style={{ background: 'hsl(var(--surface-1))' }}
    >
      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(275 71% 58% / 0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative pb-20">
        {/* Header */}
        <div className="px-4 pt-10 pb-6 flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5">Profil</p>
            <h1 className="text-2xl font-black tracking-tight">
              Mon <span className="text-neon-cyan">PulseMap</span>
            </h1>
          </div>
          {user && (
            <button onClick={signOut} className="w-9 h-9 rounded-full flex items-center justify-center border border-surface-4 text-muted-foreground">
              <LogOut size={16} />
            </button>
          )}
        </div>

        {/* User card */}
        <div className="mx-4 mb-4">
          <div
            className="rounded-2xl p-4 border border-surface-4 flex items-center gap-4"
            style={{ background: 'var(--profile-card-bg)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 border-2"
              style={{
                background: 'linear-gradient(135deg, hsl(275 71% 25%), hsl(315 60% 20%))',
                borderColor: 'hsl(275 71% 58% / 0.4)',
                boxShadow: '0 0 20px hsl(275 71% 58% / 0.2)',
              }}
            >
              🌙
            </div>

            <div className="flex-1 min-w-0">
              {editingUsername ? (
                <div className="flex items-center gap-1.5">
                  <input
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    autoFocus
                    className="font-black text-lg tracking-tight bg-transparent border-b border-muted-foreground focus:outline-none focus:border-foreground w-28"
                    onKeyDown={e => { if (e.key === 'Enter') saveUsername(); if (e.key === 'Escape') setEditingUsername(false); }}
                  />
                  <button onClick={saveUsername} className="text-neon-cyan"><Check size={16} /></button>
                  <button onClick={() => setEditingUsername(false)} className="text-muted-foreground"><X size={16} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h2 className="font-black text-lg tracking-tight">{username}</h2>
                  {user && (
                    <button onClick={() => { setEditValue(username); setEditingUsername(true); }} className="text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{preferredCity}, France</p>
              {user ? (
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Star size={11} className="text-neon-cyan" />
                    <span className="text-xs font-bold text-neon-cyan">{unlockedBadges.length}</span>
                    <span className="text-xs text-muted-foreground">badges</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={11} className="text-neon-pink" />
                    <span className="text-xs font-bold text-foreground">{stats.totalEvents}</span>
                    <span className="text-xs text-muted-foreground">soirées</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={11} className="text-neon-purple" />
                    <span className="text-xs font-bold text-foreground">{stats.uniqueCities}</span>
                    <span className="text-xs text-muted-foreground">villes</span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground mt-1">Connecte-toi pour voir tes stats</p>
              )}
            </div>
          </div>
        </div>

        {user && (
          <div className="mx-4 mb-5 grid grid-cols-3 gap-2">
            {[
              { label: 'Check-ins', value: String(stats.totalEvents), color: 'hsl(183 100% 50%)' },
              { label: 'Cette semaine', value: String(thisWeekCount), color: 'hsl(315 100% 53%)' },
              { label: 'Villes', value: String(stats.uniqueCities), color: 'hsl(275 71% 58%)' },
            ].map(stat => (
              <div
                key={stat.label}
                className="rounded-xl p-3 border border-surface-4 text-center"
                style={{ background: 'var(--profile-card-bg)' }}
              >
                <p className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {user ? (
          <>
            {/* Unlocked badges */}
            <div className="px-4 mb-2">
              <h3 className="text-sm font-black mb-3 flex items-center gap-2">
                🏆 Badges débloqués
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'hsl(183 100% 50% / 0.15)', color: 'hsl(183 100% 50%)' }}
                >
                  {unlockedBadges.length}/{allBadges.length}
                </span>
              </h3>
              {unlockedBadges.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {unlockedBadges.map(badge => (
                    <BadgeCard key={badge.id} badge={badge} unlocked={true} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Aucun badge débloqué pour l'instant. Fais ton premier check-in ! 🚀
                </p>
              )}
            </div>

            {/* Locked badges preview */}
            <div className="px-4 mt-4">
              <button
                onClick={() => setShowAllBadges(true)}
                className="w-full text-left"
              >
                <h3 className="text-sm font-black mb-3 text-muted-foreground flex items-center gap-2">
                  🔒 À débloquer
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'hsl(var(--surface-4))' }}
                  >
                    {lockedBadges.length}
                  </span>
                  <ChevronRight size={14} className="ml-auto text-muted-foreground" />
                </h3>
              </button>
              <div className="grid grid-cols-3 gap-2">
                {lockedBadges.slice(0, 6).map(badge => (
                  <BadgeCard key={badge.id} badge={badge} unlocked={false} />
                ))}
              </div>
              {lockedBadges.length > 6 && (
                <button
                  onClick={() => setShowAllBadges(true)}
                  className="w-full mt-3 py-2.5 rounded-xl border border-surface-4 text-xs font-bold text-muted-foreground transition-colors"
                  style={{ background: 'var(--profile-card-bg)' }}
                >
                  Voir les {lockedBadges.length} badges →
                </button>
              )}
            </div>

            {showAllBadges && <AllBadgesScreen onBack={() => setShowAllBadges(false)} attended={attended} />}
          </>
        ) : (
          <div className="mx-4 mt-2 mb-4">
            <div
              className="rounded-2xl p-5 border border-surface-4 text-center"
              style={{ background: 'var(--profile-card-bg)' }}
            >
              <p className="text-3xl mb-2">🔐</p>
              <h3 className="text-sm font-black mb-1">Connecte-toi pour débloquer les badges</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Crée un compte pour suivre ta progression, personnaliser ton pseudo et collectionner des badges !
              </p>
              <AuthScreen inline />
            </div>
          </div>
        )}
        {/* Notifications toggle */}
        <div className="mx-4 mt-5 mb-3">
          <h3 className="text-sm font-black mb-2 text-muted-foreground">Notifications</h3>
          <div
            className="rounded-2xl border border-surface-4 overflow-hidden"
            style={{ background: 'var(--profile-card-bg)' }}
          >
            <button
              onClick={toggleFriendNotifs}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <Bell size={16} style={{ color: 'hsl(var(--accent))' }} />
                <div>
                  <p className="text-sm font-medium">Soirées des amis</p>
                  <p className="text-xs text-muted-foreground">
                    {friendNotifs ? 'Notifié quand un ami va à une soirée' : 'Notifications désactivées'}
                  </p>
                </div>
              </div>
              <div
                className="w-10 h-6 rounded-full relative transition-colors"
                style={{
                  background: friendNotifs ? 'hsl(var(--accent))' : 'hsl(var(--surface-4))',
                }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  style={{ left: friendNotifs ? '18px' : '2px' }}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Theme toggle */}
        <div className="mx-4 mt-2 mb-3">
          <h3 className="text-sm font-black mb-2 text-muted-foreground">Apparence</h3>
          <div
            className="rounded-2xl border border-surface-4 overflow-hidden"
            style={{ background: 'var(--profile-card-bg)' }}
          >
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon size={16} className="text-neon-cyan" /> : <Sun size={16} className="text-neon-cyan" />}
                <div>
                  <p className="text-sm font-medium">Mode {theme === 'dark' ? 'sombre' : 'clair'}</p>
                  <p className="text-xs text-muted-foreground">
                    {theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
                  </p>
                </div>
              </div>
              <div
                className="w-10 h-6 rounded-full relative transition-colors"
                style={{
                  background: theme === 'light' ? 'hsl(var(--primary))' : 'hsl(var(--surface-4))',
                }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  style={{ left: theme === 'light' ? '18px' : '2px' }}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Settings section */}
        <div className="mx-4 mt-2">
          <h3 className="text-sm font-black mb-2 text-muted-foreground">Paramètres</h3>
          <div
            className="rounded-2xl border border-surface-4 overflow-hidden"
            style={{ background: 'var(--profile-card-bg)' }}
          >
            <button
              onClick={cycleUnit}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              style={{ borderBottom: '1px solid var(--profile-divider)' }}
            >
              <div>
                <p className="text-sm font-medium">Unité de distance</p>
                <p className="text-xs text-muted-foreground">
                  {unit === 'km' ? 'Kilomètres' : unit === 'miles' ? 'Miles' : 'Mètres'}
                </p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
            <button
              onClick={() => setShowPrivacy(true)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div>
                <p className="text-sm font-medium">Confidentialité</p>
                <p className="text-xs text-muted-foreground">RGPD & données personnelles</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {showPrivacy && <PrivacyPolicyScreen onBack={() => setShowPrivacy(false)} />}
      </div>
    </div>
  );
}

function BadgeCard({ badge, unlocked }: { badge: import('@/data/badges').Badge; unlocked: boolean }) {
  return (
    <div
      className="rounded-xl p-2.5 border flex flex-col items-center gap-1.5 relative overflow-hidden transition-all"
      style={{
        background: unlocked ? badge.gradient : 'hsl(258 40% 11%)',
        borderColor: unlocked ? badge.color + '40' : 'hsl(258 40% 16%)',
        opacity: unlocked ? 1 : 0.5,
        boxShadow: unlocked ? `0 4px 16px ${badge.color}22` : 'none',
      }}
    >
      {unlocked && (
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-50"
          style={{ background: `linear-gradient(90deg, transparent, ${badge.color}, transparent)` }}
        />
      )}

      <span className="text-2xl">{unlocked ? badge.emoji : '🔒'}</span>
      <p className="text-[10px] font-bold text-center leading-tight"
        style={{ color: unlocked ? badge.color : 'hsl(258 20% 40%)' }}>
        {badge.name}
      </p>
      <p className="text-[9px] text-center leading-tight"
        style={{ color: unlocked ? 'hsl(240 20% 75%)' : 'hsl(258 20% 35%)' }}>
        {badge.condition}
      </p>
    </div>
  );
}
