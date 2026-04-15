'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────
interface Booking {
  id: string
  client_name: string
  client_phone: string
  client_email: string | null
  service_name: string
  master_id: string
  date: string
  time_slot: string
  start_time: string
  price_cents: number
  status: string
}

interface Staff {
  id: string
  name: string
  role: string
}

interface Props {
  orgId: string
  orgTimezone: string
  staff: Staff[]
}

// ── Staff colour palette ───────────────────────────────────────────────────
const STAFF_COLORS = [
  { bg: 'bg-[#C9A84C]/20', border: 'border-[#C9A84C]', text: 'text-[#C9A84C]', dot: '#C9A84C' },
  { bg: 'bg-blue-500/20',  border: 'border-blue-400',  text: 'text-blue-400',  dot: '#60a5fa' },
  { bg: 'bg-emerald-500/20', border: 'border-emerald-400', text: 'text-emerald-400', dot: '#34d399' },
  { bg: 'bg-rose-500/20',  border: 'border-rose-400',  text: 'text-rose-400',  dot: '#fb7185' },
  { bg: 'bg-violet-500/20', border: 'border-violet-400', text: 'text-violet-400', dot: '#a78bfa' },
  { bg: 'bg-orange-500/20', border: 'border-orange-400', text: 'text-orange-400', dot: '#fb923c' },
]

function getStaffColor(index: number) {
  return STAFF_COLORS[index % STAFF_COLORS.length]
}

// ── Helpers ────────────────────────────────────────────────────────────────
function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatTime(timeSlot: string): string {
  return timeSlot
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

function formatDateFull(d: Date): string {
  return d.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 9) // 9..19

// ── Booking Modal ──────────────────────────────────────────────────────────
function BookingModal({ booking, staffList, staffColorMap, onClose }: {
  booking: Booking
  staffList: Staff[]
  staffColorMap: Map<string, typeof STAFF_COLORS[0]>
  onClose: () => void
}) {
  const staffMember = staffList.find(s => s.id === booking.master_id)
  const color = staffColorMap.get(booking.master_id) || STAFF_COLORS[0]

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
    pending:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    done:      'bg-white/10 text-white/50 border-white/20',
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog" aria-modal="true" aria-label="Деталі запису">

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div className="relative bg-[#1a1208] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-2xl">

        {/* Handle (mobile) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/20 rounded-full sm:hidden" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-start justify-between mb-5 mt-2 sm:mt-0">
          <div>
            <h2 className="font-bold text-white text-lg">{booking.client_name}</h2>
            <p className="text-white/50 text-sm">{booking.client_phone}</p>
          </div>
          <button onClick={onClose} aria-label="Закрити" className="text-white/40 hover:text-white transition p-1 -mr-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Details grid */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-none ${color.bg} border ${color.border}`} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={color.text}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <p className="text-white/40 text-xs">Майстер</p>
              <p className="text-white text-sm font-medium">{staffMember?.name ?? '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-white/5 border border-white/10" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/></svg>
            </div>
            <div>
              <p className="text-white/40 text-xs">Послуга</p>
              <p className="text-white text-sm font-medium">{booking.service_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-white/5 border border-white/10" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <p className="text-white/40 text-xs">Дата і час</p>
              <p className="text-white text-sm font-medium">
                {new Date(booking.date + 'T00:00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })} о {booking.time_slot}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-white/5 border border-white/10" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <p className="text-white/40 text-xs">Вартість</p>
              <p className="text-[#C9A84C] text-sm font-bold">${(booking.price_cents / 100).toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize ${statusColors[booking.status] ?? statusColors.confirmed}`}>
            {booking.status}
          </span>
          {booking.client_email && (
            <a href={`mailto:${booking.client_email}`} className="text-white/40 hover:text-white text-xs transition">
              {booking.client_email}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Week View ──────────────────────────────────────────────────────────────
function WeekView({ weekStart, bookings, staffColorMap, onBookingClick }: {
  weekStart: Date
  bookings: Booking[]
  staffColorMap: Map<string, typeof STAFF_COLORS[0]>
  onBookingClick: (b: Booking) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Day headers */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-white/10 mb-1">
          <div />
          {days.map(d => {
            const isToday = isSameDay(d, today)
            return (
              <div key={d.toISOString()} className="text-center pb-2 px-1">
                <p className="text-white/40 text-xs uppercase tracking-wide">
                  {d.toLocaleDateString('uk-UA', { weekday: 'short' })}
                </p>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto mt-1 text-sm font-bold ${isToday ? 'bg-[#C9A84C] text-black' : 'text-white/70'}`}>
                  {d.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time grid */}
        <div className="relative">
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-[48px_repeat(7,1fr)] min-h-[56px]">
              <div className="text-white/20 text-xs pr-2 pt-0.5 text-right select-none">{`${String(hour).padStart(2,'0')}:00`}</div>
              {days.map(d => {
                const dayBookings = bookings.filter(b => {
                  if (b.date !== `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`) return false
                  const bHour = parseInt(b.time_slot.split(':')[0])
                  return bHour === hour
                })
                return (
                  <div key={d.toISOString()} className={`border-t border-white/5 px-0.5 pt-0.5 relative ${isSameDay(d, today) ? 'bg-[#C9A84C]/3' : ''}`}>
                    {dayBookings.map(b => {
                      const color = staffColorMap.get(b.master_id) || STAFF_COLORS[0]
                      return (
                        <button
                          key={b.id}
                          onClick={() => onBookingClick(b)}
                          className={`w-full text-left rounded px-1.5 py-1 mb-0.5 border-l-2 ${color.bg} ${color.border} hover:brightness-125 transition cursor-pointer`}
                          aria-label={`${b.client_name} — ${b.service_name} о ${b.time_slot}`}>
                          <p className={`text-xs font-semibold truncate ${color.text}`}>{b.client_name}</p>
                          <p className="text-white/40 text-[10px] truncate">{b.service_name}</p>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Day View ───────────────────────────────────────────────────────────────
function DayView({ date, bookings, staffColorMap, onBookingClick }: {
  date: Date
  bookings: Booking[]
  staffColorMap: Map<string, typeof STAFF_COLORS[0]>
  onBookingClick: (b: Booking) => void
}) {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
  const dayBookings = bookings.filter(b => b.date === dateStr)

  return (
    <div>
      <div className="mb-3 text-white/50 text-sm font-medium">{formatDateFull(date)}</div>
      {HOURS.map(hour => {
        const slotBookings = dayBookings.filter(b => parseInt(b.time_slot.split(':')[0]) === hour)
        return (
          <div key={hour} className="flex gap-3 min-h-[52px] border-t border-white/5">
            <div className="w-12 text-white/20 text-xs pt-1 text-right flex-none select-none">{`${String(hour).padStart(2,'0')}:00`}</div>
            <div className="flex-1 py-0.5 space-y-1">
              {slotBookings.map(b => {
                const color = staffColorMap.get(b.master_id) || STAFF_COLORS[0]
                return (
                  <button
                    key={b.id}
                    onClick={() => onBookingClick(b)}
                    className={`w-full text-left rounded-lg px-3 py-2 border-l-2 ${color.bg} ${color.border} hover:brightness-125 transition`}
                    aria-label={`${b.client_name} — ${b.service_name} о ${b.time_slot}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${color.text}`}>{b.client_name}</p>
                        <p className="text-white/50 text-xs">{b.service_name} · {b.time_slot}</p>
                      </div>
                      <span className="text-white/30 text-xs flex-none">${(b.price_cents/100).toFixed(0)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      {dayBookings.length === 0 && (
        <div className="text-center py-12 text-white/20 text-sm">Записів немає</div>
      )}
    </div>
  )
}

// ── Main Calendar Component ────────────────────────────────────────────────
export default function BookingCalendar({ orgId, orgTimezone, staff }: Props) {
  const [view, setView] = useState<'week' | 'day'>('week')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStaff, setFilterStaff] = useState<string>('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const supabase = createClient()

  // Build staff → color map
  const staffColorMap = new Map(
    staff.map((s, i) => [s.id, getStaffColor(i)])
  )

  // Date range for query
  const weekStart = startOfWeek(currentDate)
  const rangeStart = view === 'week'
    ? weekStart
    : new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
  const rangeEnd = view === 'week' ? addDays(weekStart, 7) : addDays(rangeStart, 1)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const start = rangeStart.toISOString().split('T')[0]
    const end = rangeEnd.toISOString().split('T')[0]

    let query = supabase
      .from('bookings')
      .select('*')
      .eq('org_id', orgId)
      .gte('date', start)
      .lt('date', end)
      .neq('status', 'cancelled')
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true })

    if (filterStaff !== 'all') {
      query = query.eq('master_id', filterStaff)
    }

    const { data } = await query
    setBookings(data || [])
    setLoading(false)
  }, [orgId, filterStaff, rangeStart.toISOString(), rangeEnd.toISOString()])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  function goToToday() { setCurrentDate(new Date()) }

  function goPrev() {
    if (view === 'week') setCurrentDate(d => addDays(d, -7))
    else setCurrentDate(d => addDays(d, -1))
  }

  function goNext() {
    if (view === 'week') setCurrentDate(d => addDays(d, 7))
    else setCurrentDate(d => addDays(d, 1))
  }

  // Header label
  const headerLabel = view === 'week'
    ? `${formatDate(weekStart)} — ${formatDate(addDays(weekStart, 6))}`
    : formatDate(currentDate)

  const isToday = view === 'day' && isSameDay(currentDate, new Date())
  const isCurrentWeek = view === 'week' && isSameDay(weekStart, startOfWeek(new Date()))

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">

        {/* Left: nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            disabled={isToday || isCurrentWeek}
            className="text-xs font-semibold px-3 py-1.5 rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition disabled:opacity-30 disabled:cursor-default">
            Today
          </button>
          <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
            <button onClick={goPrev} aria-label="Попередній" className="px-3 py-1.5 text-white/50 hover:text-white hover:bg-white/5 transition min-h-[32px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="px-3 py-1.5 text-white/80 text-sm font-medium border-x border-white/10 whitespace-nowrap">{headerLabel}</span>
            <button onClick={goNext} aria-label="Наступний" className="px-3 py-1.5 text-white/50 hover:text-white hover:bg-white/5 transition min-h-[32px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        {/* Right: filters + view toggle */}
        <div className="flex items-center gap-2">
          {/* Staff filter */}
          {staff.length > 1 && (
            <select
              value={filterStaff}
              onChange={e => setFilterStaff(e.target.value)}
              aria-label="Фільтр по майстру"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/70 outline-none focus:border-[#C9A84C] transition">
              <option value="all">Всі майстри</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          {/* View toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            {(['week', 'day'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-semibold transition capitalize ${view === v ? 'bg-[#C9A84C] text-black' : 'text-white/50 hover:text-white'}`}>
                {v === 'week' ? 'Тиждень' : 'День'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Staff legend */}
      {staff.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {staff.map((s, i) => {
            const color = getStaffColor(i)
            return (
              <button
                key={s.id}
                onClick={() => setFilterStaff(filterStaff === s.id ? 'all' : s.id)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition ${filterStaff === s.id || filterStaff === 'all' ? `${color.bg} ${color.border} ${color.text}` : 'border-white/10 text-white/30'}`}>
                <span className="w-2 h-2 rounded-full" style={{ background: color.dot }} aria-hidden="true" />
                {s.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Calendar body */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0F0A00]/50 rounded-xl z-10">
            <svg className="animate-spin w-5 h-5 text-[#C9A84C]" viewBox="0 0 24 24" fill="none" aria-label="Завантаження"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg>
          </div>
        )}

        {view === 'week' && (
          <WeekView
            weekStart={weekStart}
            bookings={bookings}
            staffColorMap={staffColorMap}
            onBookingClick={setSelectedBooking}
          />
        )}
        {view === 'day' && (
          <DayView
            date={currentDate}
            bookings={bookings}
            staffColorMap={staffColorMap}
            onBookingClick={setSelectedBooking}
          />
        )}
      </div>

      {/* Timezone note */}
      {orgTimezone && (
        <p className="text-white/20 text-xs text-right">Timezone: {orgTimezone}</p>
      )}

      {/* Modal */}
      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          staffList={staff}
          staffColorMap={staffColorMap}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  )
}
