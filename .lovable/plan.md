
# Simple Online Banking

A clean, minimal (light theme) online banking demo backed by Lovable Cloud for real accounts and persistent data.

## Features

1. **Auth** — Email/password sign up & sign in (Google can be added later). On signup, a checking account is auto-created with a $1,000 starter balance.
2. **Dashboard** — Shows account name, account number (masked), current balance, quick actions (Transfer, Send), and 5 most recent transactions.
3. **Accounts page** — List of user's accounts with balances. Ability to open a second account (Savings).
4. **Transactions page** — Full transaction history with date, description, counterparty, amount (+/-), and running type (credit/debit).
5. **Transfer** — Move money between the user's own accounts (dropdown of from/to + amount).
6. **Send money** — Send to another user by their email. If recipient exists, funds move; otherwise show an error.

All amounts in USD, 2-decimal display.

## Design

- Clean & minimal light UI: white background, soft gray borders, generous spacing, Inter font, subtle accent (a calm blue `oklch(0.55 0.15 250)`).
- Simple top navbar: Logo "Northline Bank" · Dashboard · Accounts · Transactions · Sign out.
- Card-based layout using existing shadcn components (Card, Button, Input, Table, Dialog).
- No dark mode toggle (keeping it simple).

## Routes

```
/                         → landing (marketing splash + Sign in / Get started)
/auth                     → sign in / sign up (tabs)
/_authenticated/dashboard → main dashboard
/_authenticated/accounts  → account list + open new account
/_authenticated/transactions → full history
/_authenticated/transfer  → between own accounts
/_authenticated/send      → send to another user by email
```

## Data model (Lovable Cloud)

```
profiles (id uuid PK → auth.users, email text, full_name text, created_at)
accounts (id uuid PK, user_id uuid FK, name text, account_number text unique,
          balance numeric(14,2), created_at)
transactions (id uuid PK, account_id uuid FK, counterparty_account_id uuid null,
              type text ['credit','debit'], amount numeric(14,2),
              description text, created_at)
```

- RLS: users can only read their own profile, accounts, and transactions.
- Trigger `on_auth_user_created` → inserts profile + one checking account with $1,000 seed.
- Transfers/sends handled by a server function using `requireSupabaseAuth`. It performs both sides atomically via an SQL RPC (`public.perform_transfer(from_account, to_account, amount, description)`) that validates ownership of the source account, checks sufficient balance, and writes paired debit/credit rows.

## Technical notes

- Server functions in `src/lib/banking.functions.ts` — `listAccounts`, `listTransactions`, `openAccount`, `transferBetweenOwn`, `sendToEmail`.
- Client uses TanStack Query (`ensureQueryData` in loaders, `useSuspenseQuery` in components).
- Input validation with Zod (positive amounts, max $1,000,000 per transfer, email format).
- Amounts stored as numeric(14,2); UI formats via `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`.

## Out of scope (can add later)

- Real payment rails, external banks, bill pay, cards, statements, 2FA, admin.

Ready to build on approval.
