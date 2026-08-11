-- Fix-wave from the final whole-branch review of new-event-push-notifications.
CREATE TABLE public.notified_events (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  notified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

GRANT ALL ON public.notified_events TO service_role;

ALTER TABLE public.notified_events ENABLE ROW LEVEL SECURITY;
-- Same posture as push_outbox: internal bookkeeping, service-role only, no policies.

CREATE INDEX idx_profiles_preferred_city ON public.profiles (preferred_city);

CREATE OR REPLACE FUNCTION public.handle_new_event_notify()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  short_date TEXT;
BEGIN
  short_date := to_char(NEW.start_time AT TIME ZONE 'Europe/Paris', 'DD/MM à HH24:MI');

  BEGIN
    WITH matched_users AS (
      SELECT p.user_id
      FROM public.profiles p
      JOIN public.notification_preferences np ON np.user_id = p.user_id
      WHERE p.preferred_city = NEW.city
        AND np.new_event_alerts_enabled = true
        AND (np.preferred_genres = '{}' OR np.preferred_genres && NEW.genres)
        AND (np.preferred_vibes = '{}' OR NEW.vibe = ANY(np.preferred_vibes))
        AND EXISTS (SELECT 1 FROM public.push_subscriptions ps WHERE ps.user_id = p.user_id)
        AND NOT EXISTS (
          SELECT 1 FROM public.notified_events ne
          WHERE ne.user_id = p.user_id AND ne.event_id = NEW.id
        )
        AND (
          SELECT count(*) FROM public.push_outbox po
          WHERE po.user_id = p.user_id AND po.created_at > now() - interval '24 hours'
        ) < 5
    ),
    inserted AS (
      INSERT INTO public.push_outbox (user_id, title, body, url)
      SELECT
        user_id,
        '🎉 Nouvel event à ' || NEW.city || ' !',
        NEW.name || ' — ' || short_date,
        '/evenements/' || NEW.id
      FROM matched_users
      RETURNING user_id
    )
    INSERT INTO public.notified_events (user_id, event_id)
    SELECT user_id, NEW.id FROM inserted;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_event_notify failed for event %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_event_notify() FROM PUBLIC, anon, authenticated;