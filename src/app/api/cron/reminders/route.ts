import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBookingReminder } from '@/lib/email'
import { sendSMS, smsReminder, SMS_ENABLED } from '@/lib/sms'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, client_name, client_email, client_phone, service_name, date, time_slot, org_id, master_id')
      .eq('reminder_sent', false)
      .eq('status', 'confirmed')
      .not('reminder_at', 'is', null)
      .lte('reminder_at', new Date().toISOString())

    if (error) throw error
    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }

    let emailSent = 0
    let smsSent = 0
    const errors: string[] = []

    for (const booking of bookings) {
      try {
        const [{ data: org }, { data: master }] = await Promise.all([
          supabase.from('organizations').select('name, timezone').eq('id', booking.org_id).single(),
          supabase.from('staff').select('name').eq('id', booking.master_id).single(),
        ])

        const salonName  = org?.name ?? 'Your salon'
        const masterName = master?.name ?? 'Your master'
        const timezone   = org?.timezone ?? 'America/New_York'

        const dateLabel = new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })

        // Email reminder
        if (booking.client_email) {
          await sendBookingReminder({
            to: booking.client_email,
            clientName: booking.client_name,
            salonName,
            masterName,
            serviceName: booking.service_name,
            date: dateLabel,
            time: booking.time_slot,
          })
          emailSent++
        }

        // SMS reminder — disabled until SMS_ENABLED = true
        if (SMS_ENABLED && booking.client_phone) {
          const { data: consent } = await supabase
            .from('sms_consent')
            .select('consented')
            .eq('client_phone', booking.client_phone)
            .maybeSingle()

          if (consent?.consented) {
            const message = smsReminder({
              clientName:  booking.client_name,
              salonName,
              masterName,
              serviceName: booking.service_name,
              date:        booking.date,
              time:        booking.time_slot,
              timezone,
            })
            await sendSMS(booking.client_phone, message)
            smsSent++
          }
        }

        await supabase
          .from('bookings')
          .update({ reminder_sent: true, reminder_sent_at: new Date().toISOString() })
          .eq('id', booking.id)

      } catch (err) {
        errors.push(`booking ${booking.id}: ${String(err)}`)
        console.error('Reminder failed for booking', booking.id, err)
      }
    }

    console.log(`Reminders: email=${emailSent} sms=${smsSent}/${bookings.length}`)
    return NextResponse.json({ ok: true, emailSent, smsSent, total: bookings.length, errors })
  } catch (err) {
    console.error('Cron reminders error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
