
-- 1. Cards table
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cardholder_name TEXT NOT NULL,
  card_number TEXT NOT NULL UNIQUE,
  cvc TEXT NOT NULL,
  expiry_month INT NOT NULL,
  expiry_year INT NOT NULL,
  brand TEXT NOT NULL DEFAULT 'Northline Debit',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.cards TO authenticated;
GRANT ALL ON public.cards TO service_role;

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cards owner select" ON public.cards
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "cards owner insert" ON public.cards
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 2. Add columns to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS reference TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS recipient_bank TEXT,
  ADD COLUMN IF NOT EXISTS recipient_account TEXT,
  ADD COLUMN IF NOT EXISTS recipient_swift TEXT,
  ADD COLUMN IF NOT EXISTS recipient_country TEXT,
  ADD COLUMN IF NOT EXISTS recipient_routing TEXT;

-- 3. Generate a reference code
CREATE OR REPLACE FUNCTION public.generate_reference()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r TEXT;
BEGIN
  LOOP
    r := 'NL' || to_char(now(), 'YYMMDD') || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.transactions WHERE reference = r);
  END LOOP;
  RETURN r;
END; $$;

-- 4. Generate a unique 16-digit card number
CREATE OR REPLACE FUNCTION public.generate_card_number()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n TEXT;
BEGIN
  LOOP
    n := '4' || lpad((floor(random() * 1e15)::bigint)::text, 15, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.cards WHERE card_number = n);
  END LOOP;
  RETURN n;
END; $$;

-- 5. Update handle_new_user: $0 starter balance + auto-generate card
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE display_name TEXT;
BEGIN
  display_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, email, full_name, username, country, address)
  VALUES (
    NEW.id,
    NEW.email,
    display_name,
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    NULLIF(NEW.raw_user_meta_data->>'country', ''),
    NULLIF(NEW.raw_user_meta_data->>'address', '')
  );

  INSERT INTO public.accounts (user_id, name, account_number, balance)
  VALUES (NEW.id, 'Checking', public.generate_account_number(), 0);

  INSERT INTO public.cards (user_id, cardholder_name, card_number, cvc, expiry_month, expiry_year)
  VALUES (
    NEW.id,
    upper(display_name),
    public.generate_card_number(),
    lpad((floor(random() * 1000)::int)::text, 3, '0'),
    1 + floor(random() * 12)::int,
    extract(year from now())::int + 4
  );

  RETURN NEW;
END; $$;

-- Ensure trigger exists (created earlier; recreate to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Update perform_transfer to auto-generate reference (unified pair share same reference)
CREATE OR REPLACE FUNCTION public.perform_transfer(_from_account uuid, _to_account uuid, _amount numeric, _description text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  from_owner UUID;
  from_balance NUMERIC;
  ref TEXT;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  IF _from_account = _to_account THEN RAISE EXCEPTION 'Source and destination must differ'; END IF;

  SELECT user_id, balance INTO from_owner, from_balance
  FROM public.accounts WHERE id = _from_account FOR UPDATE;

  IF from_owner IS NULL THEN RAISE EXCEPTION 'Source account not found'; END IF;
  IF from_owner <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF from_balance < _amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;

  PERFORM 1 FROM public.accounts WHERE id = _to_account FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Destination account not found'; END IF;

  ref := public.generate_reference();

  UPDATE public.accounts SET balance = balance - _amount WHERE id = _from_account;
  UPDATE public.accounts SET balance = balance + _amount WHERE id = _to_account;

  INSERT INTO public.transactions (account_id, counterparty_account_id, type, amount, description, reference, category)
  VALUES (_from_account, _to_account, 'debit', _amount, _description, ref, 'internal');
  INSERT INTO public.transactions (account_id, counterparty_account_id, type, amount, description, reference, category)
  VALUES (_to_account, _from_account, 'credit', _amount, _description, ref || '-C', 'internal');
END; $$;

-- 7. External transfer function (local or international)
CREATE OR REPLACE FUNCTION public.perform_external_transfer(
  _from_account uuid,
  _amount numeric,
  _category text,
  _recipient_name text,
  _recipient_bank text,
  _recipient_account text,
  _recipient_swift text,
  _recipient_country text,
  _recipient_routing text,
  _description text
)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  from_owner UUID;
  from_balance NUMERIC;
  ref TEXT;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  IF _category NOT IN ('local','international') THEN RAISE EXCEPTION 'Invalid transfer category'; END IF;

  SELECT user_id, balance INTO from_owner, from_balance
  FROM public.accounts WHERE id = _from_account FOR UPDATE;

  IF from_owner IS NULL THEN RAISE EXCEPTION 'Source account not found'; END IF;
  IF from_owner <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
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
