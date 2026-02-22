
-- Create cached_events table to store pre-fetched events
CREATE TABLE public.cached_events (
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  vibe TEXT NOT NULL,
  genres TEXT[] NOT NULL DEFAULT '{}',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  price_range TEXT NOT NULL DEFAULT '€10-20',
  description TEXT NOT NULL DEFAULT '',
  venue TEXT NOT NULL DEFAULT '',
  ticket_url TEXT,
  image_color TEXT NOT NULL DEFAULT '#1a0f2e',
  source TEXT NOT NULL DEFAULT 'shotgun',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS but allow public read (events are public data)
ALTER TABLE public.cached_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached events"
ON public.cached_events
FOR SELECT
USING (true);

-- Only service role can insert/update/delete (via edge function)
-- No INSERT/UPDATE/DELETE policies for anon = only service_role can write

-- Create index for city-based queries
CREATE INDEX idx_cached_events_city ON public.cached_events (city);
CREATE INDEX idx_cached_events_start_time ON public.cached_events (start_time);
