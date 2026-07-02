import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Zap, Wallet } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary" />
            <span className="text-lg font-semibold tracking-tight">Northline Bank</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-24 pb-16 text-center">
        <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">
          Banking, kept simple.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Check your balance, move money between accounts, and send funds to anyone —
          all from one clean, focused dashboard.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button size="lg">Open a free account</Button>
          </Link>
          <Link to="/auth">
            <Button size="lg" variant="outline">Sign in</Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Every new account starts with a $1,000 demo balance.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 pb-24 md:grid-cols-3">
        {[
          { icon: Wallet, title: "One clear dashboard", body: "See your balance and recent activity at a glance." },
          { icon: Zap, title: "Instant transfers", body: "Move money between your accounts in a single tap." },
          { icon: ShieldCheck, title: "Secure by default", body: "Bank-grade authentication and row-level security." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-6">
            <f.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-4 text-base font-medium">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
