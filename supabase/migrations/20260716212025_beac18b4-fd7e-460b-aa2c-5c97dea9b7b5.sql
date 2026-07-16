SELECT net.http_post(
  url := 'https://rhzojoyxldrllxroyyqt.supabase.co/functions/v1/refresh-events',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1)
  ),
  body := jsonb_build_object('city', 'Grenoble')
);