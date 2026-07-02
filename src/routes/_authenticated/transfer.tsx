import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listAccounts, transferBetweenOwn, type Transaction } from "@/lib/banking.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReceiptDialog } from "@/components/receipt-dialog";
import { formatCurrency, formatAccountNumber } from "@/lib/banking-format";
import { toast } from "sonner";

const accountsQO = queryOptions({ queryKey: ["accounts"], queryFn: () => listAccounts() });

export const Route = createFileRoute("/_authenticated/transfer")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountsQO),
  component: TransferPage,
});

function TransferPage() {
  const { data: accounts } = useSuspenseQuery(accountsQO);
  const queryClient = useQueryClient();
  const transferFn = useServerFn(transferBetweenOwn);

  const [from, setFrom] = useState(accounts[0]?.id ?? "");
  const [to, setTo] = useState(accounts[1]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [receipt, setReceipt] = useState<Transaction | null>(null);

  const mut = useMutation({
    mutationFn: (payload: { fromAccountId: string; toAccountId: string; amount: number; description?: string }) =>
      transferFn({ data: payload }),
    onSuccess: (res) => {
      toast.success("Transfer complete");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setReceipt(res.transaction);
      setAmount("");
      setDesc("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!from || !to) return toast.error("Choose both accounts");
    if (from === to) return toast.error("Choose two different accounts");
    if (!(amt > 0)) return toast.error("Enter an amount");
    mut.mutate({ fromAccountId: from, toAccountId: to, amount: amt, description: desc.trim() || undefined });
  }

  const canTransfer = accounts.length >= 2;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transfer between accounts</h1>
        <p className="text-sm text-muted-foreground">Move money instantly between your own accounts.</p>
      </div>
      <Card className="p-6">
        {!canTransfer ? (
          <p className="text-sm text-muted-foreground">
            You need at least two accounts to transfer. Open a second account on the Accounts page.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} {formatAccountNumber(a.account_number)} · {formatCurrency(a.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {accounts.filter((a) => a.id !== from).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} {formatAccountNumber(a.account_number)} · {formatCurrency(a.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amt">Amount (USD)</Label>
              <Input id="amt" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Note (optional)</Label>
              <Input id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={140} />
            </div>
            <Button type="submit" className="w-full" disabled={mut.isPending}>
              {mut.isPending ? "Transferring…" : "Transfer"}
            </Button>
          </form>
        )}
      </Card>
      <ReceiptDialog
        transaction={receipt}
        open={receipt !== null}
        onOpenChange={(v) => !v && setReceipt(null)}
        title="Transfer receipt"
      />
    </div>
  );
}
