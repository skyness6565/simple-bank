import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, Zap, Wallet, Send, ArrowLeftRight, Globe2,
  Lock, Smartphone, PiggyBank, TrendingUp, Users, Star, Check,
  CreditCard, LineChart, Building2, Headphones
} from "lucide-react";
import bankHero from "@/assets/bank-hero.jpg";
import mobileBanking from "@/assets/mobile-banking.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Northline Bank — Simple online banking in white & blue" },
      { name: "description", content: "Open a Northline account in minutes. Check balances, transfer between accounts, and send money by email — all from one clean dashboard." },
      { property: "og:title", content: "Northline Bank" },
      { property: "og:description", content: "Simple, secure online banking for everyone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Northline Bank</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
            <a href="#accounts" className="text-sm text-muted-foreground hover:text-foreground">Accounts</a>
            <a href="#security" className="text-sm text-muted-foreground hover:text-foreground">Security</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/auth" search={{ mode: "signup" }}><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 pt-16 pb-20 md:grid-cols-2 md:pt-24 md:pb-28">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              FDIC-style demo · $0 monthly fees
            </span>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              Banking, kept <span className="text-primary">refreshingly simple.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Northline is a clean, modern online bank. Open an account in seconds, move money
              between your accounts, and send funds to anyone with just an email.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="gap-2">Open a free account <ArrowLeftRight className="h-4 w-4" /></Button>
              </Link>
              <Link to="/auth"><Button size="lg" variant="outline">Sign in</Button></Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> $1,000 starter balance</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> No hidden fees</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 2‑minute signup</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-primary/20 to-transparent blur-2xl" />
            <img
              src={bankHero}
              alt="Modern Northline Bank building with glass facade"
              width={1600}
              height={1000}
              className="relative rounded-2xl border border-border shadow-2xl shadow-primary/10"
            />
            <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-border bg-card p-4 shadow-lg md:block">
              <p className="text-xs text-muted-foreground">Total balance</p>
              <p className="text-2xl font-semibold">$12,480.55</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                <TrendingUp className="h-3 w-3" /> +2.4% this month
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
          {[
            { k: "250K+", v: "Customers" },
            { k: "$4.1B", v: "Moved safely" },
            { k: "99.99%", v: "Uptime" },
            { k: "4.9/5", v: "App Store rating" },
          ].map((s) => (
            <div key={s.v} className="text-center">
              <p className="text-3xl font-semibold tracking-tight">{s.k}</p>
              <p className="mt-1 text-sm opacity-80">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Everything you need</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">One app. Every money move.</h2>
          <p className="mt-4 text-muted-foreground">
            From daily spending to peer‑to‑peer transfers, Northline handles it all with a calm, focused interface.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Wallet, title: "Clear dashboard", body: "See balances, recent activity and account health in a single glance." },
            { icon: ArrowLeftRight, title: "Instant transfers", body: "Move money between your own accounts the moment you tap send." },
            { icon: Send, title: "Send by email", body: "Pay another Northline customer using only their email address." },
            { icon: PiggyBank, title: "Open new accounts", body: "Spin up a savings or side account in seconds — no paperwork." },
            { icon: LineChart, title: "Live activity feed", body: "Every debit and credit lands in your feed with a friendly description." },
            { icon: ShieldCheck, title: "Bank‑grade security", body: "Row‑level security, atomic transfers and full audit trail on every move." },
          ].map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-medium">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mobile split */}
      <section id="accounts" className="border-y border-border bg-secondary/40">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
          <img
            src={mobileBanking}
            alt="Northline mobile banking on a phone"
            width={1200}
            height={1200}
            loading="lazy"
            className="rounded-2xl border border-border shadow-xl"
          />
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-primary">On the go</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Your bank, in your pocket.</h2>
            <p className="mt-4 text-muted-foreground">
              A responsive web app that works beautifully on any device. Sign in from anywhere,
              transfer instantly, and keep tabs on every account.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Biometric-ready sign in on supported devices",
                "Instant P2P sends to any Northline email",
                "Multi-account view with per-account history",
                "Zero fees on internal transfers, ever",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-foreground">{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex gap-3">
              <Link to="/auth" search={{ mode: "signup" }}><Button size="lg">Create free account</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">How it works</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">Start banking in three steps.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { n: "01", icon: Smartphone, title: "Sign up", body: "Create your account with an email and password. Takes under two minutes." },
            { n: "02", icon: CreditCard, title: "Get your accounts", body: "A Checking account funded with $1,000 is opened automatically." },
            { n: "03", icon: Globe2, title: "Move money", body: "Transfer between your accounts or send to any Northline user by email." },
          ].map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-border bg-card p-6">
              <span className="absolute right-5 top-5 text-xs font-mono text-muted-foreground">{s.n}</span>
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-medium">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security band */}
      <section id="security" className="border-y border-border bg-gradient-to-r from-primary to-[oklch(0.42_0.2_260)] text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3">
          {[
            { icon: Lock, title: "Encrypted end‑to‑end", body: "All traffic is TLS‑protected and credentials are hashed with modern algorithms." },
            { icon: ShieldCheck, title: "Row‑level security", body: "Your data is isolated at the database layer — nobody else can query it." },
            { icon: Zap, title: "Atomic transfers", body: "Every transfer either fully succeeds or is fully rolled back. No lost money." },
          ].map((s) => (
            <div key={s.title}>
              <s.icon className="h-6 w-6 opacity-90" />
              <h3 className="mt-4 text-xl font-medium">{s.title}</h3>
              <p className="mt-2 text-sm opacity-85">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Loved by customers</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">People are switching to Northline.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { name: "Amelia R.", role: "Freelance designer", quote: "Finally a bank that doesn't feel like a spreadsheet from 2004. Sending money to clients is one tap." },
            { name: "Marcus T.", role: "Small business owner", quote: "I opened three accounts to separate taxes, payroll and everyday spend. It took me one minute." },
            { name: "Priya S.", role: "Software engineer", quote: "The dashboard is calm and quick. Exactly what a banking app should feel like." },
          ].map((t) => (
            <figure key={t.name} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex gap-1 text-primary">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <blockquote className="mt-4 text-sm text-foreground">"{t.quote}"</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-primary">FAQ</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Questions, answered.</h2>
            <p className="mt-4 text-muted-foreground">Everything you need to know before opening a Northline account.</p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm text-primary">
              <Headphones className="h-4 w-4" /> Support replies in under 5 minutes
            </div>
          </div>
          <div className="md:col-span-2 divide-y divide-border rounded-2xl border border-border bg-card">
            {[
              { q: "Is this a real bank?", a: "Northline is a demo banking application — accounts and balances are simulated for exploration." },
              { q: "How much does it cost?", a: "Nothing. There are no monthly fees, no transfer fees, and no minimum balance requirements." },
              { q: "How do I send money to another person?", a: "Use the Send page, enter their Northline email and the amount. The funds move instantly." },
              { q: "Can I open more than one account?", a: "Yes. Head to the Accounts page and open as many as you need — savings, tax, everyday, etc." },
              { q: "Is my data secure?", a: "Every table has row‑level security so only you can read your own data. Transfers run inside atomic transactions." },
            ].map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
                  {f.q}
                  <span className="text-primary transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-12">
          <Users className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">Join Northline today.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Every new account starts with a $1,000 demo balance so you can explore transfers and sends right away.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }}><Button size="lg">Open free account</Button></Link>
            <Link to="/auth"><Button size="lg" variant="outline">Sign in</Button></Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="font-semibold">Northline Bank</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Simple, modern banking for everyone.</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="mailto:dj263791@gmail.com" className="text-muted-foreground hover:text-foreground">
                  ✉️ dj263791@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/12024605762"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  💬 WhatsApp: +1 (202) 460-5762
                </a>
              </li>
            </ul>
          </div>

          {[
            { h: "Product", items: ["Dashboard", "Transfers", "Send money", "Accounts"] },
            { h: "Company", items: ["About", "Careers", "Press", "Contact"] },
            { h: "Legal", items: ["Terms", "Privacy", "Security", "Cookies"] },
          ].map((c) => (
            <div key={c.h}>
              <p className="text-sm font-medium">{c.h}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {c.items.map((i) => <li key={i}><a href="#" className="hover:text-foreground">{i}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Northline Bank. Demo application.</p>
            <p>Made with care.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
