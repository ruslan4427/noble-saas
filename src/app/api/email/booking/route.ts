import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBookingConfirmation, sendBookingNotification } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { org_id, client_name, client_phone, client_email, master_name, service_name, date, time, price_cents } = await req.json()
    if (!org_id || !client_name || !master_name || !service_name || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const { data: org } = await supabase.from('organizations').select('name, owner_id').eq('id', org_id).single()
    if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })
    const { data: userData } = await supabase.auth.admin.getUserById(org.owner_id)
    const ownerEmail = userData?.user?.email
    const price = Math.round((price_cents || 0) / 100)
    const results: Record<string, string> = {}
    if (client_email) {
      const res = await sendBookingConfirmation({ to: client_email, clientName: client_name, salonName: org.name, masterName: master_name, serviceName: service_name, date, time, price })
      results.client = res.data?.id ?? 'sent'
    }
    if (ownerEmail) {
      const res = await sendBookingNotification({ to: ownerEmail, salonName: org.name, clientName: client_name, clientPhone: client_phone || '—', masterName: master_name, serviceName: service_name, date, time, price })
      results.owner = res.data?.id ?? 'sent'
    }
    return NextResponse.json({ ok: true, results })
  } catch (err) {
    console.error('Email booking error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
