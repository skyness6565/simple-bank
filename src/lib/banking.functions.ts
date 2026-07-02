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
  created_at: string;
};

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
      .select("id, account_id, counterparty_account_id, type, amount, description, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (error) throw new Error(error.message);
    return (rows ?? []) as Transaction[];
  });

export const openAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string }) =>
    z.object({ name: z.string().trim().min(1).max(40) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Generate account number client-side (10 digits) with retry via unique constraint
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
    // Verify both accounts are owned by user
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
    return { ok: true };
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
    // Confirm sender owns the from-account
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
    return { ok: true, recipientName: target.full_name ?? data.recipientEmail };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });
