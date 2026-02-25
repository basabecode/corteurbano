# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev              # Start dev server at http://localhost:3000
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Tests
pnpm test             # All Jest tests (unit + integration + security)
pnpm test:unit        # Unit tests only
pnpm test:integration # Integration tests only
pnpm test:security    # Security tests only
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report (70% threshold required)
pnpm test:e2e         # Playwright end-to-end tests
pnpm test:e2e:ui      # Playwright with UI
pnpm test:a11y        # Accessibility tests

# Other
pnpm test:seed        # Seed test data into Supabase
pnpm test:supabase    # Test Supabase connection
```

## Architecture

**Corte Urbano** is a Next.js 14 (App Router) barbershop appointment booking system with real-time updates via Supabase Realtime and Telegram bot integration.

### Route Groups

- `app/(public)/` — Public landing page, login, booking flow (unauthenticated)
- `app/dashboard/` — Protected routes. The layout (`app/dashboard/layout.tsx`) enforces auth via `createSupabaseServerClient()` and reads the user's `role` from the `profiles` table to set navigation.
  - `app/dashboard/admin/` — Admin dashboard with stats, appointment management, barbers/services CRUD
  - `app/dashboard/customer/` — Customer dashboard with appointment history and upcoming appointments

### Supabase Client Pattern (Critical)

Three distinct clients — never mix them:

| Client                          | File                      | Use When                                                         |
| ------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| `createSupabaseBrowserClient()` | `lib/supabase/client.ts`  | `'use client'` components, Realtime subscriptions                |
| `createSupabaseServerClient()`  | `lib/supabase/server.ts`  | Server Components, `layout.tsx`, Server Actions                  |
| `createSupabaseServiceClient()` | `lib/supabase/service.ts` | API Routes only — bypasses RLS using `SUPABASE_SERVICE_ROLE_KEY` |

Using `createSupabaseServiceClient()` in a client component will throw at runtime because `SUPABASE_SERVICE_ROLE_KEY` is not exposed to the browser.

### API Routes (`app/api/`)

- `booking/create/` — Creates appointments, notifies admin via Telegram, notifies client if linked
- `appointments/update-status/` — Updates appointment status (confirm/cancel/complete)
- `appointments/delete/` — Bulk delete appointments
- `appointments/complete-past/` — Auto-completes past confirmed appointments
- `telegram-webhook/` — Handles Telegram inline button callbacks (`confirm:ID`, `cancel:ID`, `complete:ID`, `noshow:ID`) and `/start` deep-linking for Telegram account linking
- `admin/reports/` — Monthly income/stats reports
- `admin/barbers/` — CRUD for barbers
- `admin/services/` — CRUD for services
- `availability/` — Returns busy time slots

### Database Schema

Three main tables in Supabase (PostgreSQL with RLS):

- **`profiles`** — User data (`role`: `'admin'|'customer'`, `full_name`, `phone`, `telegram_chat_id`)
- **`services`** — Services (`name`, `price`, `duration_minutes`, `image_url`)
- **`barbers`** — Barbers (`name`, `photo_url`, `specialty`, `is_active`)
- **`appointments`** — Bookings with `status`: `pending | confirmed | completed | cancelled`, foreign keys to `client_id` (profiles), `service_id`, `barber_id`

Realtime must be enabled on the `appointments` table in Supabase Dashboard (Database → Replication).

### Telegram Integration

The bot supports two flows:

1. **Admin notifications**: When a booking is created → admin receives message with confirm/cancel buttons → webhook handles callback → client notified if `telegram_chat_id` is set
2. **Account linking**: Client sends `/start TELEFONO_<phone>` or phone number directly → webhook matches `profiles.phone` → updates `telegram_chat_id`

### Input Validation

All API inputs validated with Zod. The main schema is `createBookingSchema` in `lib/validation.ts`. API routes use `createSupabaseServiceClient()` for write operations to bypass RLS when acting on behalf of users.

### Styling

Dark Luxury theme: `slate-950` backgrounds, `amber-500` gold accents, `zinc-100` text. Uses Tailwind CSS 3.3 + Shadcn/UI components from `components/ui/`.

### Test Structure

```
tests/
├── setup/          # jest.config.js, jest.setup.ts, playwright.config.ts, seed-test-data.ts
├── unit/           # Pure logic unit tests
├── integration/    # API route integration tests
├── security/       # Security-focused tests
├── e2e/            # Playwright browser tests
└── usability/      # Accessibility tests
```

Jest uses `ts-jest` with `@/` path alias. Tests are in `node` environment (not jsdom).

### Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_ADMIN_CHAT_ID
NEXT_PUBLIC_SITE_URL
```

### Deployment

Deployed to Vercel (see `vercel.json`). After deploying, register the Telegram webhook:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://<domain>/api/telegram-webhook"
```

# Claude Configuration

Refer to the `.agents.md` file in the root directory for all project rules, technical stack, workflow orchestration, and Git protocols.

All instructions in `.agents.md` apply strictly to this environment. Do not deviate from the "Universal AI Agent Rules" defined there.
