import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBookingReminder } from '@/lib/email'

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
      .select('id, client_name, client_email, service_name, date, time_slot, org_id, master_id')
      .eq('reminder_sent', false)
      .eq('status', 'confirmed')
      .not('client_email', 'is', null)
      .not('reminder_at', 'is', null)
      .lte('reminder_at', new Date().toISOString())

    if (error) throw error
    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }

    let sent = 0
    const errors: string[] = []

    for (const booking of bookings) {
      try {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', booking.org_id)
          .single()

        const { data: master } = await supabase
          .from('staff')
          .select('name')
          .eq('id', booking.master_id)
          .single()

        await sendBookingReminder({
          to: booking.client_email,
          clientName: booking.client_name,
          salonName: org?.name ?? 'Your salon',
          masterName: master?.name ?? 'Your master',
          serviceName: booking.service_name,
          date: new Date(booking.date).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          }),
          time: booking.time_slot,
        })

        // Mark sent — prevents duplicates on next cron run
        await supabase
          .from('bookings')
          .update({ reminder_sent: true, reminder_sent_at: new Date().toISOString() })
          .eq('id', booking.id)

        sent++
      } catch (err) {
        errors.push(`booking ${booking.id}: ${String(err)}`)
        console.error('Reminder failed for booking', booking.id, err)
      }
    }

    console.log(`Reminders: sent ${sent}/${bookings.length}`)
    return NextResponse.json({ ok: true, sent, total: bookings.length, errors })
  } catch (err) {
    console.error('Cron reminders error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
