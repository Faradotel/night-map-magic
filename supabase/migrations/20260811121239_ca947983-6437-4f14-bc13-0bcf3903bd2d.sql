-- Mirrors handle_attendance_notify's shape but writes to the push_outbox queue
-- instead of calling net.http_post synchronously, since this fires per-row
-- inside refresh-events' batched upserts across 51 cities.
CREATE OR REPLACE FUNCTION public.handle_new_event_notify()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  short_date TEXT;
BEGIN
  short_date := to_char(NEW.start_time AT TIME ZONE 'Europe/Paris', 'DD/MM à HH24:MI');

  INSERT INTO public.push_outbox (user_id, title, body, url)
  SELECT
    p.user_id,
    '🎉 Nouvel event à ' || NEW.city || ' !',
    NEW.name || ' — ' || short_date,
    '/evenements/' || NEW.id
  FROM public.profiles p
  JOIN public.notification_preferences np ON np.user_id = p.user_id
  WHERE p.preferred_city = NEW.city
    AND np.new_event_alerts_enabled = true
    AND (np.preferred_genres = '{}' OR np.preferred_genres && NEW.genres)
    AND (np.preferred_vibes = '{}' OR NEW.vibe = ANY(np.preferred_vibes))
    AND EXISTS (SELECT 1 FROM public.push_subscriptions ps WHERE ps.user_id = p.user_id);

  RETURN NEW;
END;
$$;

-- WHEN clause: skip the function call entirely for events outside the 7-day
-- window, so past/far-future events never touch the outbox.
CREATE TRIGGER on_cached_event_created
  AFTER INSERT ON public.cached_events
  FOR EACH ROW
  WHEN (NEW.city IS NOT NULL AND NEW.start_time BETWEEN now() AND now() + interval '7 days')
  EXECUTE FUNCTION public.handle_new_event_notify();

REVOKE EXECUTE ON FUNCTION public.handle_new_event_notify() FROM PUBLIC, anon, authenticated;