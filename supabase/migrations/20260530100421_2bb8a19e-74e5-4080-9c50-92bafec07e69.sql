-- Remove event_attendance from realtime to prevent friend-attendance leaks to non-friends
ALTER PUBLICATION supabase_realtime DROP TABLE public.event_attendance;

-- Add explicit restrictive deny policies on email tables so authenticated/anon
-- users can never read or write, regardless of any future permissive policy added.
CREATE POLICY "Block non-service read on email_send_log"
ON public.email_send_log AS RESTRICTIVE FOR SELECT
TO authenticated, anon
USING (false);

CREATE POLICY "Block non-service write on email_send_log"
ON public.email_send_log AS RESTRICTIVE FOR ALL
TO authenticated, anon
USING (false) WITH CHECK (false);

CREATE POLICY "Block non-service read on email_unsubscribe_tokens"
ON public.email_unsubscribe_tokens AS RESTRICTIVE FOR SELECT
TO authenticated, anon
USING (false);

CREATE POLICY "Block non-service write on email_unsubscribe_tokens"
ON public.email_unsubscribe_tokens AS RESTRICTIVE FOR ALL
TO authenticated, anon
USING (false) WITH CHECK (false);

CREATE POLICY "Block non-service read on suppressed_emails"
ON public.suppressed_emails AS RESTRICTIVE FOR SELECT
TO authenticated, anon
USING (false);

CREATE POLICY "Block non-service write on suppressed_emails"
ON public.suppressed_emails AS RESTRICTIVE FOR ALL
TO authenticated, anon
USING (false) WITH CHECK (false);