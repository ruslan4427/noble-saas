'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────
interface Staff {
  id: string
  name: string
  role: string
}

interface DaySchedule {
  day_of_week: number
  is_day_off: boolean
  work_start: string
  work_end: string
  break_start: string
  break_end: string
}

interface VacationBlock {
  id: string
  staff_id: string
  date_from: string
  date_to: string
  note: string
}

interface Props {
  orgId: string
  staff: Staff[]
}

// ── Constants ──────────────────────────────────────────────────────────────
const DAYS = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const DAYS_FULL = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П'ятниця', 'Субота']

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map((_, i) => ({
  day_of_week: i,
  is_day_off: i === 0 || i === 6,   // Sun & Sat off by default
  work_start: '09:00',
  work_end: '18:00',
  break_start: '13:00',
  break_end: '14:00',
}))

const TIME_OPTIONS: string[] = []
for (let h = 6; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

// ── Helpers ────────────────────────────────────────────────────────────────
function inputCls() {
  return 'bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs outline-none focus:border-[#C9A84C] transition'
}

// ── Component ──────────────────────────────────────────────────────────────
export default function StaffSchedule({ orgId, staff }: Props) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staff[0]?.id || '')
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE)
  const [vacations, setVacations] = useState<VacationBlock[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)

  // Vacation form
  const [vacFrom, setVacFrom] = useState('')
  const [vacTo, setVacTo] = useState('')
  const [vacNote, setVacNote] = useState('')
  const [vacSaving, setVacSaving] = useState(false)

  const supabase = createClient()

  const load = useCallback(async (staffId: string) => {
    if (!staffId) return
    setLoading(true)
    const [{ data: sched }, { data: vac }] = await Promise.all([
      supabase.from('staff_schedule').select('*').eq('staff_id', staffId).order('day_of_week'),
      supabase.from('vacation_blocks').select('*').eq('staff_id', staffId).order('date_from'),
    ])

    if (sched && sched.length === 7) {
      setSchedule(sched.map(r => ({
        day_of_week: r.day_of_week,
        is_day_off: r.is_day_off,
        work_start: r.work_start?.slice(0, 5) || '09:00',
        work_end: r.work_end?.slice(0, 5) || '18:00',
        break_start: r.break_start?.slice(0, 5) || '13:00',
        break_end: r.break_end?.slice(0, 5) || '14:00',
      })))
    } else {
      // No schedule yet — use defaults
      setSchedule(DEFAULT_SCHEDULE)
    }

    setVacations(vac || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (selectedStaffId) load(selectedStaffId)
  }, [selectedStaffId, load])

  // Update a single field in a day
  function updateDay(dow: number, field: keyof DaySchedule, value: string | boolean) {
    setSchedule(prev => prev.map(d =>
      d.day_of_week === dow ? { ...d, [field]: value } : d
    ))
  }

  async function handleSave() {
    if (!selectedStaffId) return
    setSaving(true)
    const rows = schedule.map(d => ({
      staff_id: selectedStaffId,
      org_id: orgId,
      day_of_week: d.day_of_week,
      is_day_off: d.is_day_off,
      work_start: d.is_day_off ? null : d.work_start,
      work_end: d.is_day_off ? null : d.work_end,
      break_start: d.is_day_off ? null : (d.break_start || null),
      break_end: d.is_day_off ? null : (d.break_end || null),
      updated_at: new Date().toISOString(),
    }))

    await supabase
      .from('staff_schedule')
      .upsert(rows, { onConflict: 'staff_id,day_of_week' })

    setSaving(false)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  async function handleAddVacation() {
    if (!vacFrom || !vacTo || !selectedStaffId) return
    setVacSaving(true)
    await supabase.from('vacation_blocks').insert({
      staff_id: selectedStaffId,
      org_id: orgId,
      date_from: vacFrom,
      date_to: vacTo,
      note: vacNote.trim() || null,
    })
    setVacFrom(''); setVacTo(''); setVacNote('')
    const { data } = await supabase.from('vacation_blocks').select('*').eq('staff_id', selectedStaffId).order('date_from')
    setVacations(data || [])
    setVacSaving(false)
  }

  async function handleDeleteVacation(id: string) {
    await supabase.from('vacation_blocks').delete().eq('id', id)
    setVacations(prev => prev.filter(v => v.id !== id))
  }

  const selectedStaff = staff.find(s => s.id === selectedStaffId)

  if (staff.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-white/40">
        Add staff members first to manage their schedules.
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Staff selector */}
      <div className="flex flex-wrap gap-2">
        {staff.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedStaffId(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedStaffId === s.id ? 'bg-[#C9A84C] text-black' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'}`}>
            {s.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin w-5 h-5 text-[#C9A84C]" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg>
        </div>
      ) : (
        <>
          {/* Weekly schedule */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Weekly schedule — {selectedStaff?.name}</h3>
              <div className="flex items-center gap-2">
                {savedMsg && <span className="text-green-400 text-xs">✓ Saved</span>}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#C9A84C] text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-[#e8d08a] transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save schedule'}
                </button>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-2 text-white/40 text-xs font-medium w-28">Day</th>
                    <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">Status</th>
                    <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">Work start</th>
                    <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">Work end</th>
                    <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">Break start</th>
                    <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">Break end</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map(day => (
                    <tr key={day.day_of_week} className={`border-b border-white/5 ${day.is_day_off ? 'opacity-40' : ''}`}>
                      <td className="px-4 py-2.5 font-medium text-white/70">{DAYS_FULL[day.day_of_week]}</td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => updateDay(day.day_of_week, 'is_day_off', !day.is_day_off)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition ${day.is_day_off
                            ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                            : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'}`}>
                          {day.is_day_off ? 'Day off' : 'Working'}
                        </button>
                      </td>
                      {(['work_start', 'work_end', 'break_start', 'break_end'] as const).map(field => (
                        <td key={field} className="px-4 py-2.5">
                          <select
                            value={day[field] as string}
                            onChange={e => updateDay(day.day_of_week, field, e.target.value)}
                            disabled={day.is_day_off}
                            className={inputCls() + ' disabled:opacity-30 disabled:cursor-not-allowed'}>
                            <option value="">—</option>
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/5">
              {schedule.map(day => (
                <div key={day.day_of_week} className={`px-4 py-3 ${day.is_day_off ? 'opacity-40' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white/80 text-sm">{DAYS_FULL[day.day_of_week]}</span>
                    <button
                      onClick={() => updateDay(day.day_of_week, 'is_day_off', !day.is_day_off)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition ${day.is_day_off
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                      {day.is_day_off ? 'Day off' : 'Working'}
                    </button>
                  </div>
                  {!day.is_day_off && (
                    <div className="grid grid-cols-2 gap-2">
                      {([['work_start','Start'],['work_end','End'],['break_start','Break start'],['break_end','Break end']] as const).map(([field, label]) => (
                        <div key={field}>
                          <p className="text-white/30 text-[10px] mb-1">{label}</p>
                          <select
                            value={day[field] as string}
                            onChange={e => updateDay(day.day_of_week, field, e.target.value)}
                            className={inputCls() + ' w-full'}>
                            <option value="">—</option>
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="px-4 py-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-[#C9A84C] text-black text-sm font-bold py-2.5 rounded-lg hover:bg-[#e8d08a] transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save schedule'}
                </button>
              </div>
            </div>
          </div>

          {/* Vacation / time off blocks */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="font-semibold text-sm">Vacation &amp; time off — {selectedStaff?.name}</h3>
              <p className="text-white/30 text-xs mt-0.5">Block specific date ranges. Clients won't be able to book during these periods.</p>
            </div>

            {/* Add vacation form */}
            <div className="px-4 py-4 border-b border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-white/40 text-xs mb-1 block">From</label>
                <input
                  type="date"
                  value={vacFrom}
                  onChange={e => setVacFrom(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={inputCls() + ' w-full'}
                />
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">To</label>
                <input
                  type="date"
                  value={vacTo}
                  onChange={e => setVacTo(e.target.value)}
                  min={vacFrom || new Date().toISOString().split('T')[0]}
                  className={inputCls() + ' w-full'}
                />
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">Note (optional)</label>
                <input
                  type="text"
                  value={vacNote}
                  onChange={e => setVacNote(e.target.value)}
                  placeholder="e.g. Vacation"
                  className={inputCls() + ' w-full'}
                />
              </div>
              <button
                onClick={handleAddVacation}
                disabled={!vacFrom || !vacTo || vacSaving}
                className="bg-[#C9A84C] text-black text-xs font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition disabled:opacity-40 h-[30px] self-end">
                {vacSaving ? 'Adding...' : '+ Add block'}
              </button>
            </div>

            {/* Vacation list */}
            {vacations.length === 0 ? (
              <div className="px-4 py-6 text-center text-white/30 text-sm">No vacation blocks yet.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {vacations.map(v => (
                  <div key={v.id} className="flex items-center justify-between px-4 py-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-400 flex-none" aria-hidden="true" />
                      <div>
                        <p className="text-white text-sm font-medium">
                          {v.date_from === v.date_to
                            ? new Date(v.date_from + 'T00:00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
                            : `${new Date(v.date_from + 'T00:00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })} — ${new Date(v.date_to + 'T00:00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}`
                          }
                        </p>
                        {v.note && <p className="text-white/30 text-xs">{v.note}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteVacation(v.id)}
                      aria-label="Delete vacation block"
                      className="text-white/20 hover:text-red-400 transition p-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
