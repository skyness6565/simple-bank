import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getMyProfile, getMyCards, listAccounts } from "@/lib/banking.functions";
import { Card } from "@/components/ui/card";
import { AtmCard } from "@/components/atm-card";
import { formatDate, formatFullAccountNumber, formatCurrency } from "@/lib/banking-format";
import { Mail, User, MapPin, Globe, AtSign, Calendar, CreditCard } from "lucide-react";

const profileQO = queryOptions({ queryKey: ["profile"], queryFn: () => getMyProfile() });
const cardsQO = queryOptions({ queryKey: ["cards"], queryFn: () => getMyCards() });
const accountsQO = queryOptions({ queryKey: ["accounts"], queryFn: () => listAccounts() });

export const Route = createFileRoute("/_authenticated/profile")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(profileQO);
    context.queryClient.ensureQueryData(cardsQO);
    context.queryClient.ensureQueryData(accountsQO);
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile } = useSuspenseQuery(profileQO);
  const { data: cards } = useSuspenseQuery(cardsQO);
  const { data: accounts } = useSuspenseQuery(accountsQO);

  if (!profile) return <p className="text-sm text-muted-foreground">Profile not found.</p>;

  const initials = (profile.full_name ?? profile.email).slice(0, 2).toUpperCase();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{profile.full_name ?? "Your profile"}</h1>
          <p className="text-sm text-muted-foreground">
            Member since {formatDate(profile.created_at)}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CreditCard className="h-4 w-4" /> Account & Cards
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Checking account number</p>
            {accounts
              .filter((a) => a.name.toLowerCase().includes("checking"))
              .concat(accounts.filter((a) => !a.name.toLowerCase().includes("checking")))
              .slice(0, 3)
              .map((a) => (
                <div key={a.id} className="mt-2 flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="font-mono text-sm">{formatFullAccountNumber(a.account_number)}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(a.balance)}</p>
                </div>
              ))}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">ATM card (last 4)</p>
            {cards.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No cards yet.</p>}
            {cards.map((c) => (
              <div key={c.id} className="mt-2 flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-b-0">
                <div>
                  <p className="text-sm font-medium">{c.brand}</p>
                  <p className="font-mono text-sm">•••• {c.card_number.slice(-4)}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Exp {String(c.expiry_month).padStart(2, "0")}/{String(c.expiry_year).slice(-2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">Personal details</h2>
          <div className="space-y-3">
            <Field icon={<User className="h-4 w-4" />} label="Full name" value={profile.full_name ?? "—"} />
            <Field icon={<AtSign className="h-4 w-4" />} label="Username" value={profile.username ?? "—"} />
            <Field icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} />
            <Field icon={<Globe className="h-4 w-4" />} label="Country" value={profile.country ?? "—"} />
            <Field icon={<MapPin className="h-4 w-4" />} label="House address" value={profile.address ?? "—"} />
            <Field icon={<Calendar className="h-4 w-4" />} label="Joined" value={formatDate(profile.created_at)} />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">All accounts</h2>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {accounts.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatFullAccountNumber(a.account_number)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(a.balance)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CreditCard className="h-4 w-4" /> Your cards
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <AtmCard key={c.id} card={c} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}
