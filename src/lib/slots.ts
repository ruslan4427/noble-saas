import type { DaySchedule } from '@/types'

export interface Slot { time: string; available: boolean }

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function toTimeStr(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function isValidPhone(p: string): boolean {
  return p.replace(/\D/g, '').length >= 7
}

export function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

// DST-aware: converts a local-time slot (date string + minutes) to UTC milliseconds.
// Uses Intl to resolve the correct UTC offset for the given timezone and date.
export function localToUtcMs(dateStr: string, minutes: number, tz: string): number {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const localIso = `${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`

  // Parse as if it were UTC, then adjust for the actual offset in the target timezone
  const utcMs = new Date(localIso + 'Z').getTime()

  // Find what the clock reads in `tz` at that UTC moment
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(utcMs))

  const get = (t: string) => parseInt(parts.find(p => p.type === t)!.value, 10)
  const offsetMs = utcMs - Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'))

  return utcMs - offsetMs
}

interface CalendarBlock {
  staff_id:   string | null
  start_time: string
  end_time:   string
}

export function isSlotBlocked(
  dateStr:    string,
  slotMin:    number,
  slotEndMin: number,
  staffId:    string,
  blocks:     CalendarBlock[],
): boolean {
  return blocks.some(b => {
    if (b.staff_id !== null && b.staff_id !== staffId) return false
    const bs = new Date(b.start_time)
    const be = new Date(b.end_time)
    const bsMin = bs.getUTCHours() * 60 + bs.getUTCMinutes()
    const beMin = be.getUTCHours() * 60 + be.getUTCMinutes()
    const bd = `${bs.getUTCFullYear()}-${String(bs.getUTCMonth() + 1).padStart(2, '0')}-${String(bs.getUTCDate()).padStart(2, '0')}`
    return bd === dateStr && slotMin < beMin && slotEndMin > bsMin
  })
}

const DEFAULT_WORK_START = '09:00'
const DEFAULT_WORK_END   = '19:00'

export function buildSlots(
  date:            Date,
  schedule:        DaySchedule | null,
  bookedSlots:     string[],
  serviceDuration: number,
  blocks:          CalendarBlock[],
  staffId:         string,
): Slot[] {
  if (schedule?.is_day_off) return []

  const wsMin = toMinutes(schedule?.work_start || DEFAULT_WORK_START)
  const weMin = toMinutes(schedule?.work_end   || DEFAULT_WORK_END)

  const rawBsMin = schedule?.break_start ? toMinutes(schedule.break_start) : null
  const rawBeMin = schedule?.break_end   ? toMinutes(schedule.break_end)   : null
  const validBreak = rawBsMin !== null && rawBeMin !== null &&
    rawBsMin < rawBeMin && rawBsMin >= wsMin && rawBeMin <= weMin
  const bsMin = validBreak ? rawBsMin : null
  const beMin = validBreak ? rawBeMin : null

  const now     = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const cutoff  = isToday ? now.getHours() * 60 + now.getMinutes() : -1
  const ds      = toDateStr(date)

  const slots: Slot[] = []
  for (let min = wsMin; min + serviceDuration <= weMin; min += 30) {
    const end = min + serviceDuration
    if (isToday && min <= cutoff) continue
    if (bsMin !== null && beMin !== null && min < beMin && end > bsMin) continue
    const time = toTimeStr(min)
    const available = !isSlotBlocked(ds, min, end, staffId, blocks) && !bookedSlots.includes(time)
    slots.push({ time, available })
  }
  return slots
}
