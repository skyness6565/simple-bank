
-- 1. Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- 2. Auto-grant admin to the reserved email when verified
CREATE OR REPLACE FUNCTION public.grant_admin_for_reserved_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND lower(NEW.email) = 'piofficialreception@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_reserved_email();

CREATE TRIGGER on_auth_user_confirmed_grant_admin
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_admin_for_reserved_email();

-- If the reserved admin already exists, grant now
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE lower(email) = 'piofficialreception@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Account block flag
ALTER TABLE public.accounts ADD COLUMN is_blocked boolean NOT NULL DEFAULT false;

-- 4. Admin visibility policies
CREATE POLICY "admins select all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins select all accounts" ON public.accounts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins select all transactions" ON public.transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Block-aware transfer guards: replace perform_transfer & perform_external_transfer
CREATE OR REPLACE FUNCTION public.perform_transfer(_from_account uuid, _to_account uuid, _amount numeric, _description text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  from_owner UUID; from_balance NUMERIC; from_blocked BOOLEAN; to_blocked BOOLEAN;
  ref TEXT;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  IF _from_account = _to_account THEN RAISE EXCEPTION 'Source and destination must differ'; END IF;

  SELECT user_id, balance, is_blocked INTO from_owner, from_balance, from_blocked
  FROM public.accounts WHERE id = _from_account FOR UPDATE;

  IF from_owner IS NULL THEN RAISE EXCEPTION 'Source account not found'; END IF;
  IF from_owner <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF from_blocked THEN RAISE EXCEPTION 'Account is blocked. Contact support.'; END IF;
  IF from_balance < _amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;

  SELECT is_blocked INTO to_blocked FROM public.accounts WHERE id = _to_account FOR UPDATE;
  IF to_blocked IS NULL THEN RAISE EXCEPTION 'Destination account not found'; END IF;
  IF to_blocked THEN RAISE EXCEPTION 'Recipient account is blocked'; END IF;

  ref := public.generate_reference();

  UPDATE public.accounts SET balance = balance - _amount WHERE id = _from_account;
  UPDATE public.accounts SET balance = balance + _amount WHERE id = _to_account;

  INSERT INTO public.transactions (account_id, counterparty_account_id, type, amount, description, reference, category)
  VALUES (_from_account, _to_account, 'debit', _amount, _description, ref, 'internal');
  INSERT INTO public.transactions (account_id, counterparty_account_id, type, amount, description, reference, category)
  VALUES (_to_account, _from_account, 'credit', _amount, _description, ref || '-C', 'internal');
END; $$;

CREATE OR REPLACE FUNCTION public.perform_external_transfer(_from_account uuid, _amount numeric, _category text, _recipient_name text, _recipient_bank text, _recipient_account text, _recipient_swift text, _recipient_country text, _recipient_routing text, _description text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE from_owner UUID; from_balance NUMERIC; from_blocked BOOLEAN; ref TEXT;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  IF _category NOT IN ('local','international') THEN RAISE EXCEPTION 'Invalid transfer category'; END IF;

  SELECT user_id, balance, is_blocked INTO from_owner, from_balance, from_blocked
  FROM public.accounts WHERE id = _from_account FOR UPDATE;

  IF from_owner IS NULL THEN RAISE EXCEPTION 'Source account not found'; END IF;
  IF from_owner <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF from_blocked THEN RAISE EXCEPTION 'Account is blocked. Contact support.'; END IF;
  IF from_balance < _amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;

  ref := public.generate_reference();
  UPDATE public.accounts SET balance = balance - _amount WHERE id = _from_account;

  INSERT INTO public.transactions (
    account_id, type, amount, description, reference, category,
    recipient_name, recipient_bank, recipient_account, recipient_swift, recipient_country, recipient_routing
  ) VALUES (
    _from_account, 'debit', _amount,
    COALESCE(_description, _category || ' transfer to ' || _recipient_name),
    ref, _category,
    _recipient_name, _recipient_bank, _recipient_account, _recipient_swift, _recipient_country, _recipient_routing
  );
  RETURN ref;
END; $$;

-- 6. Admin actions (SECURITY DEFINER, gated by has_role)
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(
  _account_id uuid, _delta numeric, _description text, _backdated_at timestamptz
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ref TEXT; tx_type TEXT; abs_amount NUMERIC; cur_balance NUMERIC; when_at TIMESTAMPTZ;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _delta IS NULL OR _delta = 0 THEN RAISE EXCEPTION 'Delta must be non-zero'; END IF;

  SELECT balance INTO cur_balance FROM public.accounts WHERE id = _account_id FOR UPDATE;
  IF cur_balance IS NULL THEN RAISE EXCEPTION 'Account not found'; END IF;
  IF cur_balance + _delta < 0 THEN RAISE EXCEPTION 'Adjustment would make balance negative'; END IF;

  abs_amount := abs(_delta);
  tx_type := CASE WHEN _delta > 0 THEN 'credit' ELSE 'debit' END;
  ref := public.generate_reference();
  when_at := COALESCE(_backdated_at, now());

  UPDATE public.accounts SET balance = balance + _delta WHERE id = _account_id;

  INSERT INTO public.transactions (account_id, type, amount, description, reference, category, created_at)
  VALUES (_account_id, tx_type, abs_amount, COALESCE(_description, 'Admin adjustment'), ref, 'admin', when_at);

  RETURN ref;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_account_blocked(_account_id uuid, _blocked boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.accounts SET is_blocked = _blocked WHERE id = _account_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_update_transaction_date(_tx_id uuid, _new_date timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _new_date IS NULL THEN RAISE EXCEPTION 'Date required'; END IF;
  UPDATE public.transactions SET created_at = _new_date WHERE id = _tx_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
END; $$;
