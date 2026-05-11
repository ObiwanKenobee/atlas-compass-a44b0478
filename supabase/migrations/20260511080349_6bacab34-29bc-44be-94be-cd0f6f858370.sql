
UPDATE storage.buckets SET public = false WHERE id = 'report-attachments';

DROP POLICY IF EXISTS "Report attachments are publicly readable" ON storage.objects;

-- Only admins can list/read the raw bucket; donors view files via signed URLs generated server/client-side from monthly_reports.attachment_url / share_url.
CREATE POLICY "Admins can read report attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-attachments' AND public.has_role(auth.uid(), 'admin'));
