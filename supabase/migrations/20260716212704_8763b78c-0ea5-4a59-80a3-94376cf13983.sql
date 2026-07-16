-- 1) Store the shared secret in vault (same value as REFRESH_EVENTS_SECRET env)
DO $$
DECLARE v text := '270c5638899da63984864cfee03a269e720737fcfdeb583ddd4c4118927ff82e';
BEGIN
  IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'refresh_events_shared_secret') THEN
    PERFORM vault.update_secret((SELECT id FROM vault.secrets WHERE name='refresh_events_shared_secret'), v, 'refresh_events_shared_secret');
  ELSE
    PERFORM vault.create_secret(v, 'refresh_events_shared_secret');
  END IF;
END $$;

-- 2) Reschedule the cron with the shared-secret header instead of the stale service-role key
SELECT cron.unschedule('refresh-events-every-4h');
SELECT cron.schedule(
  'refresh-events-every-4h',
  '0 */4 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://rhzojoyxldrllxroyyqt.supabase.co/functions/v1/refresh-events',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-refresh-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'refresh_events_shared_secret' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $cron$
);

-- 3) Trigger an immediate Grenoble refresh
SELECT net.http_post(
  url := 'https://rhzojoyxldrllxroyyqt.supabase.co/functions/v1/refresh-events',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-refresh-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'refresh_events_shared_secret' LIMIT 1)
  ),
  body := jsonb_build_object('city', 'Grenoble')
);