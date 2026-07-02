import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Account = {
  id: string;
  name: string;
  account_number: string;
  balance: number;
  created_at: string;
};

export type Transaction = {
  id: string;
  account_id: string;
  counterparty_account_id: string | null;
  type: "credit" | "debit";
  amount: number;
  description: string | null;
  reference: string | null;
  category: string;
  recipient_name: string | null;
  recipient_bank: string | null;
  recipient_account: string | null;
  recipient_swift: string | null;
  recipient_country: string | null;
  recipient_routing: string | null;
  created_at: string;
};

export type Card = {
  id: string;
  cardholder_name: string;
  card_number: string;
  cvc: string;
  expiry_month: number;
  expiry_year: number;
  brand: string;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  country: string | null;
  address: string | null;
  created_at: string;
};

const TX_COLS =
  "id, account_id, counterparty_account_id, type, amount, description, reference, category, recipient_name, recipient_bank, recipient_account, recipient_swift, recipient_country, recipient_routing, created_at";

export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("accounts")
      .select("id, name, account_number, balance, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Account[];
  });

export const listTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number }) =>
    z.object({ limit: z.number().int().positive().max(200).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("transactions")
      .select(TX_COLS)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (error) throw new Error(error.message);
    return (rows ?? []) as Transaction[];
  });

export const getTransactionById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("transactions")
      .select(TX_COLS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row as Transaction | null;
  });

export const openAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string }) =>
    z.object({ name: z.string().trim().min(1).max(40) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    for (let i = 0; i < 5; i++) {
      const number = String(Math.floor(Math.random() * 1e10)).padStart(10, "0");
      const { data: row, error } = await context.supabase
        .from("accounts")
        .insert({ user_id: context.userId, name: data.name, account_number: number, balance: 0 })
        .select("id, name, account_number, balance, created_at")
        .single();
      if (!error) return row as Account;
      if (!error.message.toLowerCase().includes("duplicate")) throw new Error(error.message);
    }
    throw new Error("Could not generate account number, please try again");
  });

export const transferBetweenOwn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fromAccountId: string; toAccountId: string; amount: number; description?: string }) =>
    z
      .object({
        fromAccountId: z.string().uuid(),
        toAccountId: z.string().uuid(),
        amount: z.number().positive().max(1_000_000),
        description: z.string().max(140).optional(),
      })
      .refine((v) => v.fromAccountId !== v.toAccountId, { message: "Choose two different accounts" })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error: e1 } = await context.supabase
      .from("accounts")
      .select("id")
      .in("id", [data.fromAccountId, data.toAccountId]);
    if (e1) throw new Error(e1.message);
    if ((rows?.length ?? 0) !== 2) throw new Error("Account not found");

    const { error } = await context.supabase.rpc("perform_transfer", {
      _from_account: data.fromAccountId,
      _to_account: data.toAccountId,
      _amount: data.amount,
      _description: data.description ?? "Transfer between accounts",
    });
    if (error) throw new Error(error.message);

    const { data: tx } = await context.supabase
      .from("transactions")
      .select(TX_COLS)
      .eq("account_id", data.fromAccountId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { ok: true, transaction: tx as Transaction | null };
  });

export const sendToEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fromAccountId: string; recipientEmail: string; amount: number; description?: string }) =>
    z
      .object({
        fromAccountId: z.string().uuid(),
        recipientEmail: z.string().trim().toLowerCase().email().max(255),
        amount: z.number().positive().max(1_000_000),
        description: z.string().max(140).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: from, error: fromErr } = await context.supabase
      .from("accounts")
      .select("id")
      .eq("id", data.fromAccountId)
      .maybeSingle();
    if (fromErr) throw new Error(fromErr.message);
    if (!from) throw new Error("Source account not found");

    const { data: recipient, error: recErr } = await context.supabase.rpc(
      "find_primary_account_by_email",
      { _email: data.recipientEmail },
    );
    if (recErr) throw new Error(recErr.message);
    const target = Array.isArray(recipient) ? recipient[0] : recipient;
    if (!target?.account_id) throw new Error("No user found with that email");
    if (target.user_id === context.userId) throw new Error("Cannot send to yourself; use Transfer instead");

    const { error } = await context.supabase.rpc("perform_transfer", {
      _from_account: data.fromAccountId,
      _to_account: target.account_id,
      _amount: data.amount,
      _description: data.description ?? `Sent to ${data.recipientEmail}`,
    });
    if (error) throw new Error(error.message);

    const { data: tx } = await context.supabase
      .from("transactions")
      .select(TX_COLS)
      .eq("account_id", data.fromAccountId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { ok: true, recipientName: target.full_name ?? data.recipientEmail, transaction: tx as Transaction | null };
  });

const externalSchema = z.object({
  fromAccountId: z.string().uuid(),
  amount: z.number().positive().max(1_000_000),
  recipientName: z.string().trim().min(1).max(120),
  recipientBank: z.string().trim().min(1).max(120),
  recipientAccount: z.string().trim().min(1).max(64),
  description: z.string().max(140).optional(),
});

export const localTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    externalSchema
      .extend({ routingNumber: z.string().trim().min(1).max(32) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: ref, error } = await context.supabase.rpc("perform_external_transfer", {
      _from_account: data.fromAccountId,
      _amount: data.amount,
      _category: "local",
      _recipient_name: data.recipientName,
      _recipient_bank: data.recipientBank,
      _recipient_account: data.recipientAccount,
      _recipient_swift: "",
      _recipient_country: "",
      _recipient_routing: data.routingNumber,
      _description: data.description ?? "",
    });
    if (error) throw new Error(error.message);
    const { data: tx } = await context.supabase
      .from("transactions")
      .select(TX_COLS)
      .eq("reference", ref)
      .maybeSingle();
    return { ok: true, reference: ref as string, transaction: tx as Transaction | null };
  });

export const internationalTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    externalSchema
      .extend({
        swiftCode: z.string().trim().min(8).max(11),
        country: z.string().trim().min(2).max(64),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: ref, error } = await context.supabase.rpc("perform_external_transfer", {
      _from_account: data.fromAccountId,
      _amount: data.amount,
      _category: "international",
      _recipient_name: data.recipientName,
      _recipient_bank: data.recipientBank,
      _recipient_account: data.recipientAccount,
      _recipient_swift: data.swiftCode,
      _recipient_country: data.country,
      _recipient_routing: "",
      _description: data.description ?? "",
    });
    if (error) throw new Error(error.message);
    const { data: tx } = await context.supabase
      .from("transactions")
      .select(TX_COLS)
      .eq("reference", ref)
      .maybeSingle();
    return { ok: true, reference: ref as string, transaction: tx as Transaction | null };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, email, full_name, username, country, address, created_at")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Profile | null;
  });

export const getMyCards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("cards")
      .select("id, cardholder_name, card_number, cvc, expiry_month, expiry_year, brand, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Card[];
  });
