
CREATE POLICY "Admins can insert donation email log"
ON public.donation_email_log FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update donation email log"
ON public.donation_email_log FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));
