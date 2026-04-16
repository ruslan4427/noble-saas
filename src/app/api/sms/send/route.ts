import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSMS, smsConfirmation, smsCancellation, smsReschedule } from '@/lib/sms'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { type, booking_id, old_date, old_time } = await req.json()

    if (!type || !booking_id) {
      return NextResponse.json({ error: 'Missing type or booking_id' }, { status: 400 })
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Consent check — column is client_phone
    const { data: consent } = await supabase
      .from('sms_consent')
      .select('consented')
      .eq('client_phone', booking.client_phone)
      .maybeSingle()

    if (!consent?.consented) {
      return NextResponse.json({ ok: false, reason: 'no_consent' })
    }

    const [{ data: org }, { data: master }] = await Promise.all([
      supabase.from('organizations').select('name, timezone').eq('id', booking.org_id).single(),
      supabase.from('staff').select('name').eq('id', booking.master_id).single(),
    ])

    const params = {
      clientName:  booking.client_name,
      salonName:   org?.name ?? 'Your salon',
      masterName:  master?.name ?? 'Your master',
      serviceName: booking.service_name,
      date:        booking.date,
      time:        booking.time_slot,
      timezone:    org?.timezone ?? 'America/New_York',
    }

    let message: string
    switch (type) {
      case 'confirmation':
        message = smsConfirmation(params)
        break
      case 'cancellation':
        message = smsCancellation(params)
        break
      case 'reschedule':
        if (!old_date || !old_time) {
          return NextResponse.json({ error: 'Missing old_date/old_time' }, { status: 400 })
        }
        message = smsReschedule({ ...params, oldDate: old_date, oldTime: old_time })
        break
      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
    }

    const result = await sendSMS(booking.client_phone, message)
    return NextResponse.json({ ok: true, sid: result?.sid })
  } catch (err) {
    console.error('SMS send error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
