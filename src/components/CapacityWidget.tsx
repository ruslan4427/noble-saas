'use client'
import { useEffect, useState } from 'react'

interface StaffStat {
  id: string
  name: string
  available_slots: number
  booked_slots: number
  utilization_pct: number
}

interface DailyStat {
  date: string
  available_slots: number
  booked_slots: number
  utilization_pct: number
}

interface CapacityData {
  period: { from: string; to: string; days: number }
  totals: {
    available_slots: number
    booked_slots: number
    utilization_pct: number
    revenue_cents: number
  }
  today: {
    available_slots: number
    booked_slots: number
    utilization_pct: number
  }
  staff: StaffStat[]
  daily: DailyStat[]
}

function UtilBar({ pct }: { pct: number }) {
  const color = pct >= 75 ? 'bg-green-500' : pct >= 40 ? 'bg-[#C9A84C]' : 'bg-white/25'
  return (
    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-white/40 text-xs mb-1">{label}</p>
      <p className="text-2xl font-bold text-white leading-none">{value}</p>
      {sub && <p className="text-white/30 text-xs mt-1.5">{sub}</p>}
    </div>
  )
}

export default function CapacityWidget({ orgId }: { orgId: string }) {
  const [data, setData] = useState<CapacityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    // Pass today in the browser's local timezone so the route date range is correct.
    const today = new Date().toLocaleDateString('en-CA') // 'YYYY-MM-DD' local
    fetch(`/api/analytics/capacity?org_id=${orgId}&today=${today}`, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [orgId])

  if (loading) return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-8 flex items-center justify-center">
      <svg className="animate-spin w-5 h-5 text-[#C9A84C]" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/>
      </svg>
    </div>
  )

  if (error || !data) return null

  const maxAvail = Math.max(...data.daily.map(d => d.available_slots), 1)
  const labelDates = (() => {
    const d = data.daily
    if (!d.length) return { from: '', mid: '', to: '' }
    const fmt = (s: string) => {
      const [, m, day] = s.split('-')
      return `${parseInt(m)}/${parseInt(day)}`
    }
    return {
      from: fmt(d[0].date),
      mid:  fmt(d[Math.floor(d.length / 2)].date),
      to:   fmt(d[d.length - 1].date),
    }
  })()

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div>
          <h3 className="font-semibold text-white">Capacity</h3>
          <p className="text-white/30 text-xs mt-0.5">Last 30 days · {data.period.from} – {data.period.to}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className={`px-2 py-0.5 rounded-full border font-medium ${
            data.totals.utilization_pct >= 75
              ? 'border-green-500/30 text-green-400 bg-green-500/10'
              : data.totals.utilization_pct >= 40
              ? 'border-[#C9A84C]/30 text-[#C9A84C] bg-[#C9A84C]/10'
              : 'border-white/10 text-white/40'
          }`}>
            {data.totals.utilization_pct}% utilized
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Available slots"
            value={data.totals.available_slots.toLocaleString()}
            sub="30-min increments"
          />
          <StatCard
            label="Booked slots"
            value={data.totals.booked_slots.toLocaleString()}
            sub={`${data.totals.utilization_pct}% of capacity`}
          />
          <StatCard
            label="Utilization"
            value={`${data.totals.utilization_pct}%`}
            sub="booked / available"
          />
          <StatCard
            label="Revenue"
            value={`$${Math.round(data.totals.revenue_cents / 100).toLocaleString()}`}
            sub="confirmed + completed"
          />
        </div>

        {/* Today */}
        <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-xl px-5 py-3 flex items-center gap-5">
          <div className="flex-none">
            <p className="text-[#C9A84C] text-xs font-semibold uppercase tracking-wide">Today</p>
            <p className="text-white text-sm font-bold mt-0.5">
              {data.today.booked_slots}
              <span className="text-white/30 font-normal"> / {data.today.available_slots} slots</span>
            </p>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Utilization</span>
              <span className="text-white font-semibold">{data.today.utilization_pct}%</span>
            </div>
            <UtilBar pct={data.today.utilization_pct} />
          </div>
        </div>

        {/* Daily bar chart */}
        <div>
          <p className="text-white/40 text-xs mb-3">Daily bookings vs capacity</p>
          <div className="flex items-end gap-px h-20">
            {data.daily.map(d => (
              <div
                key={d.date}
                className="flex-1 flex flex-col-reverse gap-px group relative"
                title={`${d.date}: ${d.booked_slots} booked / ${d.available_slots} available (${d.utilization_pct}%)`}
              >
                {/* booked */}
                <div
                  className="w-full bg-[#C9A84C] group-hover:bg-[#e8d08a] transition-colors rounded-sm"
                  style={{ height: `${(d.booked_slots / maxAvail) * 80}px` }}
                />
                {/* remaining capacity */}
                <div
                  className="w-full bg-white/10 rounded-sm"
                  style={{ height: `${((d.available_slots - d.booked_slots) / maxAvail) * 80}px` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-white/25 text-[10px] mt-1.5 select-none">
            <span>{labelDates.from}</span>
            <span>{labelDates.mid}</span>
            <span>{labelDates.to}</span>
          </div>
          <div className="flex items-center gap-4 mt-2.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#C9A84C]" />
              <span className="text-white/35 text-xs">Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-white/10" />
              <span className="text-white/35 text-xs">Available</span>
            </div>
          </div>
        </div>

        {/* Staff utilization */}
        {data.staff.length > 0 && (
          <div>
            <p className="text-white/40 text-xs mb-3">Staff utilization</p>
            <div className="space-y-3">
              {data.staff
                .slice()
                .sort((a, b) => b.utilization_pct - a.utilization_pct)
                .map(s => (
                  <div key={s.id}>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-white text-sm">{s.name}</span>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <span>{s.booked_slots}/{s.available_slots}</span>
                        <span className={`font-semibold ${
                          s.utilization_pct >= 75 ? 'text-green-400'
                          : s.utilization_pct >= 40 ? 'text-[#C9A84C]'
                          : 'text-white/50'
                        }`}>{s.utilization_pct}%</span>
                      </div>
                    </div>
                    <UtilBar pct={s.utilization_pct} />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
