
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Accounts
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_number TEXT NOT NULL UNIQUE,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts owner select" ON public.accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "accounts owner insert" ON public.accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON public.accounts(user_id);

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  counterparty_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('credit','debit')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions owner select" ON public.transactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid()));
CREATE INDEX ON public.transactions(account_id, created_at DESC);

-- Account number generator
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE n TEXT;
BEGIN
  LOOP
    n := lpad((floor(random() * 1000000000)::bigint)::text, 10, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.accounts WHERE account_number = n);
  END LOOP;
  RETURN n;
END;
$$;

-- Signup trigger: create profile + starter checking account with $1000
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.accounts (user_id, name, account_number, balance)
  VALUES (NEW.id, 'Checking', public.generate_account_number(), 1000.00);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atomic transfer function
CREATE OR REPLACE FUNCTION public.perform_transfer(
  _from_account UUID,
  _to_account UUID,
  _amount NUMERIC,
  _description TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  from_owner UUID;
  from_balance NUMERIC;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  IF _from_account = _to_account THEN
    RAISE EXCEPTION 'Source and destination must differ';
  END IF;

  SELECT user_id, balance INTO from_owner, from_balance
  FROM public.accounts WHERE id = _from_account FOR UPDATE;

  IF from_owner IS NULL THEN RAISE EXCEPTION 'Source account not found'; END IF;
  IF from_owner <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF from_balance < _amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;

  PERFORM 1 FROM public.accounts WHERE id = _to_account FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Destination account not found'; END IF;

  UPDATE public.accounts SET balance = balance - _amount WHERE id = _from_account;
  UPDATE public.accounts SET balance = balance + _amount WHERE id = _to_account;

  INSERT INTO public.transactions (account_id, counterparty_account_id, type, amount, description)
  VALUES (_from_account, _to_account, 'debit', _amount, _description);
  INSERT INTO public.transactions (account_id, counterparty_account_id, type, amount, description)
  VALUES (_to_account, _from_account, 'credit', _amount, _description);
END;
$$;

GRANT EXECUTE ON FUNCTION public.perform_transfer(UUID, UUID, NUMERIC, TEXT) TO authenticated;

-- Lookup account for send-by-email (security definer, minimal fields)
CREATE OR REPLACE FUNCTION public.find_primary_account_by_email(_email TEXT)
RETURNS TABLE(account_id UUID, user_id UUID, full_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, p.id, p.full_name
  FROM public.profiles p
  JOIN public.accounts a ON a.user_id = p.id
  WHERE lower(p.email) = lower(_email)
  ORDER BY a.created_at ASC
  LIMIT 1;
END;
$$;
GRANT EXECUTE ON FUNCTION public.find_primary_account_by_email(TEXT) TO authenticated;
