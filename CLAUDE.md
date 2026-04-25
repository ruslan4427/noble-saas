@AGENTS.md

# Noble SaaS — Project Brief for Claude

Multi-tenant barbershop booking SaaS. Salon owners get a dashboard + a public booking page at `/salon/[slug]`.

---

## Stack

- **Next.js 16.2.3** — App Router, async `params: Promise<{slug}>`, no `getServerSideProps`
- **React 19**, **TypeScript 5**, **Tailwind CSS v4** (no `tailwind.config.js`, uses `@theme` in CSS)
- **Supabase** (`@supabase/supabase-js` ^2.102, `@supabase/ssr` ^0.10)
- **Stripe** ^22 — subscriptions (starter $19 / pro $39 / business $79)
- **Resend** ^6 — transactional email
- **Twilio** ^5 — SMS reminders
- **Sentry** — error tracking via `src/lib/logger.ts`
- **Fonts**: Geist Sans + Geist Mono via `next/font/google`

---

## Two Supabase Clients — Never Mix Them

**Browser client** — `src/lib/supabase.ts` — use in `'use client'` components only:
```ts
import { createClient } from '@/lib/supabase'
const supabase = createClient() // uses NEXT_PUBLIC_SUPABASE_ANON_KEY, subject to RLS
```

**Server/Admin client** — `src/lib/supabase-server.ts` — use in API routes and server components only:
```ts
import { supabaseAdmin } from '@/lib/supabase-server' // uses SUPABASE_SERVICE_ROLE_KEY, bypasses RLS
```

Never import `supabaseAdmin` in client components. Never import browser `createClient` in API routes for privileged operations.

---

## Key Files

| File | Role |
|---|---|
| `src/app/salon/[slug]/page.tsx` | **Server component.** Fetches org + staff + services via service role. Passes to SalonClient. No UI here. |
| `src/app/salon/[slug]/SalonClient.tsx` | **`'use client'`.** All booking state, slot logic, and UI (~650 lines). |
| `src/app/dashboard/page.tsx` | Owner dashboard: manage staff, services, schedule, calendar blocks |
| `src/app/onboarding/page.tsx` | 6-step post-signup wizard (name → category → timezone → profile → hours → preview) |
| `src/app/billing/page.tsx` | Stripe subscription management |
| `src/lib/slots.ts` | Exported slot utilities: `toMinutes`, `toTimeStr`, `toDateStr`, `buildSlots`, `isSlotBlocked`, `localToUtcMs` |
| `src/lib/booking-validation.ts` | Server-side booking integrity (vacation / day-off / hours / break / block / overlap) |
| `src/lib/email.ts` | Resend email helpers (booking confirmation, reminder, trial ending, payment success) |
| `src/lib/sms.ts` | Twilio SMS helpers |
| `src/lib/logger.ts` | Structured logger + Sentry breadcrumbs |
| `src/constants.ts` | `DEFAULT_WORK_START`, `DEFAULT_WORK_END`, `APP_URL` |
| `src/types.ts` | Shared `DaySchedule` interface |

---

## Stable Logic — DO NOT MODIFY

These functions in `SalonClient.tsx` are frozen since commit `6b29244`. They have named bug fixes (BUG-05, BUG-08, BUG-12, BUG-13, BUG-15). Do not refactor or move without explicit instruction:

- `toDateStr(d)` — uses local date parts (not UTC) to match browser calendar
- `toMinutes(time)` / `toTimeStr(minutes)` — 24h only, never pass AM/PM strings
- `isSlotBlocked(dateStr, slotMin, slotEndMin, staffId, blocks)` — uses UTC parts from block timestamps (BUG-05)
- `buildSlots(date, schedule, bookedSlots, duration, blocks, staffId)` — includes break validation (BUG-08) and past-time cutoff
- `isValidPhone(p)` — strip non-digits, check length ≥ 7
- `DATES_14` — computed **outside** the component, never inside (BUG-12)

**Internal format is always 24h.** Only convert to AM/PM at the display layer via `toAmPm()` from `src/lib/time.ts`.

---

## Booking Flow

**Steps:** `hero → service → staff → time → confirm → done`

- 1 staff member → staff step is skipped (auto-selected in `handleSelectService`)
- `handleBookCTA()` always goes to `'service'` first
- Booking is inserted directly from `SalonClient` via browser Supabase client
- `/api/book` exists for server-side validated booking (used by integrations, not the main flow)

**Slot cache model:** `bookedSlotsMap: Record<"staffId_YYYY-MM-DD", string[] | null>`
- `undefined` key = never fetched → triggers `useEffect`
- `null` = fetch in-flight
- `string[]` = loaded
- Always **delete** the key on date select to force fresh fetch (never cache stale slots)
- Always **append** newly booked slot to cache after successful insert

---

## Design System

**Colors:**
- Background: `#f5f0e8` (cream)
- Header / footer: `#1a1208` (dark brown)
- Accent / CTA: `#C9A84C` (gold), hover `#e8d08a`
- Cards: `bg-white rounded-2xl shadow-sm border border-[#e8dfc9]`
- Text primary: `#1a1208` · secondary: `#6b5744` · muted: `#9c8b7a`

**Rules:**
- Touch targets: `min-h-[44px]` minimum everywhere
- Inputs: `min-h-[48px]` or `min-h-[52px]`, `rounded-2xl`
- Primary CTA: `rounded-2xl shadow-lg shadow-[#C9A84C]/20 active:scale-[0.97]`
- All time displays in UI: `toAmPm(time)` — never raw 24h strings
- Footer always renders (no `return null` guard) — dark bg, Instagram + TikTok + Telegram SVG icons

**Landing page** (`/`) uses dark theme `bg-[#0F0A00]` — different from booking page cream.

---

## API Routes

| Route | Purpose |
|---|---|
| `POST /api/book` | Server-validated booking insert |
| `POST /api/reschedule` | Reschedule existing booking |
| `GET /api/booking/status` | Booking status by ID |
| `POST /api/email/booking` | Send booking confirmation email |
| `POST /api/email/reschedule` | Send reschedule email |
| `POST /api/sms/consent` | Record SMS opt-in |
| `POST /api/sms/send` | Send SMS via Twilio |
| `GET /api/cron/reminders` | Cron: send 2h-before reminders (auth: `Bearer CRON_SECRET`) |
| `POST /api/stripe/checkout` | Create Stripe checkout session |
| `POST /api/webhooks/stripe` | Handle Stripe events (idempotent via `billing_events` table) |
| `GET /api/analytics/capacity` | Staff capacity utilization |

---

## Database Tables (Supabase)

| Table | Purpose |
|---|---|
| `organizations` | Org profile: name, slug, timezone, plan_id, sub_status, trial_ends_at, social links, phone, address |
| `staff` | Staff members (name, role, avatar_url, is_active) |
| `services` | Service catalog (name, price_cents, duration_min, is_active) |
| `staff_schedule` | Weekly schedule per staff (work_start/end, break_start/end, is_day_off, day_of_week 0=Sun) |
| `vacation_blocks` | Date ranges when staff is unavailable |
| `bookings` | Bookings: start_time, end_time, duration_min, status (confirmed/pending/cancelled) |
| `calendar_blocks` | Admin-defined blocks (staff_id null = all staff); stored as UTC timestamptz |
| `billing_events` | Stripe webhook deduplication log |
| `sms_consent` | SMS opt-in records |

**Booking overlap protection:** `EXCLUDE USING GIST (master_id WITH =, tstzrange(start_time, end_time, '[)') WITH &&) WHERE status IN ('confirmed', 'pending')` — error code `23P01`.

---

## Pending DB Migrations

Run manually in Supabase SQL Editor (files in `supabase/migrations/`):
- `booking_constraints.sql` — end_time, duration_min, overlap exclusion constraint
- `calendar_blocks_type.sql` — adds `type` column to calendar_blocks
- `organizations_defaults.sql` — default values for org columns
- `organizations_telegram.sql` — adds `telegram text` column to organizations

---

## Environment Variables

```env
# Public
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Server only
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_BUSINESS_PRICE_ID=
APP_URL=https://www.noblelink.app
CRON_SECRET=
```

---

## Commands

```bash
npm run dev    # local dev
npm run build  # production build (run before every deploy to catch errors)
npm run lint   # ESLint
```

Deploy: push to `main` → Vercel auto-deploys.

---

## Extended Docs

Detailed technical references in `docs/`:
- `docs/STABLE_LOGIC.md` — slot algorithm deep-dive, bug fix history
- `docs/DESIGN_SYSTEM.md` — full color/spacing/component patterns
- `docs/STRUCTURE.md` — complete file map
- `docs/TECH_STACK.md` — versions and integration details
- `docs/CONTEXT_MAP.md` — session quick-start reference
