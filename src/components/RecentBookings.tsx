'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

interface Booking {
  id: string
  client_name: string
  client_phone: string
  service_name: string
  date: string
  time_slot: string
  price_cents: number
  status: string
  master_id: string
}

interface Staff {
  id: string
  name: string
}

interface Props {
  orgId: string
  staff: Staff[]
}

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  pending:   { label: 'Pending',   style: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
  confirmed: { label: 'Confirmed', style: 'bg-green-500/10 border-green-500/30 text-green-400' },
  completed: { label: 'Completed', style: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
  cancelled: { label: 'Cancelled', style: 'bg-red-500/10 border-red-500/30 text-red-400' },
  no_show:   { label: 'No-show',   style: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
}

// Quick actions available per status
const STATUS_ACTIONS: Record<string, { action: string; label: string; style: string }[]> = {
  pending: [
    { action: 'confirmed', label: 'Confirm', style: 'text-green-400 hover:bg-green-500/10 border-green-500/30' },
    { action: 'cancelled', label: 'Cancel',  style: 'text-red-400 hover:bg-red-500/10 border-red-500/30' },
  ],
  confirmed: [
    { action: 'completed', label: 'Complete', style: 'text-blue-400 hover:bg-blue-500/10 border-blue-500/30' },
    { action: 'no_show',   label: 'No-show',  style: 'text-orange-400 hover:bg-orange-500/10 border-orange-500/30' },
    { action: 'cancelled', label: 'Cancel',   style: 'text-red-400 hover:bg-red-500/10 border-red-500/30' },
  ],
  completed: [],
  cancelled: [],
  no_show:   [],
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

// ── Booking Row ────────────────────────────────────────────────────────────
function BookingRow({ booking, staffMap, onStatusChange }: {
  booking: Booking
  staffMap: Map<string, string>
  onStatusChange: (id: string, status: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  const statusCfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.confirmed
  const actions = STATUS_ACTIONS[booking.status] ?? []

  async function handleAction(newStatus: string) {
    setUpdating(newStatus)
    await onStatusChange(booking.id, newStatus)
    setUpdating(null)
  }

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-white/3 transition text-left"
        aria-expanded={expanded}>
        {/* Date badge */}
        <div className="flex-none text-center w-10">
          <p className="text-[#C9A84C] text-xs font-bold leading-none">{formatDate(booking.date)}</p>
          <p className="text-white/40 text-xs mt-0.5">{booking.time_slot}</p>
        </div>
        <div className="w-px h-8 bg-white/10 flex-none" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">{booking.client_name}</p>
          <p className="text-white/40 text-xs truncate">
            {booking.service_name}
            {staffMap.get(booking.master_id) && ` · ${staffMap.get(booking.master_id)}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-none">
          <span className="text-[#C9A84C] text-sm font-semibold">${(booking.price_cents / 100).toFixed(0)}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${statusCfg.style}`}>
            {statusCfg.label}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-white/20 transition-transform flex-none ${expanded ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-5 pb-4 pt-1 bg-white/3 border-t border-white/5">
          {/* Details */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3 mt-1">
            <div>
              <p className="text-white/30">Phone</p>
              <a href={`tel:${booking.client_phone}`} className="text-white/70 hover:text-white transition">{booking.client_phone}</a>
            </div>
            <div>
              <p className="text-white/30">Date</p>
              <p className="text-white/70">{new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })} at {booking.time_slot}</p>
            </div>
            <div>
              <p className="text-white/30">Service</p>
              <p className="text-white/70">{booking.service_name}</p>
            </div>
            <div>
              <p className="text-white/30">Master</p>
              <p className="text-white/70">{staffMap.get(booking.master_id) || '—'}</p>
            </div>
          </div>

          {/* Quick actions */}
          {actions.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {actions.map(({ action, label, style }) => (
                <button
                  key={action}
                  onClick={() => handleAction(action)}
                  disabled={!!updating}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition disabled:opacity-50 ${style}`}>
                  {updating === action ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg>
                      {label}...
                    </span>
                  ) : label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function RecentBookings({ orgId, staff }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'recent'>('upcoming')
  const supabase = createClient()

  const staffMap = new Map(staff.map(s => [s.id, s.name]))

  const load = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    let query = supabase
      .from('bookings').select('*').eq('org_id', orgId)
      .order('date', { ascending: filter === 'upcoming' })
      .order('time_slot', { ascending: true })
      .limit(20)

    if (filter === 'upcoming') {
      query = query.gte('date', today).not('status', 'in', '("cancelled","completed","no_show")')
    } else {
      query = query.lte('date', today)
    }

    const { data } = await query
    setBookings(data || [])
    setLoading(false)
  }, [orgId, filter])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(bookingId: string, newStatus: string) {
    // Optimistic update
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b))

    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId)

    if (error) {
      console.error('Status update failed:', error)
      // Rollback
      load()
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const todayBookings = bookings.filter(b => b.date === todayStr)
  const otherBookings = bookings.filter(b => b.date !== todayStr)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div>
          <h3 className="font-semibold text-white">Bookings</h3>
          {!loading && filter === 'upcoming' && (
            <p className="text-white/30 text-xs mt-0.5">
              {todayBookings.length > 0 ? `${todayBookings.length} today` : 'No bookings today'}
              {otherBookings.length > 0 && ` · ${otherBookings.length} upcoming`}
            </p>
          )}
        </div>
        <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          {(['upcoming', 'recent'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium transition capitalize ${filter === f ? 'bg-[#C9A84C] text-black' : 'text-white/40 hover:text-white'}`}>
              {f === 'upcoming' ? 'Upcoming' : 'Recent'}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <svg className="animate-spin w-5 h-5 text-[#C9A84C]" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/>
          </svg>
        </div>
      ) : bookings.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-white/30 text-sm">{filter === 'upcoming' ? 'No upcoming bookings' : 'No recent bookings'}</p>
          <p className="text-white/20 text-xs mt-1">Bookings will appear here when clients book online</p>
        </div>
      ) : (
        <div>
          {filter === 'upcoming' && todayBookings.length > 0 && (
            <>
              <div className="px-5 py-2 bg-[#C9A84C]/5 border-b border-white/5">
                <p className="text-[#C9A84C] text-xs font-semibold uppercase tracking-wide">Today</p>
              </div>
              {todayBookings.map(b => (
                <BookingRow key={b.id} booking={b} staffMap={staffMap} onStatusChange={handleStatusChange} />
              ))}
            </>
          )}
          {otherBookings.length > 0 && (
            <>
              {filter === 'upcoming' && todayBookings.length > 0 && (
                <div className="px-5 py-2 bg-white/3 border-b border-white/5">
                  <p className="text-white/30 text-xs font-semibold uppercase tracking-wide">Upcoming</p>
                </div>
              )}
              {otherBookings.map(b => (
                <BookingRow key={b.id} booking={b} staffMap={staffMap} onStatusChange={handleStatusChange} />
              ))}
            </>
          )}
          {bookings.length >= 20 && (
            <div className="px-5 py-3 border-t border-white/10 text-center">
              <p className="text-white/30 text-xs">Showing 20 most recent. Use Calendar tab to see all.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
