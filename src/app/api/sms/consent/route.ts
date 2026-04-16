import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { org_id, client_phone, client_name, consented } = await req.json()
    if (!org_id || !client_phone) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data, error } = await supabase
      .from('sms_consent')
      .upsert({
        org_id,
        client_phone,
        client_name: client_name || null,
        consented: !!consented,
        consent_text: 'SMS reminders consent via booking form',
      }, {
        onConflict: 'org_id,client_phone',
        ignoreDuplicates: false,
      })
      .select('id, client_phone, consented')

    if (error) {
      console.error('SMS consent upsert error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('SMS consent saved:', JSON.stringify(data))
    return NextResponse.json({ ok: true, data })
  } catch (err) {
    console.error('SMS consent exception:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
