import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { APP_URL } from '@/constants'
import { logger } from '@/lib/logger'
import { validateBookingSlot } from '@/lib/booking-validation'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    org_id, master_id, date, time_slot,
    slot_start_utc, slot_end_utc,
    client_name, client_phone, client_email,
    service_name, price_cents, duration_min,
  } = body

  if (!org_id || !master_id || !date || !time_slot || !client_name || !client_phone || !service_name || !slot_start_utc || !slot_end_utc) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const resolvedDuration: number = typeof duration_min === 'number' && duration_min > 0 ? duration_min : 30

  const validationError = await validateBookingSlot({
    orgId:        org_id,
    masterId:     master_id,
    date,
    durationMin:  resolvedDuration,
    slotStartUtc: slot_start_utc,
    slotEndUtc:   slot_end_utc,
  })

  if (validationError) {
    return NextResponse.json({ error: validationError.message }, { status: validationError.status })
  }

  const startUtcMs    = new Date(slot_start_utc).getTime()
  const startTimeISO  = new Date(startUtcMs).toISOString()
  const endTimeISO    = new Date(slot_end_utc).toISOString()
  const reminderAtISO = new Date(startUtcMs - 2 * 60 * 60 * 1000).toISOString()

  const { data: booking, error: insertError } = await supabaseAdmin
    .from('bookings')
    .insert({
      org_id, master_id, date, time_slot,
      client_name, client_phone,
      client_email:  client_email || null,
      service_name,  price_cents,
      status:        'confirmed',
      start_time:    startTimeISO,
      end_time:      endTimeISO,
      duration_min:  resolvedDuration,
      reminder_at:   reminderAtISO,
      reminder_sent: false,
    })
    .select('id')
    .single()

  if (insertError) {
    // Postgres exclusion constraint violation
    const isOverlap = insertError.code === '23P01'
    logger.error({ event: 'booking_create_failed', orgId: org_id, masterId: master_id, date, err: insertError })
    return NextResponse.json(
      { error: isOverlap ? 'This time slot is already booked.' : insertError.message },
      { status: isOverlap ? 409 : 500 },
    )
  }

  logger.info({
    event:       'booking_created',
    bookingId:   booking.id,
    orgId:       org_id,
    masterId:    master_id,
    clientName:  client_name,
    serviceName: service_name,
    date,
    timeSlot:    time_slot,
    priceCents:  price_cents,
    durationMin: resolvedDuration,
  })

  // Fire email + SMS notification (non-blocking)
  const { data: staffData } = await supabaseAdmin
    .from('staff')
    .select('name')
    .eq('id', master_id)
    .single()

  fetch(`${APP_URL}/api/email/booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      org_id, client_name, client_phone, client_email,
      master_name: staffData?.name ?? '',
      service_name, date, time: time_slot, price_cents,
      booking_id: booking.id,
    }),
  }).catch(err => console.error('Notification failed (non-fatal):', err))

  return NextResponse.json({ id: booking.id })
}
