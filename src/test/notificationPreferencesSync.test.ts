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
});
