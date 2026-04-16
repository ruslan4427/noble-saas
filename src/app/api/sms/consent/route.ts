import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { org_id, client_phone, client_name, consented } = await req.json()
    if (!org_id || !client_phone) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const { error } = await supabase.from('sms_consent').upsert({
      org_id,
      client_phone,
      client_name: client_name || null,
      consented: !!consented,
    }, { onConflict: 'org_id,client_phone' })
    if (error) {
      console.error('SMS consent error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('SMS consent error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
