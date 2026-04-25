# CONTEXT_MAP.md — Session Quick-Start

Load this file at the start of every new session to restore full project context in minimum tokens.

---

## What This Project Is

**Noble SaaS** — multi-tenant barbershop booking platform.
- Salon owners get a dashboard to manage staff, schedule, services, calendar blocks, billing
- Each salon gets a public booking page at `/salon/[slug]`
- Stack: Next.js 16, React 19, Supabase, Tailwind v4, Resend, Twilio, Stripe

---

## The Two Files That Matter Most

| File | Role |
|---|---|
| `src/app/salon/[slug]/page.tsx` | Server component. Fetches org + staff + services via service-role Supabase. Passes to SalonClient. Do not add UI here. |
| `src/app/salon/[slug]/SalonClient.tsx` | `'use client'`. All booking state, UI, slot logic. ~640 lines. |

---

## Stable Logic (NEVER TOUCH)

Located inside `SalonClient.tsx` — these functions are frozen since commit `6b29244`:

- `toDateStr(d)` — local date to `"YYYY-MM-DD"`
- `toMinutes(time)` — `"HH:MM"` → integer minutes
- `toTimeStr(minutes)` → `"HH:MM"`
- `isSlotBlocked(dateStr, slotMin, slotEndMin, staffId, blocks)` — UTC-based block check
- `buildSlots(date, schedule, bookedSlots, duration, blocks, staffId)` — generates slot array
- `isValidPhone(p)` — 7+ digit check

See `docs/STABLE_LOGIC.md` for full details and reasoning.

---

## Booking Flow (current)

`hero` → `service` → `staff` → `time` → `confirm` → `done`

- 1 staff → staff step skipped (auto-selected)
- Hero page shows service list and team preview directly

---

## Key Design Tokens

- Background: `#f5f0e8` (cream)
- Header/footer: `#1a1208` (dark brown)
- Accent: `#C9A84C` (gold)
- Cards: `bg-white rounded-2xl shadow-sm border border-[#e8dfc9]`
- All time display: `toAmPm()` from `src/lib/time.ts`
- Footer: always rendered, dark bg, Instagram + TikTok + Telegram SVG icons

---

## Supabase Tables (public booking page uses)

| Table | Used for |
|---|---|
| `organizations` | Org name, slug, timezone, social links, phone, address |
| `staff` | Staff list (name, role, avatar_url) |
| `services` | Service catalog (name, price_cents, duration_min) |
| `staff_schedule` | Weekly schedule per staff (work hours, break, day_off) |
| `vacation_blocks` | Date ranges when staff is unavailable |
| `bookings` | Existing bookings for slot availability check |
| `calendar_blocks` | Admin-defined blocked time ranges |

`organizations` columns include: `instagram`, `tiktok`, `telegram`, `facebook`, `phone`, `address`, `timezone`

---

## Missing Files (TypeScript errors — pre-existing)

These files are imported but do not exist in the repo:
- `src/lib/supabase-server.ts` → must export `supabaseAdmin`
- `src/lib/slots.ts` → must export `toMinutes`, `localToUtcMs`, `isSlotBlocked`, `buildSlots`
- `src/constants.ts` → must export `DEFAULT_WORK_START`, `DEFAULT_WORK_END`, `APP_URL`

These errors do not affect the public booking page (`/salon/[slug]`) which has no dependency on them.

---

## Known Bugs Fixed (do not reintroduce)

| ID | Fix |
|---|---|
| BUG-01/02 | Cache always invalidated on date select; re-fetches fresh bookedSlots |
| BUG-03 | Pre-check + 23505 handler for race condition on booking insert |
| BUG-05 | `isSlotBlocked` uses UTC date parts, not local — prevents timezone drift |
| BUG-08 | Break validation: invalid break (start ≥ end or outside work hours) is ignored |
| BUG-09 | `slotsLoading` derived from cache state, not separate boolean |
| BUG-12 | `DATES_14` computed outside component — never changes |
| BUG-13 | Phone validated with `isValidPhone` before submit |
| BUG-14 | Email only stored if regex passes |
| BUG-15 | `toDateStr` uses local date parts to match browser calendar |

---

## Pending DB Migrations (run in Supabase SQL Editor)

- `booking_constraints.sql` — adds `end_time`, `duration_min`, overlap exclusion constraint
- `organizations_defaults.sql` — adds default values to org columns
- `calendar_blocks_type.sql` — adds `type` column to `calendar_blocks`
- `organizations_telegram.sql` — adds `telegram text` column to `organizations`

---

## What Was Last Changed

Last session work on `SalonClient.tsx`:
1. Footer: removed `return null` guard → always renders; dark bg; Telegram added; Facebook kept; `.trim()` checks on social/contact fields
2. Flow: service-first (`handleBookCTA` → `'service'`; `handleSelectService` → staff or time)
3. Progress bar: updated to `['service','staff','time','confirm']` order
4. Back buttons: service → hero; time → staff (if multiple) or service (if 1 staff)

---

## Reference Docs

- `docs/STRUCTURE.md` — full file/folder map
- `docs/TECH_STACK.md` — versions, env vars, Supabase client patterns
- `docs/STABLE_LOGIC.md` — slot calculation deep-dive
- `docs/DESIGN_SYSTEM.md` — colors, spacing, component patterns, AM/PM rules
