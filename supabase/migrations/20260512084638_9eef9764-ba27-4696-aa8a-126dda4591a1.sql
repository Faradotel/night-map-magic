
-- ============================================================
-- 1. cached_events: add created_by, fix UPDATE policy, add trigger
-- ============================================================
ALTER TABLE public.cached_events ADD COLUMN IF NOT EXISTS created_by uuid;

DROP POLICY IF EXISTS "Pro users can insert events" ON public.cached_events;
CREATE POLICY "Pro users can insert events" ON public.cached_events
  FOR INSERT TO authenticated
  WITH CHECK (
    (has_role(auth.uid(), 'pro'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
    AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  );

DROP POLICY IF EXISTS "Pro users can update own events" ON public.cached_events;
CREATE POLICY "Pro users can update own events" ON public.cached_events
  FOR UPDATE TO authenticated
  USING (
    (created_by = auth.uid() AND has_role(auth.uid(), 'pro'::app_role))
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    (created_by = auth.uid() AND has_role(auth.uid(), 'pro'::app_role))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP TRIGGER IF EXISTS update_cached_events_updated_at ON public.cached_events;
CREATE TRIGGER update_cached_events_updated_at
  BEFORE UPDATE ON public.cached_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. share_codes: restrict SELECT to owner + secure lookup RPC
-- ============================================================
DROP POLICY IF EXISTS "Anyone authenticated can look up codes" ON public.share_codes;
CREATE POLICY "Users can view own codes" ON public.share_codes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.lookup_share_code(_code text)
RETURNS TABLE(user_id uuid, expires_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sc.user_id, sc.expires_at
  FROM public.share_codes sc
  WHERE sc.code = _code AND sc.expires_at > now()
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.lookup_share_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lookup_share_code(text) TO authenticated;

-- ============================================================
-- 3. Realtime: lock down broadcast/presence channels
-- ============================================================
-- postgres_changes still respect table RLS; this blocks broadcast/presence channel abuse
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users only on own topic" ON realtime.messages;
CREATE POLICY "Authenticated users only on own topic" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    -- Allow only user-scoped topics matching their uid
    (realtime.topic() LIKE 'notifications-' || auth.uid()::text)
    OR (realtime.topic() = 'live-events-pulse')
  );

DROP POLICY IF EXISTS "Authenticated insert on own topic" ON realtime.messages;
CREATE POLICY "Authenticated insert on own topic" ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (realtime.topic() LIKE 'notifications-' || auth.uid()::text)
    OR (realtime.topic() = 'live-events-pulse')
  );

-- ============================================================
-- 4. Storage: remove broad SELECT listing on public event-images bucket
-- (public URLs remain accessible; only listing is restricted)
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;

-- ============================================================
-- 5. Function search_path + revoke EXECUTE on internal helpers
-- ============================================================
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_startup_cron() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_friend_request_accepted() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_attendance_notify() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
