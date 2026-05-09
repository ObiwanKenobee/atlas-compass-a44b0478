-- Lock down SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Tighten donation insert
DROP POLICY IF EXISTS "Anyone can create a donation record" ON public.donations;
CREATE POLICY "Guests or members can create their own donation"
  ON public.donations FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());