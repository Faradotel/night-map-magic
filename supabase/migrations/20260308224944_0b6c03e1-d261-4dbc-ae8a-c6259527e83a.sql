
-- Table to store user event passes (QR codes/tickets)
CREATE TABLE public.event_passes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  qr_data TEXT, -- decoded QR code content
  image_path TEXT, -- storage path to the pass image
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

ALTER TABLE public.event_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own passes"
ON public.event_passes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add passes"
ON public.event_passes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own passes"
ON public.event_passes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Storage bucket for pass images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-passes', 'event-passes', false);

-- Storage RLS: users can upload to their own folder
CREATE POLICY "Users can upload own passes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-passes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own passes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'event-passes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own passes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-passes' AND (storage.foldername(name))[1] = auth.uid()::text);
