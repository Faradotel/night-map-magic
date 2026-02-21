import { useMemo } from 'react';
import { allBadges, Badge } from '@/data/badges';
import { AttendedEvent } from '@/hooks/useAttendance';

export interface UnlockedBadge extends Badge {
  unlocked: boolean;
}

export function useUnlockedBadges(attended: AttendedEvent[]): UnlockedBadge[] {
  return useMemo(() => {
    const totalCheckins = attended.length;
    const uniqueCities = new Set(attended.map(e => e.city)).size;
    const uniqueSpots = new Set(attended.map(e => e.id)).size;

    // Helper: check if badge should be unlocked
    function isUnlocked(id: string): boolean {
      switch (id) {
        // ── Check-in ──
        case 'checkin_rookie': return totalCheckins >= 1;
        case 'checkin_addict': return totalCheckins >= 10;
        case 'checkin_legend': return totalCheckins >= 50;
        case 'eternal_nightwalker': return totalCheckins >= 100;

        // ── Explore ──
        case 'vibe_explorer': return uniqueSpots >= 5;
        case 'city_hopper': return uniqueCities >= 3;
        case 'neon_nomad': return uniqueSpots >= 5; // approximate with spots
        case 'bar_hopper': return uniqueSpots >= 5;
        case 'night_navigator': return false; // needs map usage tracking
        case 'map_master': return false; // needs filter tracking

        // ── Streak ──
        case 'weekend_warrior': return checkConsecutiveWeekends(attended, 3);
        case 'streak_starter': return checkConsecutiveDays(attended, 3);
        case 'streak_master': return checkConsecutiveDays(attended, 7);
        case 'streak_god': return checkConsecutiveDays(attended, 30);
        case 'rage_mode': return checkConsecutiveNights(attended, 5);

        // ── Vibe ──
        case 'night_owl': return attended.some(e => {
          if (!e.date) return false;
          const h = new Date(e.date).getHours();
          return h >= 0 && h < 6;
        });
        case 'early_bird_rave': return attended.some(e => {
          if (!e.date) return false;
          const h = new Date(e.date).getHours();
          return h < 22 && h >= 12;
        });
        case 'club_king': return totalCheckins >= 10;
        case 'apero_pro': return totalCheckins >= 5;
        case 'afterwork_addict': return attended.some(e => {
          if (!e.date) return false;
          const d = new Date(e.date);
          const day = d.getDay();
          return day >= 1 && day <= 5 && d.getHours() >= 18;
        });
        case 'last_minute_hero': return false; // needs check-in time vs event time comparison
        case 'soldout_survivor': return false; // needs sold-out flag
        case 'dance_floor_conqueror': return false; // needs tag
        case 'dj_whisperer': return totalCheckins >= 5;
        case 'concert_junkie': return totalCheckins >= 5;
        case 'festival_fiend': return false; // needs festival tag
        case 'festival_veteran': return false;
        case 'open_air_addict': return false; // needs outdoor tag
        case 'underground_explorer': return false;
        case 'happy_hour_hustler': return false;
        case 'shot_caller': return false;
        case 'bass_hunter': return false;
        case 'chill_master': return false;
        case 'glow_getter': return false;
        case 'teuf_rookie': return false;
        case 'teuf_veteran': return false;

        // ── Social ──
        case 'crew_leader': return false; // needs group tracking
        case 'social_butterfly': return false;
        case 'party_starter': return false;
        case 'closer': return false;
        case 'sunrise_survivor': return attended.some(e => {
          if (!e.date) return false;
          const h = new Date(e.date).getHours();
          return h >= 4 && h < 7;
        });

        // ── Special ──
        case 'vibe_curator': return false;
        case 'badge_collector': {
          // Count how many other badges are unlocked (avoid circular)
          const count = allBadges.filter(b => b.id !== 'badge_collector' && b.id !== 'badge_hoarder' && isUnlocked(b.id)).length;
          return count >= 10;
        }
        case 'badge_hoarder': {
          const count = allBadges.filter(b => b.id !== 'badge_hoarder' && isUnlocked(b.id)).length;
          return count >= 25;
        }
        case 'vip_shadow': return false;
        case 'freebie_finder': return false;
        case 'budget_boss': return false;
        case 'high_roller': return false;
        case 'moonlighter': return checkFullMoon(attended);
        case 'new_year_raver': return attended.some(e => {
          if (!e.date) return false;
          const d = new Date(e.date);
          return d.getMonth() === 0 && d.getDate() <= 7;
        });

        default: return false;
      }
    }

    return allBadges.map(b => ({ ...b, unlocked: isUnlocked(b.id) }));
  }, [attended]);
}

function checkConsecutiveDays(attended: AttendedEvent[], target: number): boolean {
  if (attended.length < target) return false;
  const days = [...new Set(attended.filter(e => e.date).map(e => {
    const d = new Date(e.date);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }))].sort();
  
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 1) streak++;
    else streak = 1;
    if (streak >= target) return true;
  }
  return streak >= target;
}

function checkConsecutiveNights(attended: AttendedEvent[], target: number): boolean {
  return checkConsecutiveDays(attended, target);
}

function checkConsecutiveWeekends(attended: AttendedEvent[], target: number): boolean {
  if (attended.length < target) return false;
  const weekendWeeks = [...new Set(attended.filter(e => e.date).map(e => {
    const d = new Date(e.date);
    if (d.getDay() === 0 || d.getDay() === 5 || d.getDay() === 6) {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      return weekStart.toISOString().slice(0, 10);
    }
    return null;
  }).filter(Boolean) as string[])].sort();

  let streak = 1;
  for (let i = 1; i < weekendWeeks.length; i++) {
    const prev = new Date(weekendWeeks[i - 1]);
    const curr = new Date(weekendWeeks[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff >= 6 && diff <= 8) streak++;
    else streak = 1;
    if (streak >= target) return true;
  }
  return streak >= target;
}

function checkFullMoon(attended: AttendedEvent[]): boolean {
  // Known full moon dates for 2025-2026 (approximate)
  const fullMoons = [
    '2025-01-13', '2025-02-12', '2025-03-14', '2025-04-13', '2025-05-12', '2025-06-11',
    '2025-07-10', '2025-08-09', '2025-09-07', '2025-10-07', '2025-11-05', '2025-12-04',
    '2026-01-03', '2026-02-01', '2026-03-03', '2026-04-01', '2026-05-01', '2026-05-31',
    '2026-06-29', '2026-07-29', '2026-08-28', '2026-09-26', '2026-10-26', '2026-11-24', '2026-12-24',
  ];
  return attended.some(e => {
    if (!e.date) return false;
    const eventDate = new Date(e.date).toISOString().slice(0, 10);
    return fullMoons.includes(eventDate);
  });
}
