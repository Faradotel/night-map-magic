ALTER TABLE public.cached_events
  ADD COLUMN IF NOT EXISTS sub_genre text,
  ADD COLUMN IF NOT EXISTS priority smallint NOT NULL DEFAULT 50;

CREATE INDEX IF NOT EXISTS cached_events_priority_start_idx
  ON public.cached_events (priority ASC, start_time ASC);