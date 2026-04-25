import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { toMinutes, toDateStr } from '@/lib/slots'
import { DEFAULT_WORK_START, DEFAULT_WORK_END } from '@/constants'
import type { DaySchedule } from '@/types'

export const dynamic = 'force-dynamic'

// Slots available in a working day (30-min increments, break excluded).
function slotsForDay(sched: DaySchedule | null): number {
  if (sched?.is_day_off) return 0
  const ws = toMinutes(sched?.work_start || DEFAULT_WORK_START)
  const we = toMinutes(sched?.work_end   || DEFAULT_WORK_END)
  const bs = sched?.break_start ? toMinutes(sched.break_start) : null
  const be = sched?.break_end   ? toMinutes(sched.break_end)   : null
  const breakMins = bs !== null && be !== null && bs < be ? be - bs : 0
  return Math.max(0, Math.floor((we - ws - breakMins) / 30))
}

function utilPct(booked: number, available: number): number {
  return available === 0 ? 0 : Math.round((booked / available) * 100)
}

// Parse YYYY-MM-DD without timezone ambiguity.
function dowFromDateStr(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('org_id')
  if (!orgId) return NextResponse.json({ error: 'Missing org_id' }, { status: 400 })

  // Accept today from the client so the date range reflects the browser's local timezone.
  const todayParam = searchParams.get('today')
  const todayDate  = todayParam ? new Date(todayParam + 'T12:00:00Z') : new Date()
  const todayStr   = todayParam ?? toDateStr(todayDate)
  const fromDate   = new Date(todayDate)
  fromDate.setDate(fromDate.getDate() - 29)
  const fromStr = toDateStr(fromDate)

  // Step 1 — staff list
  const { data: staff } = await supabaseAdmin
    .from('staff')
    .select('id, name')
    .eq('org_id', orgId)
    .eq('is_active', true)

  if (!staff || staff.length === 0) {
    const zero = { available_slots: 0, booked_slots: 0, utilization_pct: 0 }
    return NextResponse.json({
      period:  { from: fromStr, to: todayStr, days: 30 },
      totals:  { ...zero, revenue_cents: 0 },
      today:   zero,
      staff:   [],
      daily:   [],
    })
  }

  const staffIds = staff.map(s => s.id)

  // Step 2 — parallel fetch
  const [schedulesRes, vacationsRes, bookingsRes] = await Promise.all([
    supabaseAdmin
      .from('staff_schedule')
      .select('staff_id, day_of_week, is_day_off, work_start, work_end, break_start, break_end')
      .in('staff_id', staffIds),
    supabaseAdmin
      .from('vacation_blocks')
      .select('staff_id, date_from, date_to')
      .in('staff_id', staffIds)
      .lte('date_from', todayStr)
      .gte('date_to', fromStr),
    supabaseAdmin
      .from('bookings')
      .select('master_id, date, price_cents')
      .eq('org_id', orgId)
      .gte('date', fromStr)
      .lte('date', todayStr)
      .in('status', ['confirmed', 'completed', 'pending']),
  ])

  const schedules = schedulesRes.data ?? []
  const vacations = vacationsRes.data ?? []
  const bookings  = bookingsRes.data  ?? []

  // scheduleMap[staffId][dow] = DaySchedule
  const scheduleMap = new Map<string, Map<number, DaySchedule>>()
  for (const row of schedules) {
    if (!scheduleMap.has(row.staff_id)) scheduleMap.set(row.staff_id, new Map())
    scheduleMap.get(row.staff_id)!.set(row.day_of_week, row as DaySchedule)
  }

  // bookingCount[staffId][date] = count
  const bookingCount = new Map<string, Map<string, number>>()
  let totalRevenue = 0

  for (const b of bookings) {
    if (!bookingCount.has(b.master_id)) bookingCount.set(b.master_id, new Map())
    const prevCount = bookingCount.get(b.master_id)!.get(b.date) ?? 0
    bookingCount.get(b.master_id)!.set(b.date, prevCount + 1)
    totalRevenue += b.price_cents ?? 0
  }

  // 30-day date range (local dates, no UTC shift)
  const dates: string[] = []
  for (let d = new Date(fromDate); toDateStr(d) <= todayStr; d.setDate(d.getDate() + 1)) {
    dates.push(toDateStr(d))
  }

  // Per-staff aggregation
  const staffStats = staff.map(member => {
    let available = 0
    let booked    = 0
    const dowMap        = scheduleMap.get(member.id)
    const memberVacations = vacations.filter(v => v.staff_id === member.id)

    for (const dateStr of dates) {
      const onVacation = memberVacations.some(v => v.date_from <= dateStr && v.date_to >= dateStr)
      if (onVacation) continue
      const sched = dowMap?.get(dowFromDateStr(dateStr)) ?? null
      available += slotsForDay(sched)
      booked    += bookingCount.get(member.id)?.get(dateStr) ?? 0
    }

    return {
      id:              member.id,
      name:            member.name,
      available_slots: available,
      booked_slots:    booked,
      utilization_pct: utilPct(booked, available),
    }
  })

  // Daily aggregation
  const daily = dates.map(dateStr => {
    let available = 0
    let booked    = 0

    for (const member of staff) {
      const onVacation = vacations.some(v => v.staff_id === member.id && v.date_from <= dateStr && v.date_to >= dateStr)
      if (onVacation) continue
      const sched = scheduleMap.get(member.id)?.get(dowFromDateStr(dateStr)) ?? null
      available += slotsForDay(sched)
      booked    += bookingCount.get(member.id)?.get(dateStr) ?? 0
    }

    return {
      date:            dateStr,
      available_slots: available,
      booked_slots:    booked,
      utilization_pct: utilPct(booked, available),
    }
  })

  const totalAvailable = staffStats.reduce((s, m) => s + m.available_slots, 0)
  const totalBooked    = staffStats.reduce((s, m) => s + m.booked_slots,    0)
  const todayDay       = daily.find(d => d.date === todayStr)

  return NextResponse.json({
    period: { from: fromStr, to: todayStr, days: 30 },
    totals: {
      available_slots: totalAvailable,
      booked_slots:    totalBooked,
      utilization_pct: utilPct(totalBooked, totalAvailable),
      revenue_cents:   totalRevenue,
    },
    today: todayDay
      ? { available_slots: todayDay.available_slots, booked_slots: todayDay.booked_slots, utilization_pct: todayDay.utilization_pct }
      : { available_slots: 0, booked_slots: 0, utilization_pct: 0 },
    staff: staffStats,
    daily,
  })
}
