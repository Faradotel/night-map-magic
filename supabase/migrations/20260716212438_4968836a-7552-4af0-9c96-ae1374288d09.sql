-- Store a new shared secret in the vault and update the cron to use it.
-- Value is generated in SQL so no one has to expose it manually.
DO $$
DECLARE
  new_secret text := encode(gen_random_bytes(32), 'hex');
BEGIN
  -- Upsert the vault secret
  IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'refresh_events_shared_secret') THEN
    PERFORM vault.update_secret(
      (SELECT id FROM vault.secrets WHERE name = 'refresh_events_shared_secret'),
      new_secret,
      'refresh_events_shared_secret'
    );
  ELSE
    PERFORM vault.create_secret(new_secret, 'refresh_events_shared_secret');
  END IF;
END
$$;