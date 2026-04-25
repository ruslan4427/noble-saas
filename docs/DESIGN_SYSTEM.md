# DESIGN_SYSTEM.md — UI Guidelines

## Design Philosophy
- Apple-style premium: large white space, clean hierarchy, no decoration for decoration's sake
- Mobile-first iPhone experience — all touch targets `min-h-[44px]`
- Warm, luxe barbershop palette — not clinical white, not loud

---

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| `brand-dark` | `#1a1208` | Header bg, primary buttons, dark text |
| `brand-gold` | `#C9A84C` | Accent: CTA buttons, selected states, highlights |
| `brand-gold-light` | `#e8d08a` | Button hover state |
| `bg-cream` | `#f5f0e8` | Page background, cards on dark bg |
| `bg-card` | `#ffffff` | Card background |
| `border-warm` | `#e8dfc9` | Card borders, dividers |
| `border-input` | `#c8bfb0` | Form input borders |
| `border-muted` | `#d4c9b8` | Unselected date chips |
| `text-primary` | `#1a1208` | Headings, labels |
| `text-secondary` | `#6b5744` | Subtext, captions |
| `text-muted` | `#a0907e` | Placeholders, metadata |
| `text-disabled` | `#c0b5a8` | Unavailable slots |

---

## Typography

- **Body font**: Geist Sans (`var(--font-geist-sans)`) — loaded via `next/font/google`
- **Serif accent**: `font-serif` class (Tailwind default serif stack) — used for org name, section branding
- **No custom serif import** — browser default serif is intentional for elegance

| Role | Classes |
|---|---|
| Page title (hero) | `font-serif text-3xl sm:text-4xl font-bold` |
| Step heading | `text-lg font-bold text-[#1a1208]` |
| Card section label | `text-xs font-semibold text-[#6b5744] uppercase tracking-wide` |
| Body / list items | `text-sm text-[#1a1208]` |
| Captions / meta | `text-xs text-[#6b5744]` |
| Micro labels | `text-[10px] text-[#a0907e]` |

---

## Spacing & Layout

- Max content width: `max-w-lg` (512px) centered with `mx-auto`
- Page padding: `px-4` on mobile
- Section gap: `space-y-2` for lists, `space-y-3` for form fields
- Card padding: `px-4 py-3.5` (list items), `p-4` (detail cards), `p-8` (hero/done cards)

---

## Border Radius

| Component | Class |
|---|---|
| Main cards | `rounded-2xl` |
| Hero / confirmation card | `rounded-2xl` or `rounded-3xl` |
| List item buttons | `rounded-xl` |
| Form inputs | `rounded-xl` |
| Slot time buttons | `rounded-lg` |
| Date chips | `rounded-xl` |
| Avatar / team photos | `rounded-full` |
| Social icon buttons | `rounded-full` |
| Progress bar segments | `rounded-full` |

---

## Shadows

| Context | Class |
|---|---|
| Cards on cream bg | `shadow-sm` |
| Primary CTA button | `shadow-lg shadow-[#C9A84C]/20` |
| Modal / overlay | `shadow-xl` |

---

## Interactive States

- Hover: subtle bg shift (`hover:bg-[#faf7f2]`, `hover:border-[#C9A84C]`)
- Active tap: `active:scale-[0.97]` or `active:scale-[0.98]` (subtle press)
- Selected card border: `border-2 border-[#C9A84C]`
- Disabled: `opacity-40` or `opacity-60` + `cursor-not-allowed`
- Focus ring: `focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C]`
- Transition: always `transition` (150ms default)

---

## Components Patterns

### List Button (staff / service)
```
bg-white rounded-xl px-4 py-3.5
border-2 border-transparent hover:border-[#C9A84C]
flex items-center gap-3
active:scale-[0.99]
```

### Time Slot Button (3-col grid)
```
py-3 rounded-lg text-sm font-medium border min-h-[44px]
available:   border-[#d4c9b8] bg-white text-[#1a1208] hover:border-[#C9A84C]
selected:    border-[#C9A84C] bg-[#C9A84C] text-black
unavailable: border-[#e8dfc9] bg-[#f0ebe0] text-[#c0b5a8] opacity-60
```

### Primary CTA Button
```
bg-[#C9A84C] text-black font-bold rounded-xl
hover:bg-[#e8d08a] active:scale-[0.98]
min-h-[52px] (hero) or min-h-[44px] (inline)
```

### Form Input
```
w-full border border-[#c8bfb0] rounded-xl px-4 py-3
text-sm text-[#1a1208] bg-white placeholder-[#a0907e]
outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20
min-h-[48px]
```

### Skeleton Loader
```
animate-pulse bg-[#e0d8cc] rounded-lg
```

---

## Header Patterns

**Hero header (step === 'hero'):**
- Full dark `bg-[#1a1208]`, large padding `px-6 pt-12 pb-20`
- Org name in serif gold, "Online booking" pill badge
- CTA button with gold shadow

**Compact header (any other step):**
- Same dark bg, `px-6 py-5`
- Left: back/reset button (`text-white/50`)
- Center: `font-serif text-[#C9A84C]` org name
- Right: spacer `w-10`

---

## Footer

- **Always rendered** — even with no social/contact data ("Powered by Noble" minimum)
- Dark background `bg-[#1a1208] border-t border-white/10`
- Social icons: `w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white`
- Supported networks: Instagram, TikTok, Telegram (inline SVG, no icon library dependency)
- Facebook removed — use Telegram instead
- Contact info in `text-white/50`

---

## AM/PM Formatting Rule

**Rule:** All time displays in UI must use `toAmPm()` from `src/lib/time.ts`.

```ts
// src/lib/time.ts
export function toAmPm(time: string): string {
  if (!time || !time.includes(':')) return time
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}
```

**Apply here:**
- Slot grid buttons: `toAmPm(slot.time)`
- Summary breadcrumb bar: `toAmPm(selectedTime)`
- Confirm screen time row: `toAmPm(selectedTime ?? '')`
- Done screen time row: `toAmPm(selectedTime ?? '')`

**Never apply to:**
- Internal `buildSlots`, `isSlotBlocked`, `bookedSlots` comparisons — always 24h internally
- DB values (`time_slot` column stores `"HH:MM"` in 24h)

---

## Modularization Suggestions

Current `SalonClient.tsx` (~640 lines) should eventually be split into:

| Proposed File | Contents |
|---|---|
| `components/booking/StepService.tsx` | Service list step |
| `components/booking/StepStaff.tsx` | Staff selection step |
| `components/booking/StepTime.tsx` | Date picker + slot grid |
| `components/booking/StepConfirm.tsx` | Contact form + confirm button |
| `components/booking/BookingDone.tsx` | Success screen |
| `components/booking/SalonHeader.tsx` | Hero + compact header |
| `components/booking/SalonFooter.tsx` | Footer with socials |
| `components/booking/SummaryBar.tsx` | Breadcrumb selection bar |
| `hooks/useAvailability.ts` | Schedule/booked slots fetching logic |
| `lib/slots.ts` | All slot calculation functions (already partially there) |

**Do not split until explicitly requested** — current monolith is stable and working.
