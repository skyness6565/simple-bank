import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listAccounts, listTransactions } from "@/lib/banking.functions";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/banking-format";

const accountsQO = queryOptions({ queryKey: ["accounts"], queryFn: () => listAccounts() });
const allTxQO = queryOptions({ queryKey: ["transactions", 200], queryFn: () => listTransactions({ data: { limit: 200 } }) });

export const Route = createFileRoute("/_authenticated/transactions")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(accountsQO);
    context.queryClient.ensureQueryData(allTxQO);
  },
  component: TxPage,
});

function TxPage() {
  const { data: accounts } = useSuspenseQuery(accountsQO);
  const { data: transactions } = useSuspenseQuery(allTxQO);
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "Account";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">Every movement of money across your accounts.</p>
      </div>
      <Card>
        {transactions.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No transactions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Account</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((t) => {
                  const isCredit = t.type === "credit";
                  return (
                    <tr key={t.id}>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(t.created_at)}</td>
                      <td className="px-5 py-3">{t.description ?? (isCredit ? "Credit" : "Debit")}</td>
                      <td className="px-5 py-3 text-muted-foreground">{accountName(t.account_id)}</td>
                      <td className={`px-5 py-3 text-right font-medium ${isCredit ? "text-emerald-700" : "text-foreground"}`}>
                        {isCredit ? "+" : "−"}
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
