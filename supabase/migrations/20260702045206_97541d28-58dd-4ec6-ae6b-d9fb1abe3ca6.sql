
-- Set search_path on generate_account_number and lock down internal helpers
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n TEXT;
BEGIN
  LOOP
    n := lpad((floor(random() * 1000000000)::bigint)::text, 10, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.accounts WHERE account_number = n);
  END LOOP;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_account_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.perform_transfer(UUID, UUID, NUMERIC, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.find_primary_account_by_email(TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.perform_transfer(UUID, UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_primary_account_by_email(TEXT) TO authenticated;
