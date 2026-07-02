import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listAccounts, internationalTransfer, type Transaction } from "@/lib/banking.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReceiptDialog } from "@/components/receipt-dialog";
import { formatCurrency, formatAccountNumber } from "@/lib/banking-format";
import { toast } from "sonner";
import { Globe2 } from "lucide-react";

const accountsQO = queryOptions({ queryKey: ["accounts"], queryFn: () => listAccounts() });

export const Route = createFileRoute("/_authenticated/international-transfer")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountsQO),
  component: InternationalTransferPage,
});

function InternationalTransferPage() {
  const { data: accounts } = useSuspenseQuery(accountsQO);
  const queryClient = useQueryClient();
  const fn = useServerFn(internationalTransfer);

  const [from, setFrom] = useState(accounts[0]?.id ?? "");
  const [recipientName, setRecipientName] = useState("");
  const [recipientBank, setRecipientBank] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [country, setCountry] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [receipt, setReceipt] = useState<Transaction | null>(null);

  const mut = useMutation({
    mutationFn: (p: {
      fromAccountId: string;
      amount: number;
      recipientName: string;
      recipientBank: string;
      recipientAccount: string;
      swiftCode: string;
      country: string;
      description?: string;
    }) => fn({ data: p }),
    onSuccess: (res) => {
      toast.success("International transfer submitted");
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
    if (!from) return toast.error("Choose an account");
    if (!(amt > 0)) return toast.error("Enter an amount");
    mut.mutate({
      fromAccountId: from,
      amount: amt,
      recipientName: recipientName.trim(),
      recipientBank: recipientBank.trim(),
      recipientAccount: recipientAccount.trim(),
      swiftCode: swiftCode.trim().toUpperCase(),
      country: country.trim(),
      description: desc.trim() || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
          <Globe2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">International transfer</h1>
          <p className="text-sm text-muted-foreground">Wire money worldwide via SWIFT.</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>From account</Label>
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
            <Label htmlFor="rn">Recipient name</Label>
            <Input id="rn" required value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rb">Bank name</Label>
            <Input id="rb" required value={recipientBank} onChange={(e) => setRecipientBank(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ra">Account number / IBAN</Label>
            <Input id="ra" required value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sw">SWIFT / BIC code</Label>
            <Input id="sw" required minLength={8} maxLength={11} value={swiftCode} onChange={(e) => setSwiftCode(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="co">Recipient country</Label>
            <Input id="co" required value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amt">Amount (USD)</Label>
            <Input id="amt" type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="desc">Note (optional)</Label>
            <Input id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={140} />
          </div>
          <Button type="submit" className="w-full md:col-span-2" disabled={mut.isPending}>
            {mut.isPending ? "Sending…" : "Send international transfer"}
          </Button>
        </form>
      </Card>

      <ReceiptDialog
        transaction={receipt}
        open={receipt !== null}
        onOpenChange={(v) => !v && setReceipt(null)}
        title="International transfer receipt"
      />
    </div>
  );
}
