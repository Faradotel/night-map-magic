-- Drain push_outbox every 5 minutes. Requires a Vault secret named
-- 'push_outbox_shared_secret' holding the same value configured as the
-- PUSH_OUTBOX_SECRET function secret in Task 4 — create it manually (not
-- checked in here):
--   select vault.create_secret('<same-value-as-PUSH_OUTBOX_SECRET>', 'push_outbox_shared_secret', 'Shared secret for process-push-outbox cron calls');
SELECT cron.schedule(
  'push-outbox-every-5min',
  '*/5 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://rhzojoyxldrllxroyyqt.supabase.co/functions/v1/process-push-outbox',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-outbox-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'push_outbox_shared_secret' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $cron$
);
