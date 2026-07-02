import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listAccounts, openAccount } from "@/lib/banking.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatAccountNumber, formatDate } from "@/lib/banking-format";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const accountsQO = queryOptions({ queryKey: ["accounts"], queryFn: () => listAccounts() });

export const Route = createFileRoute("/_authenticated/accounts")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountsQO),
  component: AccountsPage,
});

function AccountsPage() {
  const { data: accounts } = useSuspenseQuery(accountsQO);
  const queryClient = useQueryClient();
  const openFn = useServerFn(openAccount);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Savings");

  const mut = useMutation({
    mutationFn: (n: string) => openFn({ data: { name: n } }),
    onSuccess: () => {
      toast.success("Account opened");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">Manage the accounts you hold with Northline.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Open account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Open a new account</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="acc-name">Account name</Label>
              <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
              <p className="text-xs text-muted-foreground">New accounts start with a $0 balance.</p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => mut.mutate(name)} disabled={mut.isPending || !name.trim()}>
                {mut.isPending ? "Opening…" : "Open account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {accounts.map((a) => (
          <Card key={a.id} className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{a.name}</p>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency(a.balance)}</p>
            <p className="mt-3 text-xs text-muted-foreground">Account · {formatAccountNumber(a.account_number)}</p>
            <p className="text-xs text-muted-foreground">Opened {formatDate(a.created_at)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
