import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { buildSlots, toMinutes, toTimeStr } from '@/lib/slots'
import type { DaySchedule } from '@/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date      = searchParams.get('date')       // YYYY-MM-DD
  const staffId   = searchParams.get('staff_id')
  const orgId     = searchParams.get('org_id')
  const duration  = parseInt(searchParams.get('duration') || '30', 10)

  if (!date || !staffId || !orgId) {
    return NextResponse.json({ error: 'Missing date, staff_id or org_id' }, { status: 400 })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 })
  }

  const dow = new Date(date + 'T12:00:00Z').getDay()

  const [schedRes, bookedRes, blockRes, vacRes] = await Promise.all([
    supabaseAdmin
      .from('staff_schedule')
      .select('is_day_off,work_start,work_end,break_start,break_end')
      .eq('staff_id', staffId)
      .eq('day_of_week', dow)
      .maybeSingle(),

    supabaseAdmin
      .from('bookings')
      .select('time_slot, duration_min')
      .eq('master_id', staffId)
      .eq('date', date)
      .in('status', ['confirmed', 'pending']),

    supabaseAdmin
      .from('calendar_blocks')
      .select('staff_id,start_time,end_time')
      .eq('org_id', orgId)
      .or(`staff_id.eq.${staffId},staff_id.is.null`)
      .lt('start_time', date + 'T23:59:59Z')
      .gt('end_time',   date + 'T00:00:00Z'),

    supabaseAdmin
      .from('vacation_blocks')
      .select('id')
      .eq('staff_id', staffId)
      .lte('date_from', date)
      .gte('date_to',   date)
      .limit(1),
  ])

  if (vacRes.data && vacRes.data.length > 0) {
    return NextResponse.json({ slots: [], reason: 'vacation' })
  }

  const schedule = schedRes.data as DaySchedule | null
  const blocks   = blockRes.data ?? []

  // Expand each booking into all 30-min sub-slots it occupies.
  // Also normalise time_slot to HH:MM — DB may return HH:MM:SS if column is `time` type.
  const booked = (bookedRes.data ?? []).flatMap(b => {
    const raw = (b.time_slot ?? '').slice(0, 5)  // "10:00:00" → "10:00"
    const startMin = toMinutes(raw)
    const dur = b.duration_min ?? 30
    const slots: string[] = []
    for (let m = startMin; m < startMin + dur; m += 30) {
      slots.push(toTimeStr(m))
    }
    return slots
  })

  const slots = buildSlots(
    new Date(date + 'T12:00:00Z'),
    schedule,
    booked,
    duration,
    blocks,
    staffId,
  )

  return NextResponse.json({ slots }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  })
}
