import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const PLAN_STAFF_LIMIT: Record<string, number> = { starter: 5 }

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { org_id, name, role, avatar_url } = await req.json()
  if (!org_id || !name?.trim()) return NextResponse.json({ error: 'Invalid params' }, { status: 400 })

  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id, plan_id, work_start, work_end')
    .eq('id', org_id)
    .eq('owner_id', user.id)
    .single()
  if (!org) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const limit = PLAN_STAFF_LIMIT[org.plan_id]
  if (limit !== undefined) {
    const { count } = await supabaseAdmin
      .from('staff')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org_id)
      .eq('is_active', true)
    if ((count ?? 0) >= limit) {
      return NextResponse.json({ error: 'Staff limit reached' }, { status: 403 })
    }
  }

  const { data: inserted, error } = await supabaseAdmin
    .from('staff')
    .insert({ org_id, name: name.trim(), role: role?.trim() ?? '' })
    .select('id, name, role, is_active, avatar_url')
    .single()
  if (error || !inserted) return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })

  if (avatar_url) {
    await supabaseAdmin.from('staff').update({ avatar_url }).eq('id', inserted.id)
    inserted.avatar_url = avatar_url
  }

  const workStart = org.work_start ?? '09:00'
  const workEnd = org.work_end ?? '19:00'
  const scheduleRows = Array.from({ length: 7 }, (_, dow) => ({
    staff_id: inserted.id, org_id,
    day_of_week: dow, is_day_off: false,
    work_start: workStart, work_end: workEnd,
    break_start: '13:00', break_end: '14:00',
  }))
  await supabaseAdmin.from('staff_schedule').upsert(scheduleRows, { onConflict: 'staff_id,day_of_week' })

  return NextResponse.json({ staff: inserted })
}
