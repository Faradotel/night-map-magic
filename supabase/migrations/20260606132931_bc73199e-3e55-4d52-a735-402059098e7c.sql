
-- 1. email_send_state: add restrictive deny policies for anon/authenticated
CREATE POLICY "Deny anon access to email_send_state"
ON public.email_send_state AS RESTRICTIVE
FOR ALL TO anon
USING (false) WITH CHECK (false);

CREATE POLICY "Deny authenticated access to email_send_state"
ON public.email_send_state AS RESTRICTIVE
FOR ALL TO authenticated
USING (false) WITH CHECK (false);

-- 2. event-images: only owner (or admin) can delete
DROP POLICY IF EXISTS "Pro users can delete own event images" ON storage.objects;
CREATE POLICY "Owners or admins can delete event images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'event-images'
  AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
);

-- 3. friend_requests: recipients can't reset to pending
DROP POLICY IF EXISTS "Recipients can update requests" ON public.friend_requests;
CREATE POLICY "Recipients can update requests"
ON public.friend_requests FOR UPDATE TO authenticated
USING (auth.uid() = to_user_id)
WITH CHECK (
  auth.uid() = to_user_id
  AND status = ANY (ARRAY['accepted'::text, 'rejected'::text])
);
