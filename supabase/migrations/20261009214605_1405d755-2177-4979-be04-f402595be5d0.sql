CREATE TABLE public.indexnow_submitted (
  url text PRIMARY KEY,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.indexnow_submitted TO service_role;
ALTER TABLE public.indexnow_submitted ENABLE ROW LEVEL SECURITY;
CREATE INDEX indexnow_submitted_at_idx ON public.indexnow_submitted (submitted_at);