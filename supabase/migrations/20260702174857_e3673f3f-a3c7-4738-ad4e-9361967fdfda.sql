
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  display_name TEXT;
  new_account_id UUID;
  starter_amount NUMERIC := 1000;
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
  VALUES (NEW.id, 'Checking', public.generate_account_number(), starter_amount)
  RETURNING id INTO new_account_id;

  INSERT INTO public.transactions (account_id, type, amount, description, reference, category)
  VALUES (
    new_account_id,
    'credit',
    starter_amount,
    'Welcome bonus — starter balance',
    public.generate_reference(),
    'admin'
  );

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
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
