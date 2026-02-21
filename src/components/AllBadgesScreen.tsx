import { badgeCategories, Badge } from '@/data/badges';
import { useUnlockedBadges, UnlockedBadge } from '@/hooks/useUnlockedBadges';
import { AttendedEvent } from '@/hooks/useAttendance';
import { ArrowLeft } from 'lucide-react';

interface AllBadgesScreenProps {
  onBack: () => void;
  attended: AttendedEvent[];
}

export function AllBadgesScreen({ onBack, attended }: AllBadgesScreenProps) {
  const badges = useUnlockedBadges(attended);
  const unlockedBadges = badges.filter(b => b.unlocked);
  const lockedBadges = badges.filter(b => !b.unlocked);

  const categories = Object.entries(badgeCategories) as [Badge['category'], { label: string; emoji: string }][];

  return (
    <div
      className="absolute inset-0 z-[350] overflow-y-auto scrollbar-hidden"
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
        <div className="px-4 pt-10 pb-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-surface-4 text-muted-foreground"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight">
              🔒 Badges à débloquer
            </h1>
            <p className="text-xs text-muted-foreground">
              {lockedBadges.length} badges restants · {unlockedBadges.length} débloqués
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mx-4 mb-5">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--surface-4))' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(unlockedBadges.length / badges.length) * 100}%`,
                background: 'linear-gradient(90deg, hsl(183 100% 50%), hsl(275 71% 58%))',
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            {unlockedBadges.length}/{badges.length}
          </p>
        </div>

        {/* Badges by category */}
        {categories.map(([catKey, catInfo]) => {
          const catBadges = lockedBadges.filter(b => b.category === catKey);
          if (catBadges.length === 0) return null;

          return (
            <div key={catKey} className="px-4 mb-5">
              <h3 className="text-sm font-black mb-3 flex items-center gap-2 text-muted-foreground">
                {catInfo.emoji} {catInfo.label}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'hsl(var(--surface-4))', color: 'hsl(var(--muted-foreground))' }}
                >
                  {catBadges.length}
                </span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {catBadges.map(badge => (
                  <BadgeCard key={badge.id} badge={badge} unlocked={false} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BadgeCard({ badge, unlocked }: { badge: UnlockedBadge; unlocked: boolean }) {
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
