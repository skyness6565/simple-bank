import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listAccounts, listTransactions } from "@/lib/banking.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatAccountNumber, formatDate } from "@/lib/banking-format";
import { ArrowLeftRight, Send, ArrowDownRight, ArrowUpRight } from "lucide-react";

const accountsQO = queryOptions({ queryKey: ["accounts"], queryFn: () => listAccounts() });
const recentTxQO = queryOptions({ queryKey: ["transactions", 5], queryFn: () => listTransactions({ data: { limit: 5 } }) });

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(accountsQO);
    context.queryClient.ensureQueryData(recentTxQO);
  },
  component: Dashboard,
});

function Dashboard() {
  const { data: accounts } = useSuspenseQuery(accountsQO);
  const { data: transactions } = useSuspenseQuery(recentTxQO);
  const total = accounts.reduce((s, a) => s + Number(a.balance), 0);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm text-muted-foreground">Total balance</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">{formatCurrency(total)}</h1>
        <div className="mt-4 flex gap-2">
          <Link to="/transfer"><Button size="sm" className="gap-2"><ArrowLeftRight className="h-4 w-4" />Transfer</Button></Link>
          <Link to="/send"><Button size="sm" variant="outline" className="gap-2"><Send className="h-4 w-4" />Send</Button></Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Your accounts</h2>
          <Link to="/accounts" className="text-sm text-primary hover:underline">Manage</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {accounts.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{formatAccountNumber(a.account_number)}</p>
                </div>
                <p className="text-xl font-semibold">{formatCurrency(a.balance)}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Recent activity</h2>
          <Link to="/transactions" className="text-sm text-primary hover:underline">See all</Link>
        </div>
        <Card>
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No transactions yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {transactions.map((t) => {
                const acct = accounts.find((a) => a.id === t.account_id);
                const isCredit = t.type === "credit";
                return (
                  <li key={t.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`grid h-9 w-9 place-items-center rounded-full ${isCredit ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {isCredit ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.description ?? (isCredit ? "Credit" : "Debit")}</p>
                        <p className="text-xs text-muted-foreground">
                          {acct?.name ?? "Account"} · {formatDate(t.created_at)}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-medium ${isCredit ? "text-emerald-700" : "text-foreground"}`}>
                      {isCredit ? "+" : "−"}
                      {formatCurrency(t.amount)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
