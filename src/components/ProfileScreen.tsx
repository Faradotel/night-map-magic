import { allBadges } from '@/data/badges';
import { Settings, ChevronRight, MapPin, Calendar, Star, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function ProfileScreen() {
  const { theme, toggleTheme } = useTheme();
  const unlockedBadges = allBadges.filter(b => b.unlocked);
  const lockedBadges = allBadges.filter(b => !b.unlocked);

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
              Mon <span className="text-neon-cyan">NightMap</span>
            </h1>
          </div>
          <button className="w-9 h-9 rounded-full flex items-center justify-center border border-surface-4 text-muted-foreground">
            <Settings size={16} />
          </button>
        </div>

        {/* User card */}
        <div className="mx-4 mb-4">
          <div
            className="rounded-2xl p-4 border border-surface-4 flex items-center gap-4"
            style={{ background: 'var(--profile-card-bg)' }}
          >
            {/* Avatar */}
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
              <h2 className="font-black text-lg tracking-tight">NightRider_42</h2>
              <p className="text-xs text-muted-foreground">Paris, France</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Star size={11} className="text-neon-cyan" />
                  <span className="text-xs font-bold text-neon-cyan">{unlockedBadges.length}</span>
                  <span className="text-xs text-muted-foreground">badges</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={11} className="text-neon-pink" />
                  <span className="text-xs font-bold text-foreground">12</span>
                  <span className="text-xs text-muted-foreground">soirées</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={11} className="text-neon-purple" />
                  <span className="text-xs font-bold text-foreground">3</span>
                  <span className="text-xs text-muted-foreground">villes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mx-4 mb-5 grid grid-cols-3 gap-2">
          {[
            { label: 'Check-ins', value: '12', color: 'hsl(183 100% 50%)' },
            { label: 'Cette semaine', value: '3', color: 'hsl(315 100% 53%)' },
            { label: 'Villes', value: '3', color: 'hsl(275 71% 58%)' },
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
          <div className="grid grid-cols-3 gap-2">
            {unlockedBadges.map(badge => (
              <BadgeCard key={badge.id} badge={badge} unlocked={true} />
            ))}
          </div>
        </div>

        {/* Locked badges */}
        <div className="px-4 mt-4">
          <h3 className="text-sm font-black mb-3 text-muted-foreground flex items-center gap-2">
            🔒 À débloquer
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {lockedBadges.map(badge => (
              <BadgeCard key={badge.id} badge={badge} unlocked={false} />
            ))}
          </div>
        </div>

        {/* Theme toggle */}
        <div className="mx-4 mt-5 mb-3">
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
            {[
              { label: 'Notifications soirées proches', sub: 'Activées' },
              { label: 'Unité de distance', sub: 'Kilomètres' },
              { label: 'Confidentialité', sub: '' },
            ].map((item, i, arr) => (
              <button
                key={item.label}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--profile-divider)' : 'none' }}
              >
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  {item.sub && <p className="text-xs text-muted-foreground">{item.sub}</p>}
                </div>
                <ChevronRight size={14} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
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
      {/* Shine effect for unlocked */}
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
