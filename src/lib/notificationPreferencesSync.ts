import { supabase } from '@/integrations/supabase/client';
import { InterestTag, INTEREST_TAG_OPTIONS, tagsToFilterPatch } from '@/hooks/useOnboardingPreferences';

export function buildNotificationPrefsPayload(tags: InterestTag[]) {
  const { genres, vibes } = tagsToFilterPatch(tags);
  // A tag selection maps to genres/vibes via tagsToFilterPatch; some tags (e.g.
  // "festivals") only constrain the client-side `sources` dimension, which isn't
  // persisted or matched server-side. Without a real genre/vibe constraint, an
  // empty array reads as "no restriction" to the DB trigger — so only auto-enable
  // alerts when the selection actually constrains something, or the user
  // deliberately selected everything (an explicit "no restriction" choice).
  const selectedEverything = tags.length >= INTEREST_TAG_OPTIONS.length;
  const hasFilter = genres.length > 0 || vibes.length > 0;
  return {
    new_event_alerts_enabled: tags.length > 0 && (hasFilter || selectedEverything),
    preferred_genres: genres,
    preferred_vibes: vibes,
  };
}

export async function syncPreferredCity(userId: string, cityName: string): Promise<void> {
  await supabase.from('profiles').update({ preferred_city: cityName }).eq('user_id', userId);
}

export interface SyncOnboardingPreferencesInput {
  userId: string;
  cityName: string | null;
  tags: InterestTag[];
}

// Called both at the end of first-run onboarding and after "edit preferences"
// from the profile screen (both funnel through Index.tsx's handleOnboardingComplete).
// Upsert (not update): handle_new_user creates a notification_preferences row
// at signup, but we don't want a silent no-op for any account that predates
// that trigger or otherwise lacks a row.
export async function syncOnboardingPreferences({ userId, cityName, tags }: SyncOnboardingPreferencesInput): Promise<void> {
  const { new_event_alerts_enabled, preferred_genres, preferred_vibes } = buildNotificationPrefsPayload(tags);
  const notificationPrefsPayload: Record<string, unknown> = { user_id: userId, preferred_genres, preferred_vibes };
  if (new_event_alerts_enabled) {
    // Onboarding can opt a user IN when their tags imply real interest, but never
    // opts them OUT — turning alerts off is the profile toggle's job alone, so a
    // user who disabled it there doesn't get silently re-enabled by editing tags.
    notificationPrefsPayload.new_event_alerts_enabled = true;
  }
  await Promise.all([
    cityName
      ? supabase.from('profiles').update({ preferred_city: cityName }).eq('user_id', userId)
      : Promise.resolve(),
    supabase.from('notification_preferences').upsert(notificationPrefsPayload, { onConflict: 'user_id' }),
  ]);
}
