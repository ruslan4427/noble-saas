import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { email, code, userId } = await req.json()
  if (!email || !code) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Use maybeSingle + order so stale duplicate rows don't cause a failure.
  const { data, error } = await supabaseAdmin
    .from('email_otps')
    .select('*')
    .eq('email', email)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  if (new Date(data.expires_at) < new Date()) {
    await supabaseAdmin.from('email_otps').delete().eq('email', email)
    return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 })
  }
  if (data.code !== code) return NextResponse.json({ error: 'Invalid code' }, { status: 400 })

  // Find the real user ID by email — avoids all user_id storage/retrieval issues.
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const foundUser = listData?.users?.find((u: { email?: string }) => u.email === email)
  const uid: string = foundUser?.id || data.user_id || userId
  if (!uid) return NextResponse.json({ error: 'User not found. Please sign up again.' }, { status: 400 })

  const { error: adminError } = await supabaseAdmin.auth.admin.updateUserById(uid, {
    email_confirm: true,
  })
  if (adminError) {
    console.error('[verify-otp] admin.updateUserById failed:', adminError)
    return NextResponse.json({ error: adminError.message }, { status: 500 })
  }

  await supabaseAdmin.from('email_otps').delete().eq('email', email)

  return NextResponse.json({ success: true })
}
