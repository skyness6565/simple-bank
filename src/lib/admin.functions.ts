import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminAccount = {
  id: string;
  user_id: string;
  name: string;
  account_number: string;
  balance: number;
  is_blocked: boolean;
  created_at: string;
  email: string;
  full_name: string | null;
  username: string | null;
  country: string | null;
  address: string | null;
};

export type AdminTransaction = {
  id: string;
  account_id: string;
  type: "credit" | "debit";
  amount: number;
  description: string | null;
  reference: string | null;
  category: string;
  created_at: string;
  account_number: string;
  owner_email: string;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const isCurrentUserAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    return Boolean(data);
  });

export const adminListAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data: accounts, error } = await context.supabase
      .from("accounts")
      .select("id, user_id, name, account_number, balance, is_blocked, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((accounts ?? []).map((a: any) => a.user_id)));
    const { data: profiles, error: pErr } = await context.supabase
      .from("profiles")
      .select("id, email, full_name, username, country, address")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    if (pErr) throw new Error(pErr.message);

    const pmap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return (accounts ?? []).map((a: any) => {
      const p: any = pmap.get(a.user_id) ?? {};
      return {
        ...a,
        email: p.email ?? "",
        full_name: p.full_name ?? null,
        username: p.username ?? null,
        country: p.country ?? null,
        address: p.address ?? null,
      } as AdminAccount;
    });
  });

export const adminListTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { accountId?: string } | undefined) =>
    z.object({ accountId: z.string().uuid().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("transactions")
      .select("id, account_id, type, amount, description, reference, category, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.accountId) q = q.eq("account_id", data.accountId);
    const { data: txs, error } = await q;
    if (error) throw new Error(error.message);

    const accountIds = Array.from(new Set((txs ?? []).map((t: any) => t.account_id)));
    const { data: accounts } = await context.supabase
      .from("accounts")
      .select("id, account_number, user_id")
      .in("id", accountIds.length ? accountIds : ["00000000-0000-0000-0000-000000000000"]);
    const userIds = Array.from(new Set((accounts ?? []).map((a: any) => a.user_id)));
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    const amap = new Map((accounts ?? []).map((a: any) => [a.id, a]));
    const pmap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return (txs ?? []).map((t: any) => {
      const a: any = amap.get(t.account_id) ?? {};
      const p: any = a.user_id ? pmap.get(a.user_id) : null;
      return {
        ...t,
        account_number: a.account_number ?? "",
        owner_email: p?.email ?? "",
      } as AdminTransaction;
    });
  });

export const adminAdjustBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { accountId: string; delta: number; description?: string; backdatedAt?: string }) =>
    z
      .object({
        accountId: z.string().uuid(),
        delta: z.number().refine((n) => n !== 0, "Delta must be non-zero"),
        description: z.string().max(140).optional(),
        backdatedAt: z.string().datetime().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: ref, error } = await context.supabase.rpc("admin_adjust_balance", {
      _account_id: data.accountId,
      _delta: data.delta,
      _description: data.description ?? "Admin adjustment",
      _backdated_at: data.backdatedAt ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true, reference: ref as string };
  });

export const adminSetBlocked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { accountId: string; blocked: boolean }) =>
    z.object({ accountId: z.string().uuid(), blocked: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.rpc("admin_set_account_blocked", {
      _account_id: data.accountId,
      _blocked: data.blocked,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateTransactionDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { transactionId: string; newDate: string }) =>
    z.object({ transactionId: z.string().uuid(), newDate: z.string().datetime() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.rpc("admin_update_transaction_date", {
      _tx_id: data.transactionId,
      _new_date: data.newDate,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
