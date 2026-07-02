# Thanh To Do

A shared household task and petty-cash app for a boss and their staff (driver,
house cleaner, cook, errands). Staff add tasks and request expenses; the boss
(a "master" account) approves or rejects expenses against a shared running
balance in Vietnamese đồng (VND). Mobile-first (installable iPhone PWA), with a
desktop web layout as well.

> This repo was originally an investment-portfolio tracker and was repurposed
> into this todo/petty-cash app. Some vestigial code from the old app may still
> be present — see the audit notes and dead-code inventory before relying on a
> file.

## Features

- **Accounts** — One master (boss) account protected by a PIN, plus passwordless
  staff accounts. Pick your face on the login screen to sign in.
- **Tasks** — Anyone can add Normal or Urgent tasks (Entry tab) and mark them
  complete (Tasks tab). Masters can remove completed tasks.
- **Running Tab (petty cash)** — Master initializes a starting balance. Staff
  request expenses (free-form, quick-add shortcuts, OT, cooking) and top-ups.
  The master approves/rejects; approvals adjust the balance and write an audit
  entry.
- **Calendar** — Schedule and track dated events.
- **History** — Recent activity, monthly summary, and cloud-backed search of any
  past month.
- **Attachments** — Photo/PDF receipts on expenses and tasks.
- **Sync** — Local-first (Zustand + localStorage) with Supabase as the shared
  cloud store; data refreshes across devices when the app regains focus.

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS 4** + **shadcn/ui** (Radix primitives), **lucide-react** icons
- **Zustand** (persisted stores) for state, custom sync layer to **Supabase**
- **bcryptjs** for master PIN hashing
- Deployed on **Railway** (`railway.toml`, health check at `/api/health`)

## Getting Started

```bash
cd frontend
pnpm install
pnpm dev            # http://localhost:3000
```

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Database migrations live in `frontend/lib/supabase/migrations/` (`002`–`009`);
run them in order in the Supabase SQL editor. A Storage bucket named
`attachments` is required for receipts.

## Commands

```bash
pnpm dev            # dev server
pnpm build          # production build
pnpm start          # serve the production build
pnpm lint           # ESLint
pnpm test           # Jest unit tests
npx tsc --noEmit    # type check
```

## Project Structure

```
frontend/
├── app/                    # App Router pages
│   ├── page.tsx            # login / account picker
│   ├── entry/              # add tasks & schedule events
│   ├── tasks/              # task list (post-login landing)
│   ├── calendar/           # scheduled events
│   ├── running-tab/        # petty-cash balance, expenses, approvals, history
│   ├── settings/           # accounts, permissions, data export
│   └── api/health/         # Railway health check
├── components/             # UI (running-tab, tasks, calendar, layout, ui/)
├── stores/                 # Zustand stores (owners, tasks, runningTab, …)
├── lib/supabase/           # client, queries/, sync/, migrations/
└── hooks/                  # auth guard, mobile mode, sync
```

## Security note

There is no server-side authentication: the master PIN is verified in the
browser and Supabase Row Level Security is currently permissive (household trust
model). The Supabase anon key can read/write app tables. Do not store data here
that must be protected from anyone with the app URL. Hardening (server-side auth,
RLS, private receipt storage) is tracked in the audit notes.
```
