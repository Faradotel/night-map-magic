-- 1. Restrict event_attendance SELECT to authenticated users only
DROP POLICY IF EXISTS "Users can view own and friends attendance" ON public.event_attendance;

CREATE POLICY "Users can view own and friends attendance"
ON public.event_attendance
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR are_friends(auth.uid(), user_id));

-- 2. Add explicit SELECT policy on storage.objects for the public 'event-images' bucket
DROP POLICY IF EXISTS "Public read access to event-images" ON storage.objects;

CREATE POLICY "Public read access to event-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- 3. Harden friend_requests UPDATE policy with WITH CHECK on immutable fields
DROP POLICY IF EXISTS "Recipients can update requests" ON public.friend_requests;

CREATE POLICY "Recipients can update requests"
ON public.friend_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = to_user_id)
WITH CHECK (
  auth.uid() = to_user_id
  AND status IN ('accepted', 'rejected', 'pending')
);

-- Prevent mutation of from_user_id / to_user_id via trigger
CREATE OR REPLACE FUNCTION public.prevent_friend_request_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.from_user_id IS DISTINCT FROM OLD.from_user_id
     OR NEW.to_user_id IS DISTINCT FROM OLD.to_user_id THEN
    RAISE EXCEPTION 'from_user_id and to_user_id are immutable on friend_requests';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS friend_requests_immutable_parties ON public.friend_requests;
CREATE TRIGGER friend_requests_immutable_parties
BEFORE UPDATE ON public.friend_requests
FOR EACH ROW
EXECUTE FUNCTION public.prevent_friend_request_tampering();