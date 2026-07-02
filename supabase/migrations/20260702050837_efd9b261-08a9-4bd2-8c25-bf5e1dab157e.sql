
REVOKE ALL ON FUNCTION public.generate_reference() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_card_number() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.perform_external_transfer(uuid, numeric, text, text, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.perform_external_transfer(uuid, numeric, text, text, text, text, text, text, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.perform_transfer(uuid, uuid, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_account_number() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.find_primary_account_by_email(text) FROM PUBLIC, anon;
