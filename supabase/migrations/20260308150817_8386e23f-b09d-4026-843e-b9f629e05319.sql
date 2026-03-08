CREATE OR REPLACE FUNCTION public.get_event_attendance_count(_event_id text)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*) FROM public.event_attendance WHERE event_id = _event_id
$$;