import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Check if user already exists
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const existing = listData?.users?.find((u: { email?: string }) => u.email === email)

  if (existing) {
    const { data: org } = await supabaseAdmin
      .from('organizations').select('id').eq('owner_id', existing.id).maybeSingle()
    if (org) return NextResponse.json({ error: 'already_registered' }, { status: 409 })
    return NextResponse.json({ userId: existing.id })
  }

  // email_confirm:true prevents Supabase from attempting to send its own email.
  // Our custom OTP (via Resend) handles actual email verification.
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: name },
    email_confirm: true,
  })

  if (error || !data.user?.id) {
    return NextResponse.json({ error: error?.message || 'Signup failed' }, { status: 500 })
  }

  return NextResponse.json({ userId: data.user.id })
}
