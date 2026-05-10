
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
  ADD COLUMN IF NOT EXISTS receipt_url text,
  ADD COLUMN IF NOT EXISTS failure_reason text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

CREATE INDEX IF NOT EXISTS donations_status_idx ON public.donations(status);
CREATE INDEX IF NOT EXISTS donations_stripe_session_idx ON public.donations(stripe_session_id);
CREATE INDEX IF NOT EXISTS donations_stripe_pi_idx ON public.donations(stripe_payment_intent_id);

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  type text NOT NULL,
  donation_id uuid REFERENCES public.donations(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stripe_events_donation_idx ON public.stripe_events(donation_id);
CREATE INDEX IF NOT EXISTS stripe_events_type_idx ON public.stripe_events(type);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stripe events"
  ON public.stripe_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.monthly_reports
  ADD COLUMN IF NOT EXISTS share_url text,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_by text;
