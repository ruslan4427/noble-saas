'use client'
import { useState, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toAmPm } from '@/lib/time'
import 'react-day-picker/dist/style.css'

interface Slot { time: string; available: boolean }

interface Props {
  orgId:    string
  staffId:  string
  duration: number
  onBooked?: (bookingId: string) => void
}

const E164 = /^\+[1-9]\d{6,14}$/
const ConfirmSchema = z.object({
  name:  z.string().min(2, 'At least 2 characters'),
  phone: z.string().regex(E164, 'Format: +12125551234'),
  email: z.string().email().optional().or(z.literal('')),
})
type ConfirmData = z.infer<typeof ConfirmSchema>

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SlotSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-10 rounded-xl bg-[#e8dfc9] animate-pulse" />
      ))}
    </div>
  )
}

export default function SlotPicker({ orgId, staffId, duration, onBooked }: Props) {
  const [selected, setSelected]   = useState<Date | undefined>()
  const [slots, setSlots]         = useState<Slot[] | null>(null)
  const [loading, setLoading]     = useState(false)
  const [pickedTime, setPickedTime] = useState<string | null>(null)
  const [step, setStep]           = useState<'calendar' | 'confirm' | 'done'>('calendar')
  const [submitting, setSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<ConfirmData>({
    resolver: zodResolver(ConfirmSchema),
  })

  // Fetch slots when date changes
  useEffect(() => {
    if (!selected) return
    setSlots(null)
    setPickedTime(null)
    setLoading(true)
    const dateStr = format(selected, 'yyyy-MM-dd')
    fetch(`/api/availability?date=${dateStr}&staff_id=${staffId}&org_id=${orgId}&duration=${duration}`)
      .then(r => r.json())
      .then(data => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [selected])

  async function onConfirm(data: ConfirmData) {
    if (!selected || !pickedTime) return
    setSubmitting(true)
    setBookingError('')

    const dateStr = format(selected, 'yyyy-MM-dd')
    const [h, m]  = pickedTime.split(':').map(Number)
    const startUtc = new Date(Date.UTC(
      selected.getFullYear(), selected.getMonth(), selected.getDate(), h, m
    ))
    const endUtc = new Date(startUtc.getTime() + duration * 60 * 1000)

    const res = await fetch('/api/bookings', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_id:         orgId,
        master_id:      staffId,
        date:           dateStr,
        time_slot:      pickedTime,
        slot_start_utc: startUtc.toISOString(),
        slot_end_utc:   endUtc.toISOString(),
        client_name:    data.name,
        client_phone:   data.phone,
        client_email:   data.email || undefined,
        service_name:   'Service',
        duration_min:   duration,
      }),
    })

    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      const msgs: Record<string, string> = {
        SLOT_OCCUPIED:  'This slot was just taken. Please pick another time.',
        CLIENT_OVERLAP: 'You already have a booking at this time.',
        INVALID_DATA:   'Please check your details and try again.',
      }
      setBookingError(msgs[json.code] ?? 'Something went wrong. Please try again.')
      return
    }

    setStep('done')
    onBooked?.(json.id)
  }

  const today    = startOfDay(new Date())
  const maxDate  = addDays(today, 60)
  const dateLabel = selected ? format(selected, 'EEEE, MMMM d') : ''

  // ── Done ──────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-5xl mb-4">✓</div>
        <h2 className="text-xl font-serif font-bold text-[#1a1208] mb-2">Booking confirmed!</h2>
        <p className="text-[#6b5744]">
          {dateLabel} at {pickedTime ? toAmPm(pickedTime) : ''}
        </p>
      </div>
    )
  }

  // ── Confirm form ──────────────────────────────────────────────────────────
  if (step === 'confirm' && pickedTime) {
    return (
      <div className="max-w-sm mx-auto px-4 py-6">
        <button
          onClick={() => { setStep('calendar'); setBookingError('') }}
          className="text-sm text-[#6b5744] hover:text-[#1a1208] mb-5 flex items-center gap-1 transition"
        >
          ← {dateLabel} · {toAmPm(pickedTime)}
        </button>

        <h2 className="text-lg font-serif font-bold text-[#1a1208] mb-5">Your details</h2>

        <form onSubmit={handleSubmit(onConfirm)} className="space-y-4">
          <div>
            <label className="block text-xs text-[#6b5744] mb-1.5">Full name</label>
            <input
              {...register('name')}
              placeholder="Jane Smith"
              className="w-full border border-[#c8bfb0] rounded-2xl px-4 py-3 text-sm text-[#1a1208] outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 bg-white placeholder-[#b5a898] min-h-[48px] transition"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs text-[#6b5744] mb-1.5">Phone (E.164 format)</label>
            <input
              {...register('phone')}
              placeholder="+12125551234"
              type="tel"
              className="w-full border border-[#c8bfb0] rounded-2xl px-4 py-3 text-sm text-[#1a1208] outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 bg-white placeholder-[#b5a898] min-h-[48px] transition"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-xs text-[#6b5744] mb-1.5">Email <span className="text-[#9c8b7a]">(optional)</span></label>
            <input
              {...register('email')}
              placeholder="jane@example.com"
              type="email"
              className="w-full border border-[#c8bfb0] rounded-2xl px-4 py-3 text-sm text-[#1a1208] outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 bg-white placeholder-[#b5a898] min-h-[48px] transition"
            />
          </div>

          {bookingError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {bookingError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#C9A84C] text-black font-bold py-3.5 rounded-2xl hover:bg-[#e8d08a] transition shadow-lg shadow-[#C9A84C]/20 active:scale-[0.97] disabled:opacity-50 min-h-[52px]"
          >
            {submitting ? 'Booking…' : 'Confirm booking'}
          </button>
        </form>
      </div>
    )
  }

  // ── Calendar + slots ──────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Date picker */}
      <div className="flex justify-center mb-2">
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={setSelected}
          disabled={[{ before: today }, { after: maxDate }]}
          classNames={{
            root:        'text-[#1a1208]',
            day_selected:'bg-[#C9A84C] text-black rounded-full font-bold',
            day_today:   'border border-[#C9A84C] rounded-full',
            day:         'hover:bg-[#f5f0e8] rounded-full transition',
            button:      'hover:bg-[#f5f0e8]',
          }}
        />
      </div>

      {/* Slots */}
      {selected && (
        <div>
          <p className="text-sm font-medium text-[#1a1208] mb-3">{dateLabel}</p>

          {loading && <SlotSkeleton />}

          {!loading && slots && slots.length === 0 && (
            <p className="text-center text-[#9c8b7a] py-8 text-sm">No available slots for this day.</p>
          )}

          {!loading && slots && slots.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map(s => (
                <button
                  key={s.time}
                  disabled={!s.available}
                  onClick={() => { setPickedTime(s.time); setStep('confirm') }}
                  className={`py-2.5 rounded-xl text-sm font-medium transition min-h-[44px] ${
                    s.available
                      ? 'bg-white border border-[#e8dfc9] text-[#1a1208] hover:border-[#C9A84C] hover:bg-[#fdf8ee] active:scale-[0.97]'
                      : 'bg-[#f0ebe0] text-[#c8bfb0] cursor-not-allowed line-through'
                  }`}
                >
                  {toAmPm(s.time)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!selected && (
        <p className="text-center text-[#9c8b7a] text-sm">Select a date to see available times.</p>
      )}
    </div>
  )
}
