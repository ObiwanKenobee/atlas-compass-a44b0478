
-- Storage bucket for monthly report attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-attachments', 'report-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read published report attachments
CREATE POLICY "Report attachments are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-attachments');

-- Admins can upload report attachments
CREATE POLICY "Admins can upload report attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'report-attachments' AND public.has_role(auth.uid(), 'admin'));

-- Admins can update report attachments
CREATE POLICY "Admins can update report attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'report-attachments' AND public.has_role(auth.uid(), 'admin'));

-- Admins can delete report attachments
CREATE POLICY "Admins can delete report attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'report-attachments' AND public.has_role(auth.uid(), 'admin'));
