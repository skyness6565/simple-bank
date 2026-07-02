import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listAccounts } from "@/lib/banking.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatAccountNumber, formatDate } from "@/lib/banking-format";
import { Landmark, Send } from "lucide-react";

const accountsQO = queryOptions({ queryKey: ["accounts"], queryFn: () => listAccounts() });

export const Route = createFileRoute("/_authenticated/accounts")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountsQO),
  component: AccountsPage,
});

function AccountsPage() {
  const { data: accounts } = useSuspenseQuery(accountsQO);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">Your Northline checking account.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/local-transfer"><Button variant="outline" className="gap-2"><Landmark className="h-4 w-4" />Transfer</Button></Link>
          <Link to="/send"><Button className="gap-2"><Send className="h-4 w-4" />Send</Button></Link>
        </div>
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
