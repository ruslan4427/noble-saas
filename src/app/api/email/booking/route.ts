import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBookingConfirmation, sendBookingNotification } from '@/lib/email'
import { sendSMS, smsConfirmation, SMS_ENABLED } from '@/lib/sms'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const {
      org_id, client_name, client_phone, client_email,
      master_name, service_name, date, time, price_cents, booking_id,
      sms_consent,
    } = await req.json()

    if (!org_id || !client_name || !master_name || !service_name || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('name, owner_id, timezone')
      .eq('id', org_id)
      .single()

    if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

    const { data: userData } = await supabase.auth.admin.getUserById(org.owner_id)
    const ownerEmail = userData?.user?.email
    const price      = Math.round((price_cents || 0) / 100)
    const timezone   = org.timezone || 'America/New_York'
    const results: Record<string, string> = {}

    // 1. Email confirmation to client
    if (client_email) {
      const res = await sendBookingConfirmation({
        to: client_email, clientName: client_name, salonName: org.name,
        masterName: master_name, serviceName: service_name, date, time, price,
      })
      results.clientEmail = res.data?.id ?? 'sent'
    }

    // 2. Email notification to owner
    if (ownerEmail) {
      const res = await sendBookingNotification({
        to: ownerEmail, salonName: org.name, clientName: client_name,
        clientPhone: client_phone || '—', masterName: master_name,
        serviceName: service_name, date, time, price,
      })
      results.ownerEmail = res.data?.id ?? 'sent'
    }

    // 3. SMS confirmation
    if (SMS_ENABLED && client_phone) {
      if (sms_consent) {
        await supabase.from('sms_consent').upsert(
          { org_id, phone: client_phone, consented: true },
          { onConflict: 'org_id,phone' }
        )
      }

      const { data: consent } = await supabase
        .from('sms_consent')
        .select('consented')
        .eq('org_id', org_id)
        .eq('phone', client_phone)
        .maybeSingle()

      if (consent?.consented) {
        // Fetch exact YYYY-MM-DD date string if booking_id provided
        let dateStr = date
        if (booking_id) {
          const { data: b } = await supabase
            .from('bookings').select('date').eq('id', booking_id).single()
          if (b?.date) dateStr = b.date
        }

        const message = smsConfirmation({
          clientName:  client_name,
          salonName:   org.name,
          masterName:  master_name,
          serviceName: service_name,
          date:        dateStr,
          time,
          timezone,
        })

        try {
          const smsResult = await sendSMS(client_phone, message)
          results.clientSMS = smsResult?.sid ?? 'sent'
        } catch (smsErr) {
          console.warn('SMS confirmation failed (non-fatal):', smsErr)
          results.clientSMS = 'failed'
        }
      } else {
        results.clientSMS = 'no_consent'
      }
    }

    return NextResponse.json({ ok: true, results })
  } catch (err) {
    console.error('Email booking error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
