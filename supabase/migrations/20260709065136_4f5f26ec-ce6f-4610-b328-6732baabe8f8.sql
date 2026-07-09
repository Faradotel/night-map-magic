
-- Table de suivi de l'indexation Google des pages SEO
CREATE TABLE public.page_index_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  tier SMALLINT,
  first_tracked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_checked_at TIMESTAMPTZ,
  coverage_state TEXT,
  verdict TEXT,
  is_indexed BOOLEAN NOT NULL DEFAULT false,
  last_crawl_time TIMESTAMPTZ,
  google_canonical TEXT,
  user_canonical TEXT,
  retired_at TIMESTAMPTZ,
  retire_reason TEXT,
  check_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_index_status_last_checked ON public.page_index_status (last_checked_at NULLS FIRST);
CREATE INDEX idx_page_index_status_retired ON public.page_index_status (retired_at);
CREATE INDEX idx_page_index_status_tier ON public.page_index_status (tier);
CREATE INDEX idx_page_index_status_coverage ON public.page_index_status (coverage_state);

GRANT SELECT ON public.page_index_status TO authenticated;
GRANT SELECT ON public.page_index_status TO anon;
GRANT ALL ON public.page_index_status TO service_role;

ALTER TABLE public.page_index_status ENABLE ROW LEVEL SECURITY;

-- Lecture publique du champ retired_at pour le hook front (léger)
CREATE POLICY "Anyone can read index status"
  ON public.page_index_status FOR SELECT
  USING (true);

-- Admins seuls peuvent modifier via UI
CREATE POLICY "Admins can update index status"
  ON public.page_index_status FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_page_index_status_updated_at
  BEFORE UPDATE ON public.page_index_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cron : vérif GSC quotidienne (3h) + retrait hebdo (dimanche 4h)
SELECT cron.schedule(
  'gsc-check-index-status-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://rhzojoyxldrllxroyyqt.supabase.co/functions/v1/gsc-check-index-status',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'retire-underperforming-pages-weekly',
  '0 4 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://rhzojoyxldrllxroyyqt.supabase.co/functions/v1/retire-underperforming-pages',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
