import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { localToUtcMs, toMinutes } from '@/lib/slots'
import { logger } from '@/lib/logger'
import { validateBookingSlot } from '@/lib/booking-validation'

export async function POST(req: NextRequest) {
  const { bookingId, newDate, newTime, newMasterId } = await req.json()

  if (!bookingId || !newDate || !newTime) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  // Fetch existing booking to get org, duration, and original master
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('org_id, master_id, duration_min')
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const masterId    = newMasterId || booking.master_id
  const durationMin = booking.duration_min ?? 30

  // Fetch org timezone to build UTC slot times
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('timezone')
    .eq('id', booking.org_id)
    .single()

  const tz           = org?.timezone || 'UTC'
  const startMin     = toMinutes(newTime)
  const startUtcMs   = localToUtcMs(newDate, startMin, tz)
  const endUtcMs     = startUtcMs + durationMin * 60 * 1000

  const slotStartUtc = new Date(startUtcMs).toISOString()
  const slotEndUtc   = new Date(endUtcMs).toISOString()

  const validationError = await validateBookingSlot({
    orgId:           booking.org_id,
    masterId,
    date:            newDate,
    durationMin,
    slotStartUtc,
    slotEndUtc,
    excludeBookingId: bookingId,
  })

  if (validationError) {
    return NextResponse.json({ error: validationError.message }, { status: validationError.status })
  }

  const reminderAtISO = new Date(startUtcMs - 2 * 60 * 60 * 1000).toISOString()

  const { error } = await supabaseAdmin
    .from('bookings')
    .update({
      date:          newDate,
      time_slot:     newTime,
      master_id:     masterId,
      start_time:    slotStartUtc,
      end_time:      slotEndUtc,
      reminder_at:   reminderAtISO,
      reminder_sent: false,
    })
    .eq('id', bookingId)

  if (error) {
    const isOverlap = error.code === '23P01'
    logger.error({ event: 'booking_reschedule_failed', bookingId, newDate, newTime, err: error })
    return NextResponse.json(
      { error: isOverlap ? 'This time slot is already booked.' : error.message },
      { status: isOverlap ? 409 : 500 },
    )
  }

  logger.info({
    event:      'booking_rescheduled',
    bookingId,
    orgId:      booking.org_id,
    masterId,
    newDate,
    newTime,
    durationMin,
  })

  return NextResponse.json({ ok: true })
}
