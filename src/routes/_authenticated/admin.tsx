import { createFileRoute, redirect } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  isCurrentUserAdmin,
  adminListAccounts,
  adminListTransactions,
  adminAdjustBalance,
  adminSetBlocked,
  adminUpdateTransactionDate,
  type AdminAccount,
} from "@/lib/admin.functions";
import { formatCurrency, formatFullAccountNumber, formatDate } from "@/lib/banking-format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Shield, Lock, Unlock, Pencil, Plus, Minus, Calendar } from "lucide-react";

const adminCheckQO = queryOptions({ queryKey: ["admin", "check"], queryFn: () => isCurrentUserAdmin() });
const accountsQO = queryOptions({ queryKey: ["admin", "accounts"], queryFn: () => adminListAccounts() });

export const Route = createFileRoute("/_authenticated/admin")({
  loader: async ({ context }) => {
    const isAdmin = await context.queryClient.ensureQueryData(adminCheckQO);
    if (!isAdmin) throw redirect({ to: "/dashboard" });
    context.queryClient.ensureQueryData(accountsQO);
  },
  component: AdminPage,
});

function AdminPage() {
  const { data: accounts } = useSuspenseQuery(accountsQO);
  const [selected, setSelected] = useState<AdminAccount | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">
            Manage user accounts, balances, and transactions.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Account</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No accounts yet.
                  </td>
                </tr>
              )}
              {accounts.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.full_name ?? a.username ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{a.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {formatFullAccountNumber(a.account_number)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatCurrency(a.balance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {a.is_blocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        <Lock className="h-3 w-3" /> Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelected(a);
                          setAdjustOpen(true);
                        }}
                      >
                        Adjust
                      </Button>
                      <BlockToggle account={a} />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelected(a);
                          setTxOpen(true);
                        }}
                      >
                        Txns
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AdjustDialog account={selected} open={adjustOpen} onOpenChange={setAdjustOpen} />
      <TransactionsDialog account={selected} open={txOpen} onOpenChange={setTxOpen} />
    </div>
  );
}

function BlockToggle({ account }: { account: AdminAccount }) {
  const qc = useQueryClient();
  const setBlocked = useServerFn(adminSetBlocked);
  const m = useMutation({
    mutationFn: (blocked: boolean) => setBlocked({ data: { accountId: account.id, blocked } }),
    onSuccess: (_res, blocked) => {
      toast.success(blocked ? `Account ${account.account_number} blocked` : `Account ${account.account_number} unblocked`);
      qc.invalidateQueries({ queryKey: ["admin", "accounts"] });
    },
    onError: (e) => toast.error(`Failed to update account: ${(e as Error).message}`),
  });
  const willBlock = !account.is_blocked;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant={account.is_blocked ? "outline" : "destructive"} disabled={m.isPending}>
          {account.is_blocked ? (
            <><Unlock className="mr-1 h-3.5 w-3.5" /> Unblock</>
          ) : (
            <><Lock className="mr-1 h-3.5 w-3.5" /> Block</>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{willBlock ? "Block this account?" : "Unblock this account?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {willBlock
              ? `${account.email} will not be able to send or receive transfers on account ${account.account_number}.`
              : `${account.email} will be able to send and receive transfers again on account ${account.account_number}.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => m.mutate(willBlock)}>
            {willBlock ? "Block account" : "Unblock account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AdjustDialog({
  account,
  open,
  onOpenChange,
}: {
  account: AdminAccount | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const adjust = useServerFn(adminAdjustBalance);
  const [mode, setMode] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [backdate, setBackdate] = useState("");

  const m = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("No account");
      const n = Number(amount);
      if (!Number.isFinite(n) || n <= 0) throw new Error("Enter a valid amount");
      const delta = mode === "credit" ? n : -n;
      const backdatedAt = backdate ? new Date(backdate).toISOString() : undefined;
      return adjust({
        data: {
          accountId: account.id,
          delta,
          description: description || undefined,
          backdatedAt,
        },
      });
    },
    onSuccess: (res) => {
      toast.success(
        `${mode === "credit" ? "Credited" : "Debited"} ${formatCurrency(Number(amount))} — ref ${res.reference}`,
      );
      qc.invalidateQueries({ queryKey: ["admin", "accounts"] });
      qc.invalidateQueries({ queryKey: ["admin", "tx"] });
      setAmount("");
      setDescription("");
      setBackdate("");
      onOpenChange(false);
    },
    onError: (e) => toast.error(`Adjustment failed: ${(e as Error).message}`),
  });

  const parsedAmount = Number(amount);
  const canSubmit = Number.isFinite(parsedAmount) && parsedAmount > 0 && !!account;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust balance</DialogTitle>
          <DialogDescription>
            {account ? `${account.email} — ${formatCurrency(account.balance)}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === "credit" ? "default" : "outline"}
              onClick={() => setMode("credit")}
            >
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
            <Button
              type="button"
              variant={mode === "debit" ? "default" : "outline"}
              onClick={() => setMode("debit")}
            >
              <Minus className="mr-1 h-4 w-4" /> Subtract
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amt">Amount (USD)</Label>
            <Input
              id="amt"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Reason / note"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bd" className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Back-date (optional)
            </Label>
            <Input
              id="bd"
              type="datetime-local"
              value={backdate}
              onChange={(e) => setBackdate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the current time.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending}>
            {m.isPending ? "Saving..." : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransactionsDialog({
  account,
  open,
  onOpenChange,
}: {
  account: AdminAccount | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const updateDate = useServerFn(adminUpdateTransactionDate);
  const { data: txs, isLoading } = useQuery({
    queryKey: ["admin", "tx", account?.id ?? "none"],
    queryFn: () => adminListTransactions({ data: { accountId: account?.id } }),
    enabled: open && !!account,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");

  const m = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No transaction");
      return updateDate({
        data: { transactionId: editingId, newDate: new Date(newDate).toISOString() },
      });
    },
    onSuccess: () => {
      toast.success("Transaction date updated");
      qc.invalidateQueries({ queryKey: ["admin", "tx"] });
      setEditingId(null);
      setNewDate("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transactions</DialogTitle>
          <DialogDescription>
            {account ? formatFullAccountNumber(account.account_number) : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && (txs?.length ?? 0) === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No transactions.</p>
          )}
          <ul className="divide-y divide-border">
            {(txs ?? []).map((t) => (
              <li key={t.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {t.description ?? (t.type === "credit" ? "Credit" : "Debit")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(t.created_at)} · {t.category} · {t.reference}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        t.type === "credit"
                          ? "text-sm font-semibold text-emerald-600"
                          : "text-sm font-semibold text-destructive"
                      }
                    >
                      {t.type === "credit" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(t.id);
                        const d = new Date(t.created_at);
                        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                          .toISOString()
                          .slice(0, 16);
                        setNewDate(local);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {editingId === t.id && (
                  <div className="mt-2 flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor={`d-${t.id}`} className="text-xs">
                        New date
                      </Label>
                      <Input
                        id={`d-${t.id}`}
                        type="datetime-local"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                      />
                    </div>
                    <Button size="sm" onClick={() => m.mutate()} disabled={m.isPending}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setNewDate("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
