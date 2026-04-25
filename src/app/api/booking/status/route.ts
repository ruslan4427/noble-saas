import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const { bookingId, newStatus } = await req.json()

  if (!bookingId || !newStatus) {
    return NextResponse.json({ error: 'Missing bookingId or newStatus' }, { status: 400 })
  }

  const { data: booking, error: fetchError } = await supabaseAdmin
    .from('bookings')
    .select('id, org_id, master_id, client_name, service_name, date, time_slot, status')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const prevStatus = booking.status

  const { error } = await supabaseAdmin
    .from('bookings')
    .update({ status: newStatus })
    .eq('id', bookingId)

  if (error) {
    logger.error({ event: 'booking_status_update_failed', bookingId, newStatus, err: error })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  logger.info({
    event: 'booking_status_changed',
    bookingId,
    orgId:       booking.org_id,
    masterId:    booking.master_id,
    clientName:  booking.client_name,
    serviceName: booking.service_name,
    date:        booking.date,
    timeSlot:    booking.time_slot,
    prevStatus,
    newStatus,
  })

  return NextResponse.json({ ok: true })
}
