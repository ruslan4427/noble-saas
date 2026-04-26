import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { email, code, userId } = await req.json()
  if (!email || !code || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('email_otps')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  if (new Date(data.expires_at) < new Date()) {
    await supabaseAdmin.from('email_otps').delete().eq('email', email)
    return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 })
  }
  if (data.code !== code) return NextResponse.json({ error: 'Invalid code' }, { status: 400 })

  const { error: adminError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  })
  if (adminError) return NextResponse.json({ error: 'Verification failed' }, { status: 500 })

  await supabaseAdmin.from('email_otps').delete().eq('email', email)

  return NextResponse.json({ success: true })
}
