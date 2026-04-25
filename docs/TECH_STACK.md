# TECH_STACK.md — Libraries, Versions, Integrations

## Core Framework

| Package | Version | Notes |
|---|---|---|
| `next` | 16.2.3 | App Router, async params (`Promise<{slug}>`), server/client component split |
| `react` / `react-dom` | 19.2.4 | — |
| `typescript` | ^5 | Strict mode |
| `tailwindcss` | ^4 | Via `@tailwindcss/postcss`; no config file — all via `@theme` in CSS |

## Supabase

| Package | Version | Usage |
|---|---|---|
| `@supabase/supabase-js` | ^2.102.1 | Direct client in `page.tsx` (service role, server-only) |
| `@supabase/ssr` | ^0.10.2 | Browser client in `src/lib/supabase.ts` via `createBrowserClient` |

### Two Supabase clients — never mix them

**Browser client** (`src/lib/supabase.ts`):
```ts
// 'use client'
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
```
- Used in: `SalonClient.tsx` (booking queries, availability)
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public, safe for browser)
- Subject to RLS

**Server/Admin client** (`src/lib/supabase-server.ts` — not yet created):
```ts
// No 'use client'
import { createClient } from '@supabase/supabase-js'
export const supabaseAdmin = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
```
- Used in: `page.tsx`, all API routes, `booking-validation.ts`
- Key: `SUPABASE_SERVICE_ROLE_KEY` (secret, server-only, bypasses RLS)
- **Never import in client components**

### Direct admin in page.tsx (current pattern)
`page.tsx` creates its own `createClient` from `@supabase/supabase-js` directly with the service role key. This is intentional — it's a server component.

## Third-Party Services

| Package | Version | Purpose | Env vars |
|---|---|---|---|
| `resend` | ^6.10.0 | Transactional email | `RESEND_API_KEY` |
| `twilio` | ^5.13.1 | SMS reminders | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` |
| `stripe` | ^22.0.1 | Subscription billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| `@stripe/stripe-js` | ^9.1.0 | Stripe.js for frontend | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |

## Fonts & Styling

- **Fonts**: Geist Sans + Geist Mono loaded via `next/font/google` in `layout.tsx`
- **CSS**: Tailwind v4, `globals.css` uses `@import "tailwindcss"` and `@theme inline`
- **No** `tailwind.config.js` — Tailwind v4 does not use one
- **Custom animation**: `fade-in` defined in `globals.css`

## Environment Variables

```env
# Public (safe in browser)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Server-only (never expose to client)
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
APP_URL=                   # e.g. https://www.noblelink.app
```

## Next.js 16 Specifics

- `params` in page components are `Promise<{slug: string}>` — must `await params`
- Server components fetch data directly (no `getServerSideProps`)
- `'use client'` directive required for any component using hooks or browser APIs
- API routes use `NextRequest` / `NextResponse`
- `instrumentation.ts` present (Sentry or custom init)
