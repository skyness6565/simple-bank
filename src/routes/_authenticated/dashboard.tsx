import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listAccounts, listTransactions, getMyCards, getMyProfile } from "@/lib/banking.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AtmCard } from "@/components/atm-card";
import {
  formatCurrency,
  formatAccountNumber,
  formatDate,
} from "@/lib/banking-format";
import {
  Send,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Globe2,
  Plus,
  TrendingUp,
  Wallet,
  Sparkles,
} from "lucide-react";

const accountsQO = queryOptions({ queryKey: ["accounts"], queryFn: () => listAccounts() });
const recentTxQO = queryOptions({ queryKey: ["transactions", 6], queryFn: () => listTransactions({ data: { limit: 6 } }) });
const cardsQO = queryOptions({ queryKey: ["cards"], queryFn: () => getMyCards() });
const profileQO = queryOptions({ queryKey: ["profile"], queryFn: () => getMyProfile() });

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(accountsQO);
    context.queryClient.ensureQueryData(recentTxQO);
    context.queryClient.ensureQueryData(cardsQO);
    context.queryClient.ensureQueryData(profileQO);
  },
  component: Dashboard,
});

function Dashboard() {
  const { data: accounts } = useSuspenseQuery(accountsQO);
  const { data: transactions } = useSuspenseQuery(recentTxQO);
  const { data: cards } = useSuspenseQuery(cardsQO);
  const { data: profile } = useSuspenseQuery(profileQO);

  const total = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const income = transactions.filter((t) => t.type === "credit").reduce((s, t) => s + Number(t.amount), 0);
  const spending = transactions.filter((t) => t.type === "debit").reduce((s, t) => s + Number(t.amount), 0);
  const firstName = (profile?.full_name ?? "there").split(" ")[0];

  return (
    <div className="space-y-8">
      {/* Hero balance card */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a2a6c] via-[#1546b8] to-[#3b82f6] p-6 text-white shadow-xl md:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-white/80">
              <Sparkles className="h-4 w-4" /> Welcome back, {firstName}
            </p>
            <p className="mt-4 text-sm uppercase tracking-widest text-white/70">Total balance</p>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight md:text-5xl">{formatCurrency(total)}</h1>
            <p className="mt-2 text-sm text-white/80">
              Across {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/send">
                <Button size="sm" variant="secondary" className="gap-2">
                  <Send className="h-4 w-4" /> Send
                </Button>
              </Link>
              <Link to="/local-transfer">
                <Button size="sm" variant="secondary" className="gap-2">
                  <Landmark className="h-4 w-4" /> Local transfer
                </Button>
              </Link>
              <Link to="/international-transfer">
                <Button size="sm" variant="secondary" className="gap-2">
                  <Globe2 className="h-4 w-4" /> International
                </Button>
              </Link>
            </div>
          </div>
          {cards[0] && (
            <div className="hidden md:block">
              <AtmCard card={cards[0]} />
            </div>
          )}
        </div>
      </section>

      {cards[0] && (
        <div className="md:hidden">
          <AtmCard card={cards[0]} />
        </div>
      )}

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={<Wallet className="h-4 w-4" />} label="Accounts" value={String(accounts.length)} />
        <StatCard
          icon={<ArrowDownRight className="h-4 w-4 text-emerald-600" />}
          label="Money in (recent)"
          value={formatCurrency(income)}
        />
        <StatCard
          icon={<ArrowUpRight className="h-4 w-4 text-rose-600" />}
          label="Money out (recent)"
          value={formatCurrency(spending)}
        />
      </section>

      {/* Accounts + Activity */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Your accounts</h2>
            <Link to="/accounts" className="text-sm text-primary hover:underline">Manage</Link>
          </div>
          <div className="space-y-3">
            {accounts.map((a) => (
              <Card key={a.id} className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{formatAccountNumber(a.account_number)}</p>
                  </div>
                </div>
                <p className="text-lg font-semibold">{formatCurrency(a.balance)}</p>
              </Card>
            ))}
            <Link to="/accounts">
              <Button variant="outline" className="w-full gap-2">
                <Plus className="h-4 w-4" /> Open a new account
              </Button>
            </Link>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Recent transactions</h2>
            <Link to="/transactions" className="text-sm text-primary hover:underline">See all</Link>
          </div>
          <Card>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
                <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
                <p>No transactions yet.</p>
                <p className="text-xs">Try a transfer or send money to get started.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {transactions.map((t) => {
                  const acct = accounts.find((a) => a.id === t.account_id);
                  const isCredit = t.type === "credit";
                  return (
                    <li key={t.id} className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid h-9 w-9 place-items-center rounded-full ${
                            isCredit ? "bg-emerald-100 text-emerald-700" : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {isCredit ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {t.recipient_name ?? t.description ?? (isCredit ? "Credit" : "Debit")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {acct?.name ?? "Account"} · {formatDate(t.created_at)}
                            {t.category !== "internal" && ` · ${t.category}`}
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
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  );
}
