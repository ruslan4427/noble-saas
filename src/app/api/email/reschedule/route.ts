import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBookingReminder } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const {
      org_id, client_name, client_email,
      master_name, service_name,
      old_date, old_time, new_date, new_time,
    } = await req.json()

    const { data: org } = await supabase
      .from('organizations').select('name, owner_id').eq('id', org_id).single()
    if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

    const { data: userData } = await supabase.auth.admin.getUserById(org.owner_id)
    const ownerEmail = userData?.user?.email

    const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    })

    const results: Record<string, string> = {}

    if (client_email) {
      const res = await sendBookingReminder({
        to: client_email,
        clientName: client_name,
        salonName: org.name,
        masterName: master_name,
        serviceName: service_name,
        date: `${fmt(new_date)} (rescheduled from ${fmt(old_date)} at ${old_time})`,
        time: new_time,
      })
      results.clientEmail = res.data?.id ?? 'sent'
    }

    if (ownerEmail) {
      const res = await sendBookingReminder({
        to: ownerEmail,
        clientName: `[RESCHEDULED] ${client_name}`,
        salonName: org.name,
        masterName: master_name,
        serviceName: service_name,
        date: `${fmt(new_date)} (was: ${fmt(old_date)} at ${old_time})`,
        time: new_time,
      })
      results.ownerEmail = res.data?.id ?? 'sent'
    }

    return NextResponse.json({ ok: true, results })
  } catch (err) {
    console.error('Reschedule email error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
