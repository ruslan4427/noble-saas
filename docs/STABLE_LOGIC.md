# STABLE_LOGIC.md — Golden Logic (DO NOT MODIFY)

These functions are proven stable as of commit `6b29244`. Never refactor, rename, or move them without explicit instruction.

---

## 1. Date String Utility

```ts
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
```
- Uses **local date parts** (`getFullYear`, `getMonth`, `getDate`), not UTC
- This is intentional: `DATES_14` is built from `new Date()` in the browser's local timezone
- Result: `"YYYY-MM-DD"` string matching the user's local calendar date

---

## 2. Time Conversion Utilities

```ts
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number); return h * 60 + m
}
function toTimeStr(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}
```
- Internal 24h format only: `"09:30"` ↔ `570`
- **Never pass AM/PM strings into these functions**
- UI display calls `toAmPm()` from `src/lib/time.ts` separately

---

## 3. isSlotBlocked

```ts
function isSlotBlocked(
  dateStr: string,        // YYYY-MM-DD in local time
  slotMin: number,        // slot start in minutes from midnight
  slotEndMin: number,     // slot end in minutes from midnight
  staffId: string,
  blocks: CalendarBlock[] // raw DB rows with start_time/end_time as UTC ISO strings
): boolean {
  return blocks.some(b => {
    if (b.staff_id !== null && b.staff_id !== staffId) return false
    const bs = new Date(b.start_time); const be = new Date(b.end_time)
    const bsMin = bs.getUTCHours() * 60 + bs.getUTCMinutes()
    const beMin = be.getUTCHours() * 60 + be.getUTCMinutes()
    const bd = `${bs.getUTCFullYear()}-${String(bs.getUTCMonth()+1).padStart(2,'0')}-${String(bs.getUTCDate()).padStart(2,'0')}`
    return bd === dateStr && slotMin < beMin && slotEndMin > bsMin
  })
}
```

**Why UTC comparison:** Admin and client may be in different timezones. `calendar_blocks.start_time` / `end_time` are stored as UTC `timestamptz` in Postgres. The client browser converts these to UTC parts using `getUTCHours()` etc., then compares to the UTC date string. **This is the BUG-05 fix.**

**Overlap logic:** `slotMin < beMin && slotEndMin > bsMin` — standard half-open interval overlap.

**`staff_id: null`** blocks apply to ALL staff.

---

## 4. buildSlots

```ts
function buildSlots(
  date: Date,
  schedule: DaySchedule | null,
  bookedSlots: string[],     // array of "HH:MM" strings already booked
  serviceDuration: number,   // minutes
  blocks: CalendarBlock[],
  staffId: string
): { time: string; available: boolean }[]
```

**Algorithm:**
1. If `schedule.is_day_off` → return `[]`
2. Defaults: `work_start = "09:00"`, `work_end = "19:00"` if null
3. Break validation (BUG-08): ignore break if `break_start >= break_end` or break is outside working hours
4. `isToday` check: skip slots where `slotMin <= currentHour*60+currentMin` (already past)
5. Loop `min = wsMin` to `weMin - serviceDuration`, step 30
6. Skip if slot overlaps break: `min < beMin && end > bsMin`
7. For each slot: `available = !isSlotBlocked(...) && !bookedSlots.includes(toTimeStr(min))`

**Output:** Array of `{ time: "HH:MM", available: boolean }` in 24h format.

---

## 5. localToUtcMs (in src/lib/slots.ts)

```ts
function localToUtcMs(dateStr: string, minutes: number, tz: string): number
```
- Converts a local-time slot (`dateStr` + `minutes`) to UTC milliseconds
- Uses `Intl.DateTimeFormat` for DST-aware conversion
- Used in: `booking-validation.ts` and `reschedule/route.ts`
- **Must remain exported from `src/lib/slots.ts`** — removing it breaks the server-side validation layer

---

## 6. Server-Side Validation (booking-validation.ts)

`validateBookingSlot(p: BookingSlotParams)` checks in order:
1. **Vacation** — `vacation_blocks` overlap
2. **Day off** — `staff_schedule.is_day_off`
3. **Working hours** — slot must be within `[work_start, work_end)` in org timezone
4. **Break overlap** — slot must not overlap break window
5. **Calendar block** — `calendar_blocks` overlap (UTC comparison in Postgres)
6. **Booking overlap** — existing `confirmed`/`pending` bookings with same master

All 5 checks run in parallel via `Promise.all`. Returns `null` if valid, or `{ code, message, status }`.

---

## 7. Slot Data Flow

```
page.tsx (server)
  └─ fetches: org, staff[], services[]
       └─ passes to SalonClient (client)

SalonClient
  ├─ DATES_14: built once outside component (14 days from today, local browser time)
  ├─ On staff select: fetches staff_schedule[], vacation_blocks[]
  ├─ On date select: fetches bookings (time_slot strings) for that staff+date
  ├─ On render: buildSlots(date, schedule, bookedSlots, duration, blocks, staffId)
  └─ On confirm: inserts to bookings via supabase.from('bookings').insert()
       Note: SalonClient inserts directly (no /api/book). /api/book exists for future use.
```

---

## 8. Booking Flow Steps

Order: **service → staff → time → confirm → done**

- `handleBookCTA()` → always `setStep('service')`
- `handleSelectService(s)` → if 1 staff: auto-select, go to `'time'`; else go to `'staff'`
- `handleSelectStaff(m)` → `setStep('time')`
- Time step → date picker + slot grid → `setStep('confirm')`
- Confirm → `handleConfirm()` → inserts booking → `setStep('done')`

---

## 9. Validation Rules

**Phone (client-side):**
```ts
function isValidPhone(p: string): boolean {
  return p.replace(/\D/g, '').length >= 7
}
```

**Email (client-side):** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)` — only stored if passes

**Race condition mitigation:**
- Pre-check: query DB for existing booking at same master/date/time before insert
- On `23505` (unique violation) or `23P01` (range overlap exclusion): show "slot taken" error, refresh booked slots, return user to time picker

---

## 10. Cache Model

- `bookedSlotsMap: Record<string, string[] | null>` keyed by `"staffId_YYYY-MM-DD"`
- `null` = fetch in-flight
- `undefined` key = never fetched (triggers useEffect)
- On date select: **always delete** the key to force fresh fetch (no stale cache)
- On successful booking: **immediately append** the new time slot to cache
