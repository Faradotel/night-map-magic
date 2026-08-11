
-- Outbox queue for push notifications triggered from DB rows (e.g. new events).
-- Decouples row-insert triggers from the actual HTTP send, so a batched upsert
-- (refresh-events runs across 51 cities every 4h) never blocks on webpush calls.
CREATE TABLE public.push_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_push_outbox_pending ON public.push_outbox (created_at) WHERE status = 'pending';

GRANT ALL ON public.push_outbox TO service_role;

ALTER TABLE public.push_outbox ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: this is an internal queue containing notification
-- content per user, read/written only by the service-role edge function
-- (service_role bypasses RLS), same trust boundary as push_subscriptions writes
-- from triggers.