import { supabase } from '@/integrations/supabase/client';
import { InterestTag, tagsToFilterPatch } from '@/hooks/useOnboardingPreferences';

export function buildNotificationPrefsPayload(tags: InterestTag[]) {
  const { genres, vibes } = tagsToFilterPatch(tags);
  return {
    new_event_alerts_enabled: tags.length > 0,
    preferred_genres: genres,
    preferred_vibes: vibes,
  };
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
  const payload = buildNotificationPrefsPayload(tags);
  await Promise.all([
    cityName
      ? supabase.from('profiles').update({ preferred_city: cityName }).eq('user_id', userId)
      : Promise.resolve(),
    supabase.from('notification_preferences').upsert({ user_id: userId, ...payload }, { onConflict: 'user_id' }),
  ]);
}
