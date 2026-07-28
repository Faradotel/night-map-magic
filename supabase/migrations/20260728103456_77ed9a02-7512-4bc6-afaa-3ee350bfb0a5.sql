CREATE TABLE public.city_seo_intros (
  city_slug text NOT NULL PRIMARY KEY,
  city_name text NOT NULL,
  h1 text NOT NULL,
  intro_html text NOT NULL,
  meta_description text NOT NULL,
  model text NOT NULL DEFAULT 'google/gemini-3.6-flash',
  version integer NOT NULL DEFAULT 1,
  events_snapshot jsonb,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.city_seo_intros TO anon, authenticated;
GRANT ALL ON public.city_seo_intros TO service_role;

ALTER TABLE public.city_seo_intros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read city seo intros"
  ON public.city_seo_intros FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage city seo intros"
  ON public.city_seo_intros FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_city_seo_intros_updated_at
  BEFORE UPDATE ON public.city_seo_intros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_city_seo_intros_generated_at ON public.city_seo_intros (generated_at DESC);