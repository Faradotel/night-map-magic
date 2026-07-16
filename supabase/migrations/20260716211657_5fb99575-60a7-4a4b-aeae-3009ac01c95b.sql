SELECT net.http_post(
  url := 'https://rhzojoyxldrllxroyyqt.supabase.co/functions/v1/refresh-events',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
  ),
  body := jsonb_build_object('city', 'Grenoble')
);