import { describe, it, expect } from 'vitest';
import { buildNotificationPrefsPayload } from '@/lib/notificationPreferencesSync';

describe('buildNotificationPrefsPayload', () => {
  it('disables alerts and clears filters when no tags are selected', () => {
    const result = buildNotificationPrefsPayload([]);
    expect(result).toEqual({
      new_event_alerts_enabled: false,
      preferred_genres: [],
      preferred_vibes: [],
    });
  });

  it('enables alerts and derives genres/vibes from selected tags', () => {
    const result = buildNotificationPrefsPayload(['techno']);
    expect(result.new_event_alerts_enabled).toBe(true);
    expect(result.preferred_genres).toContain('techno');
  });

  it('treats "everything selected" the same as no restriction', () => {
    const all: import('@/hooks/useOnboardingPreferences').InterestTag[] = [
      'techno', 'house', 'hiphop', 'rock', 'concerts', 'bars', 'festivals', 'culture', 'sport', 'afterwork',
    ];
    const result = buildNotificationPrefsPayload(all);
    expect(result.new_event_alerts_enabled).toBe(true);
    expect(result.preferred_genres).toEqual([]);
    expect(result.preferred_vibes).toEqual([]);
  });

  it('does not enable alerts when the selection yields no genre/vibe filter and is not "everything"', () => {
    // 'festivals' only maps to categoryToSources.festival (see FilterBar.tsx) —
    // it contributes nothing to genres or vibes, which are the only dimensions
    // the DB trigger matches on. An empty genres+vibes array reads as "no
    // restriction" server-side, so this selection must not auto-enable alerts.
    const result = buildNotificationPrefsPayload(['festivals']);
    expect(result.preferred_genres).toEqual([]);
    expect(result.preferred_vibes).toEqual([]);
    expect(result.new_event_alerts_enabled).toBe(false);
  });
});
