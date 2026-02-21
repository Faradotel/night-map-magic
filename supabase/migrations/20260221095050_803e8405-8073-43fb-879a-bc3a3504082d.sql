
-- Drop the overly permissive SELECT policy
DROP POLICY "Anyone authenticated can view attendance" ON public.event_attendance;

-- Create restricted SELECT policy: own records + friends' records
CREATE POLICY "Users can view own and friends attendance"
ON public.event_attendance
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.are_friends(auth.uid(), user_id)
);
