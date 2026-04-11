import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBookingConfirmation, sendBookingNotification } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { booking_id } = await req.json()
  if (!booking_id) return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 })

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, organizations(*), staff(*)')
    .eq('id', booking_id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const org = booking.organizations
  const master = booking.staff
  const results = []

  if (booking.client_email) {
    try {
      await sendBookingConfirmation({
        to: booking.client_email,
        clientName: booking.client_name,
        salonName: org.name,
        masterName: master?.name ?? 'TBD',
        serviceName: booking.service_name,
        date: booking.date,
        time: booking.time_slot,
        price: Math.round((booking.price_cents || 0) / 100),
      })
      results.push('client_email_sent')
    } catch (e) { console.error('Client email error:', e) }
  }

  const { data: ownerData } = await supabase.auth.admin.getUserById(org.owner_id)
  const ownerEmail = ownerData?.user?.email

  if (ownerEmail) {
    try {
      await sendBookingNotification({
        to: ownerEmail,
        salonName: org.name,
        clientName: booking.client_name,
        clientPhone: booking.client_phone,
        masterName: master?.name ?? 'TBD',
        serviceName: booking.service_name,
        date: booking.date,
        time: booking.time_slot,
        price: Math.round((booking.price_cents || 0) / 100),
      })
      results.push('owner_email_sent')
    } catch (e) { console.error('Owner email error:', e) }
  }

  return NextResponse.json({ ok: true, results })
}
