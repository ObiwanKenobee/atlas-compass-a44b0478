
-- Monthly report audit trail + share tokens
ALTER TABLE public.monthly_reports
  ADD COLUMN IF NOT EXISTS attachment_path text,
  ADD COLUMN IF NOT EXISTS uploaded_by uuid,
  ADD COLUMN IF NOT EXISTS uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by_user uuid,
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS share_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS monthly_reports_share_token_idx ON public.monthly_reports(share_token);

-- Donation email send log
CREATE TABLE IF NOT EXISTS public.donation_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid,
  recipient_email text NOT NULL,
  template_name text NOT NULL DEFAULT 'donation-confirmation',
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  message_id text,
  trigger text NOT NULL DEFAULT 'webhook',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS donation_email_log_donation_idx ON public.donation_email_log(donation_id);
CREATE INDEX IF NOT EXISTS donation_email_log_created_idx ON public.donation_email_log(created_at DESC);

ALTER TABLE public.donation_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view donation email log"
ON public.donation_email_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
