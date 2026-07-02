import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listAccounts, sendToEmail, type Transaction } from "@/lib/banking.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReceiptDialog } from "@/components/receipt-dialog";
import { formatCurrency, formatAccountNumber } from "@/lib/banking-format";
import { toast } from "sonner";

const accountsQO = queryOptions({ queryKey: ["accounts"], queryFn: () => listAccounts() });

export const Route = createFileRoute("/_authenticated/send")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountsQO),
  component: SendPage,
});

function SendPage() {
  const { data: accounts } = useSuspenseQuery(accountsQO);
  const queryClient = useQueryClient();
  const sendFn = useServerFn(sendToEmail);

  const [from, setFrom] = useState(accounts[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [receipt, setReceipt] = useState<Transaction | null>(null);

  const mut = useMutation({
    mutationFn: (p: { fromAccountId: string; recipientEmail: string; amount: number; description?: string }) =>
      sendFn({ data: p }),
    onSuccess: (res) => {
      toast.success(`Sent to ${res.recipientName}`);
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setReceipt(res.transaction);
      setAmount("");
      setDesc("");
      setEmail("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!from) return toast.error("Choose an account");
    if (!(amt > 0)) return toast.error("Enter an amount");
    mut.mutate({ fromAccountId: from, recipientEmail: email.trim(), amount: amt, description: desc.trim() || undefined });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Send money</h1>
        <p className="text-sm text-muted-foreground">
          Send to another Northline customer using their email address.
        </p>
      </div>
      <Card className="p-6">
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
            <Label htmlFor="rcp">Recipient email</Label>
            <Input id="rcp" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amt">Amount (USD)</Label>
            <Input id="amt" type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Note (optional)</Label>
            <Input id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={140} />
          </div>
          <Button type="submit" className="w-full" disabled={mut.isPending}>
            {mut.isPending ? "Sending…" : "Send"}
          </Button>
        </form>
      </Card>
      <ReceiptDialog
        transaction={receipt}
        open={receipt !== null}
        onOpenChange={(v) => !v && setReceipt(null)}
        title="Send money receipt"
      />
    </div>
  );
}
