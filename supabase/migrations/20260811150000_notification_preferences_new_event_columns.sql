-- New-event push notifications: per-user opt-in + genre/vibe match filters.
ALTER TABLE public.notification_preferences
  ADD COLUMN new_event_alerts_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN preferred_genres TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN preferred_vibes TEXT[] NOT NULL DEFAULT '{}';
