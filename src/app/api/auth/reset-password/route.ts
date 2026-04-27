import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { email, token, password } = await req.json()
  if (!email || !token || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'Password too short' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('email_otps')
    .select('*')
    .eq('email', email)
    .eq('code', token)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 })
  if (new Date(data.expires_at) < new Date()) {
    await supabaseAdmin.from('email_otps').delete().eq('email', email)
    return NextResponse.json({ error: 'Link expired. Request a new one.' }, { status: 400 })
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, { password })
  if (updateError) return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })

  await supabaseAdmin.from('email_otps').delete().eq('email', email)

  return NextResponse.json({ success: true })
}
