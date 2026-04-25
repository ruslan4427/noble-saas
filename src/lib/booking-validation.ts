import { supabaseAdmin } from '@/lib/supabase-server'
import { toMinutes, localToUtcMs } from '@/lib/slots'
import { DEFAULT_WORK_START, DEFAULT_WORK_END } from '@/constants'

export interface BookingSlotParams {
  orgId:          string
  masterId:       string
  date:           string   // YYYY-MM-DD
  durationMin:    number
  slotStartUtc:   string   // ISO — booking start in UTC
  slotEndUtc:     string   // ISO — booking end in UTC
  excludeBookingId?: string // for reschedule: skip the booking being moved
}

export interface BookingValidationError {
  code:    string
  message: string
  status:  number
}

// Returns null if the slot is valid, or an error object to return to the client.
export async function validateBookingSlot(
  p: BookingSlotParams,
): Promise<BookingValidationError | null> {
  const slotStartMs = new Date(p.slotStartUtc).getTime()
  const slotEndMs   = new Date(p.slotEndUtc).getTime()

  if (isNaN(slotStartMs) || isNaN(slotEndMs) || slotEndMs <= slotStartMs) {
    return { code: 'invalid_time', message: 'Invalid slot times.', status: 400 }
  }

  // ── Fetch everything needed in parallel ────────────────────────────────────
  const dow = new Date(p.date + 'T12:00:00Z').getDay()

  const [orgRes, schedRes, vacRes, blockRes, overlapRes] = await Promise.all([
    supabaseAdmin
      .from('organizations')
      .select('timezone')
      .eq('id', p.orgId)
      .single(),

    supabaseAdmin
      .from('staff_schedule')
      .select('is_day_off, work_start, work_end, break_start, break_end')
      .eq('staff_id', p.masterId)
      .eq('day_of_week', dow)
      .maybeSingle(),

    supabaseAdmin
      .from('vacation_blocks')
      .select('id')
      .eq('staff_id', p.masterId)
      .lte('date_from', p.date)
      .gte('date_to',   p.date)
      .limit(1),

    supabaseAdmin
      .from('calendar_blocks')
      .select('id, reason')
      .eq('org_id', p.orgId)
      .or(`staff_id.eq.${p.masterId},staff_id.is.null`)
      .lt('start_time', p.slotEndUtc)
      .gt('end_time',   p.slotStartUtc)
      .limit(1),

    // Active bookings for this master that overlap the requested slot
    (() => {
      let q = supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('master_id', p.masterId)
        .in('status', ['confirmed', 'pending'])
        .lt('start_time', p.slotEndUtc)
        .gt('end_time',   p.slotStartUtc)
        .limit(1)
      if (p.excludeBookingId) q = q.neq('id', p.excludeBookingId)
      return q
    })(),
  ])

  // ── 1. Vacation ────────────────────────────────────────────────────────────
  if (vacRes.data && vacRes.data.length > 0) {
    return {
      code:    'staff_on_vacation',
      message: 'This staff member is on vacation on the selected date.',
      status:  409,
    }
  }

  // ── 2. Working hours ───────────────────────────────────────────────────────
  const tz   = orgRes.data?.timezone || 'UTC'
  const sched = schedRes.data

  if (sched?.is_day_off) {
    return {
      code:    'day_off',
      message: 'This staff member does not work on the selected day.',
      status:  409,
    }
  }

  const wsMin = toMinutes(sched?.work_start || DEFAULT_WORK_START)
  const weMin = toMinutes(sched?.work_end   || DEFAULT_WORK_END)

  const workStartMs = localToUtcMs(p.date, wsMin, tz)
  const workEndMs   = localToUtcMs(p.date, weMin, tz)

  if (slotStartMs < workStartMs || slotEndMs > workEndMs) {
    return {
      code:    'outside_working_hours',
      message: 'This slot falls outside working hours.',
      status:  409,
    }
  }

  // ── 3. Break overlap ───────────────────────────────────────────────────────
  if (sched?.break_start && sched?.break_end) {
    const bsMin = toMinutes(sched.break_start)
    const beMin = toMinutes(sched.break_end)

    if (bsMin < beMin && bsMin >= wsMin && beMin <= weMin) {
      const breakStartMs = localToUtcMs(p.date, bsMin, tz)
      const breakEndMs   = localToUtcMs(p.date, beMin, tz)

      if (slotStartMs < breakEndMs && slotEndMs > breakStartMs) {
        return {
          code:    'overlaps_break',
          message: 'This slot overlaps with the staff break.',
          status:  409,
        }
      }
    }
  }

  // ── 4. Calendar block ──────────────────────────────────────────────────────
  if (blockRes.error) {
    return {
      code:    'block_check_failed',
      message: 'Could not validate availability. Please try again.',
      status:  500,
    }
  }
  if (blockRes.data && blockRes.data.length > 0) {
    return {
      code:    'calendar_block',
      message: 'This time slot is not available.',
      status:  409,
    }
  }

  // ── 5. Booking overlap ─────────────────────────────────────────────────────
  if (overlapRes.data && overlapRes.data.length > 0) {
    return {
      code:    'booking_overlap',
      message: 'This time slot is already booked.',
      status:  409,
    }
  }

  return null
}
