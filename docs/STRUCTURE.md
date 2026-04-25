# STRUCTURE.md — Project Architecture Map

## Root
```
noble-saas/
├── docs/               ← knowledge base (this folder)
├── src/
│   ├── app/            ← Next.js 16 App Router
│   ├── components/     ← reusable dashboard components
│   └── lib/            ← shared utilities and server clients
├── supabase/
│   └── migrations/     ← SQL scripts (run manually in Supabase SQL Editor)
├── public/
├── package.json
└── CLAUDE.md / AGENTS.md
```

## src/app — Routes

| Route | File | Type | Purpose |
|---|---|---|---|
| `/` | `app/page.tsx` | Server | Marketing landing page |
| `/login` | `app/login/page.tsx` | Client | Auth (Supabase email/password) |
| `/signup` | `app/signup/page.tsx` | Client | New org registration |
| `/onboarding` | `app/onboarding/page.tsx` | Client | Post-signup setup wizard |
| `/dashboard` | `app/dashboard/page.tsx` | Client | Main org dashboard |
| `/analytics` | `app/analytics/page.tsx` | Client | Capacity/revenue analytics |
| `/billing` | `app/billing/page.tsx` | Client | Stripe subscription management |
| `/pricing` | `app/pricing/page.tsx` | Server | Public pricing page |
| `/legal` | `app/legal/page.tsx` | Server | Legal / terms |
| `/salon/[slug]` | `app/salon/[slug]/page.tsx` | **Server** | Public booking page — fetches data, renders `SalonClient` |
| `/salon/[slug]` | `app/salon/[slug]/SalonClient.tsx` | **Client** | All booking UI and state |
| `/[slug]` | `app/[slug]/page.tsx` | Server | Redirect alias (legacy) |

## src/app/api — API Routes

| Endpoint | File | Purpose |
|---|---|---|
| `POST /api/book` | `api/book/route.ts` | Create booking with full server-side validation |
| `POST /api/reschedule` | `api/reschedule/route.ts` | Reschedule existing booking |
| `GET /api/booking/status` | `api/booking/status/route.ts` | Check booking status by ID |
| `GET /api/analytics/capacity` | `api/analytics/capacity/route.ts` | Capacity utilization data |
| `POST /api/email/booking` | `api/email/booking/route.ts` | Send booking confirmation email (Resend) |
| `POST /api/email/reschedule` | `api/email/reschedule/route.ts` | Send reschedule email |
| `POST /api/sms/consent` | `api/sms/consent/route.ts` | Record SMS opt-in |
| `POST /api/sms/optout` | `api/sms/optout/route.ts` | Record SMS opt-out |
| `POST /api/sms/send` | `api/sms/send/route.ts` | Send SMS via Twilio |
| `POST /api/cron/reminders` | `api/cron/reminders/route.ts` | Cron: send appointment reminders |
| `POST /api/stripe/checkout` | `api/stripe/checkout/route.ts` | Create Stripe checkout session |
| `POST /api/webhooks/stripe` | `api/webhooks/stripe/route.ts` | Handle Stripe webhook events |

## src/components — Dashboard Components

| File | Purpose |
|---|---|
| `BookingCalendar.tsx` | Admin booking calendar view |
| `CalendarBlocks.tsx` | UI to create/manage calendar blocks |
| `CapacityWidget.tsx` | Analytics capacity widget |
| `RecentBookings.tsx` | Recent bookings list |
| `StaffSchedule.tsx` | Staff schedule editor |
| `TrialBanner.tsx` | Trial period warning banner |

## src/lib — Shared Utilities

| File | Exports | Notes |
|---|---|---|
| `supabase.ts` | `createClient()` | Browser client using `@supabase/ssr`. `'use client'` |
| `time.ts` | `toAmPm(time)` | 24h → 12h AM/PM conversion for UI display only |
| `booking-validation.ts` | `validateBookingSlot(p)` | Server-side booking integrity check |
| `email.ts` | email helpers | Resend integration |
| `sms.ts` | sms helpers | Twilio integration |
| `logger.ts` | `logger` | Structured logging |

> **Missing (referenced but not created):**
> - `src/lib/supabase-server.ts` — must export `supabaseAdmin` (service role client)
> - `src/lib/slots.ts` — must export `toMinutes`, `localToUtcMs`, `isSlotBlocked`, `buildSlots`, etc.
> - `src/constants.ts` — must export `DEFAULT_WORK_START`, `DEFAULT_WORK_END`, `APP_URL`

## supabase/migrations — Run Manually in SQL Editor

| File | Purpose |
|---|---|
| `staff_schedule.sql` | Creates `staff_schedule` and `vacation_blocks` tables |
| `calendar_blocks.sql` | Creates `calendar_blocks` table with RLS |
| `calendar_blocks_type.sql` | Adds `type` column to `calendar_blocks` |
| `booking_constraints.sql` | Adds `end_time`, `duration_min`, overlap exclusion constraint |
| `organizations_defaults.sql` | Adds default column values to `organizations` |
| `organizations_telegram.sql` | Adds `telegram text` column to `organizations` |
| `sms_consent.sql` | Creates SMS consent table |
