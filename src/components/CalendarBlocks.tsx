'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import TimePicker from '@/components/TimePicker'

interface Staff { id: string; name: string }
interface Block {
  id: string
  org_id: string
  staff_id: string | null
  start_time: string
  end_time: string
  reason: string
  type: 'time' | 'full_day'
}

interface Props {
  orgId: string
  staff: Staff[]
}

function formatDT(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function toLocalInput(iso: string): string {
  // Convert ISO to local datetime-local input value
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function todayDateStr(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

function nowPlusHours(h: number): string {
  const d = new Date(Date.now() + h * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C] transition placeholder-white/20'

export default function CalendarBlocks({ orgId, staff }: Props) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState<Block | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [formType, setFormType] = useState<'time' | 'full_day'>('time')
  const [formStaffId, setFormStaffId] = useState<string>('all')
  const [formDate, setFormDate] = useState('')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')
  const [formReason, setFormReason] = useState('')
  const [formError, setFormError] = useState('')

  const supabase = useMemo(() => createClient(), [])

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('calendar_blocks')
      .select('*')
      .eq('org_id', orgId)
      .order('start_time', { ascending: true })
    setBlocks(data || [])
    setLoading(false)
  }, [orgId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  function openAddForm() {
    setEditingBlock(null)
    setFormType('time')
    setFormStaffId('all')
    setFormDate(todayDateStr())
    setFormStart(nowPlusHours(1))
    setFormEnd(nowPlusHours(2))
    setFormReason('')
    setFormError('')
    setShowForm(true)
  }

  function openEditForm(block: Block) {
    setEditingBlock(block)
    setFormType(block.type || 'time')
    setFormStaffId(block.staff_id || 'all')
    if (block.type === 'full_day') {
      const d = new Date(block.start_time)
      const pad = (n: number) => String(n).padStart(2, '0')
      setFormDate(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`)
    } else {
      setFormDate(todayDateStr())
    }
    setFormStart(toLocalInput(block.start_time))
    setFormEnd(toLocalInput(block.end_time))
    setFormReason(block.reason)
    setFormError('')
    setShowForm(true)
  }

  async function handleSave() {
    setFormError('')
    if (!formReason.trim()) { setFormError('Reason is required'); return }

    let startISO: string
    let endISO: string
    if (formType === 'full_day') {
      if (!formDate) { setFormError('Date is required'); return }
      // Store as local midnight so local date parts match on the booking page
      startISO = new Date(formDate + 'T00:00:00').toISOString()
      endISO = new Date(formDate + 'T23:59:59').toISOString()
    } else {
      if (!formStart || !formEnd) { setFormError('Start and end time are required'); return }
      startISO = new Date(formStart).toISOString()
      endISO = new Date(formEnd).toISOString()
      if (new Date(endISO) <= new Date(startISO)) { setFormError('End time must be after start time'); return }
    }

    setSaving(true)
    const payload = {
      org_id: orgId,
      staff_id: formStaffId === 'all' ? null : formStaffId,
      start_time: startISO,
      end_time: endISO,
      reason: formReason.trim(),
      type: formType,
      updated_at: new Date().toISOString(),
    }

    if (editingBlock) {
      const { error } = await supabase.from('calendar_blocks').update(payload).eq('id', editingBlock.id)
      if (error) { setFormError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('calendar_blocks').insert(payload)
      if (error) { setFormError(error.message); setSaving(false); return }
    }

    setSaving(false)
    setShowForm(false)
    setEditingBlock(null)
    load()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabase.from('calendar_blocks').delete().eq('id', id)
    setBlocks(prev => prev.filter(b => b.id !== id))
    setDeleting(null)
  }

  // Split blocks: upcoming vs past
  const now = new Date().toISOString()
  const upcoming = blocks.filter(b => b.end_time > now)
  const past = blocks.filter(b => b.end_time <= now)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">Time blocks</h3>
          <p className="text-white/30 text-xs mt-0.5">Block calendar time — prevents client bookings during these periods</p>
        </div>
        <button onClick={openAddForm}
          className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#e8d08a] transition">
          + Add block
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white/5 border border-[#C9A84C]/30 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-semibold text-[#C9A84C]">
            {editingBlock ? 'Edit block' : 'New block'}
          </h4>

          {/* Type toggle */}
          <div className="flex gap-1 bg-black/20 rounded-lg p-1 w-fit">
            <button
              type="button"
              onClick={() => setFormType('time')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${formType === 'time' ? 'bg-[#C9A84C] text-black' : 'text-white/40 hover:text-white'}`}>
              Time range
            </button>
            <button
              type="button"
              onClick={() => setFormType('full_day')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${formType === 'full_day' ? 'bg-[#C9A84C] text-black' : 'text-white/40 hover:text-white'}`}>
              Full day
            </button>
          </div>

          {formType === 'full_day' ? (
            <div>
              <label className="text-white/40 text-xs mb-1 block">Date</label>
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                className={inputCls} />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-white/40 text-xs mb-1 block">Start</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={formStart.split('T')[0] || ''}
                    onChange={e => setFormStart(e.target.value + 'T' + (formStart.split('T')[1] || '09:00'))}
                    className={inputCls} />
                  <TimePicker value={formStart.split('T')[1] || '09:00'}
                    onChange={v => setFormStart((formStart.split('T')[0] || '') + 'T' + v)} />
                </div>
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">End</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={formEnd.split('T')[0] || ''}
                    onChange={e => setFormEnd(e.target.value + 'T' + (formEnd.split('T')[1] || '18:00'))}
                    className={inputCls} />
                  <TimePicker value={formEnd.split('T')[1] || '18:00'}
                    onChange={v => setFormEnd((formEnd.split('T')[0] || '') + 'T' + v)} />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-white/40 text-xs mb-1 block">Staff (leave empty to block all)</label>
            <select value={formStaffId} onChange={e => setFormStaffId(e.target.value)} className={inputCls}>
              <option value="all">All staff</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-white/40 text-xs mb-1 block">Reason</label>
            <input type="text" value={formReason} onChange={e => setFormReason(e.target.value)}
              placeholder="e.g. Staff meeting, Lunch break, Holiday..."
              className={inputCls} />
          </div>

          {formError && (
            <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#e8d08a] transition disabled:opacity-50">
              {saving ? 'Saving...' : editingBlock ? 'Save changes' : 'Add block'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingBlock(null) }}
              className="border border-white/20 text-white/60 text-sm px-4 py-2 rounded-lg hover:border-white/40 hover:text-white transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Blocks list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin w-5 h-5 text-[#C9A84C]" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/>
          </svg>
        </div>
      ) : blocks.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-white/30 text-sm">No time blocks yet.</p>
          <p className="text-white/20 text-xs mt-1">Add a block to prevent bookings during specific times.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-4 py-2 border-b border-white/10">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">Upcoming</p>
              </div>
              <div className="divide-y divide-white/5">
                {upcoming.map(block => (
                  <BlockRow
                    key={block.id}
                    block={block}
                    staff={staff}
                    onEdit={() => openEditForm(block)}
                    onDelete={() => handleDelete(block.id)}
                    deleting={deleting === block.id}
                    isPast={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden opacity-50">
              <div className="px-4 py-2 border-b border-white/10">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">Past</p>
              </div>
              <div className="divide-y divide-white/5">
                {past.slice(0, 5).map(block => (
                  <BlockRow
                    key={block.id}
                    block={block}
                    staff={staff}
                    onEdit={() => openEditForm(block)}
                    onDelete={() => handleDelete(block.id)}
                    deleting={deleting === block.id}
                    isPast={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BlockRow({ block, staff, onEdit, onDelete, deleting, isPast }: {
  block: Block
  staff: Staff[]
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
  isPast: boolean
}) {
  const staffName = block.staff_id
    ? staff.find(s => s.id === block.staff_id)?.name ?? 'Unknown'
    : 'All staff'

  const isFullDay = block.type === 'full_day'

  const timeLabel = isFullDay
    ? new Date(block.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : `${formatDT(block.start_time)} → ${formatDT(block.end_time)}`

  const durationLabel = (() => {
    if (isFullDay) return null
    const ms = new Date(block.end_time).getTime() - new Date(block.start_time).getTime()
    const min = Math.round(ms / 60000)
    return min < 60 ? `${min}m` : `${Math.floor(min/60)}h${min%60 > 0 ? ` ${min%60}m` : ''}`
  })()

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Color indicator */}
      <div className={`w-1 h-10 rounded-full flex-none ${isFullDay ? 'bg-orange-400/70' : 'bg-red-400/60'}`} aria-hidden="true" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white text-sm font-medium">{block.reason}</p>
          {isFullDay && <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">Full day</span>}
          <span className="text-white/30 text-xs">·</span>
          <span className="text-white/50 text-xs">{staffName}</span>
        </div>
        <p className="text-white/40 text-xs mt-0.5">
          {timeLabel}
          {durationLabel && <span className="text-white/25 ml-1">({durationLabel})</span>}
        </p>
      </div>

      {/* Actions */}
      {!isPast && (
        <div className="flex items-center gap-1 flex-none">
          <button onClick={onEdit}
            aria-label="Edit block"
            className="text-white/30 hover:text-[#C9A84C] transition p-1.5 rounded hover:bg-white/5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={onDelete} disabled={deleting}
            aria-label="Delete block"
            className="text-white/30 hover:text-red-400 transition p-1.5 rounded hover:bg-red-500/10 disabled:opacity-40">
            {deleting ? (
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
