'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface Org {
  id: string
  name: string
  slug: string
  phone?: string
  address?: string
  timezone?: string
}

interface Staff {
  id: string
  name: string
  role: string
  avatar_url?: string
}

interface Service {
  id: string
  name: string
  price_cents: number
  duration_min: number
}

interface DaySchedule {
  day_of_week: number
  is_day_off: boolean
  work_start: string | null
  work_end: string | null
  break_start: string | null
  break_end: string | null
}

interface Props {
  org: Org
  staff: Staff[]
  services: Service[]
}

function getDates() {
  const dates = []
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
}

// Generate slots respecting schedule + break + existing bookings
function buildSlots(
  date: Date,
  schedule: DaySchedule | null,
  bookedSlots: string[],
  serviceDuration: number
): { time: string; available: boolean }[] {
  // If no schedule or day off → no slots
  if (!schedule || schedule.is_day_off) return []

  const workStart = schedule.work_start || '09:00'
  const workEnd = schedule.work_end || '18:00'
  const breakStart = schedule.break_start
  const breakEnd = schedule.break_end

  const [wsh, wsm] = workStart.split(':').map(Number)
  const [weh, wem] = workEnd.split(':').map(Number)
  const workStartMin = wsh * 60 + wsm
  const workEndMin = weh * 60 + wem

  const bsMin = breakStart ? (() => { const [h, m] = breakStart.split(':').map(Number); return h * 60 + m })() : null
  const beMin = breakEnd ? (() => { const [h, m] = breakEnd.split(':').map(Number); return h * 60 + m })() : null

  const slots: { time: string; available: boolean }[] = []
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  for (let min = workStartMin; min + serviceDuration <= workEndMin; min += 30) {
    const slotEnd = min + serviceDuration

    // Skip if in break
    if (bsMin !== null && beMin !== null) {
      if (min < beMin && slotEnd > bsMin) continue
    }

    const h = String(Math.floor(min / 60)).padStart(2, '0')
    const m = String(min % 60).padStart(2, '0')
    const time = `${h}:${m}`

    // Skip past slots for today
    if (isToday && min <= nowMin) continue

    const available = !bookedSlots.includes(time)
    slots.push({ time, available })
  }

  return slots
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e0d8cc] rounded-lg ${className}`} />
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-[#f5f0e8]" lang="uk">
      <div className="bg-[#1a1208] px-6 pt-12 pb-16 text-center">
        <Skeleton className="h-8 w-48 mx-auto mb-3 bg-white/10" />
        <Skeleton className="h-4 w-32 mx-auto bg-white/10" />
        <Skeleton className="h-12 w-44 mx-auto mt-6 rounded-xl bg-[#C9A84C]/30" />
      </div>
      <div className="max-w-lg mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export default function SalonClient({ org, staff, services }: Props) {
  const [step, setStep] = useState<'hero' | 'staff' | 'service' | 'time' | 'confirm' | 'done'>('hero')
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [pageLoading, setPageLoading] = useState(true)

  // Schedule state
  const [scheduleMap, setScheduleMap] = useState<Record<string, DaySchedule[]>>({})
  const [vacationMap, setVacationMap] = useState<Record<string, { date_from: string; date_to: string }[]>>({})
  const [bookedSlotsMap, setBookedSlotsMap] = useState<Record<string, string[]>>({}) // key: staffId_dateStr
  const [slotsLoading, setSlotsLoading] = useState(false)

  const supabase = createClient()
  const dates = getDates()

  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 300)
    return () => clearTimeout(t)
  }, [])

  // Load schedule for selected staff
  useEffect(() => {
    if (!selectedStaff) return
    const sid = selectedStaff.id
    if (scheduleMap[sid]) return // already loaded

    async function loadSchedule() {
      const [{ data: sched }, { data: vac }] = await Promise.all([
        supabase.from('staff_schedule').select('*').eq('staff_id', sid),
        supabase.from('vacation_blocks').select('date_from,date_to').eq('staff_id', sid),
      ])
      setScheduleMap(prev => ({ ...prev, [sid]: sched || [] }))
      setVacationMap(prev => ({ ...prev, [sid]: vac || [] }))
    }
    loadSchedule()
  }, [selectedStaff])

  // Load booked slots when date changes
  useEffect(() => {
    if (!selectedStaff || !selectedDate) return
    const sid = selectedStaff.id
    const dateStr = toDateStr(selectedDate)
    const key = `${sid}_${dateStr}`
    if (bookedSlotsMap[key] !== undefined) return

    async function loadBooked() {
      setSlotsLoading(true)
      const { data } = await supabase
        .from('bookings')
        .select('time_slot')
        .eq('master_id', sid)
        .eq('date', dateStr)
        .neq('status', 'cancelled')
      const slots = (data || []).map((b: { time_slot: string }) => b.time_slot)
      setBookedSlotsMap(prev => ({ ...prev, [key]: slots }))
      setSlotsLoading(false)
    }
    loadBooked()
  }, [selectedStaff, selectedDate])

  function toDateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  // Check if date is blocked by vacation
  function isVacationDate(staffId: string, date: Date): boolean {
    const vacs = vacationMap[staffId] || []
    const dateStr = toDateStr(date)
    return vacs.some(v => dateStr >= v.date_from && dateStr <= v.date_to)
  }

  // Get schedule for a specific day
  function getScheduleForDate(staffId: string, date: Date): DaySchedule | null {
    const sched = scheduleMap[staffId] || []
    const dow = date.getDay()
    return sched.find(s => s.day_of_week === dow) || null
  }

  // Get available slots for selected staff+date+service
  function getAvailableSlots(): { time: string; available: boolean }[] {
    if (!selectedStaff || !selectedDate || !selectedService) return []
    const sid = selectedStaff.id
    const dateStr = toDateStr(selectedDate)
    const key = `${sid}_${dateStr}`
    const booked = bookedSlotsMap[key] || []
    const sched = getScheduleForDate(sid, selectedDate)
    return buildSlots(selectedDate, sched, booked, selectedService.duration_min)
  }

  // Check if a date is fully unavailable (day off or vacation)
  function isDateUnavailable(staffId: string, date: Date): boolean {
    if (isVacationDate(staffId, date)) return true
    const sched = getScheduleForDate(staffId, date)
    if (!sched) return false // no schedule = default available
    return sched.is_day_off
  }

  const hasStaff = staff.length > 0
  const hasServices = services.length > 0

  function handleBookCTA() {
    if (!hasStaff) return
    if (staff.length === 1) { setSelectedStaff(staff[0]); setStep('service') }
    else setStep('staff')
  }

  function handleSelectStaff(m: Staff) { setSelectedStaff(m); setStep('service') }
  function handleSelectService(s: Service) { setSelectedService(s); setStep('time') }

  async function handleConfirm() {
    if (!selectedStaff || !selectedService || !selectedDate || !selectedTime || !name || !phone) {
      setError('Будь ласка, заповніть всі обов\'язкові поля')
      return
    }
    setSubmitting(true); setError('')
    try {
      const dateStr = toDateStr(selectedDate)
      const dateFormatted = selectedDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const startISO = `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
      const startDate = new Date(startISO)
      const reminderAt = new Date(startDate.getTime() - 2 * 60 * 60 * 1000)

      const { error: bookingError } = await supabase.from('bookings').insert({
        org_id: org.id, master_id: selectedStaff.id, date: dateStr,
        time_slot: selectedTime, start_time: startDate.toISOString(),
        reminder_at: clientEmail ? reminderAt.toISOString() : null,
        reminder_sent: false, client_name: name, client_phone: phone,
        client_email: clientEmail || null, service_name: selectedService.name,
        price_cents: selectedService.price_cents, status: 'confirmed',
      })
      if (bookingError) throw bookingError

      fetch('/api/email/booking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: org.id, client_name: name, client_phone: phone,
          client_email: clientEmail || null, master_name: selectedStaff.name,
          service_name: selectedService.name, date: dateFormatted,
          time: selectedTime, price_cents: selectedService.price_cents,
        }),
      }).catch(() => {})

      if (smsConsent) {
        fetch('/api/sms/consent', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ org_id: org.id, client_phone: phone, client_name: name, consented: true }),
        }).catch(() => {})
      }
      setStep('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка. Спробуйте ще раз.')
    } finally { setSubmitting(false) }
  }

  function resetBooking() {
    setStep('hero'); setSelectedStaff(null); setSelectedService(null)
    setSelectedDate(null); setSelectedTime(null)
    setName(''); setPhone(''); setClientEmail(''); setError('')
  }

  if (pageLoading) return <LoadingState />

  // ── DONE ──────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <main className="min-h-screen bg-[#f5f0e8] flex flex-col" lang="uk">
        <div className="bg-[#1a1208] px-6 py-5 text-center">
          <p className="font-serif text-[#C9A84C] text-lg font-bold">✂ {org.name}</p>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-[#e8dfc9]" role="status" aria-live="polite">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h1 className="text-xl font-bold text-[#1a1208] mb-1">Запис підтверджено!</h1>
            <p className="text-[#4a3728] text-sm mb-4">Чекаємо вас у салоні</p>
            <div className="bg-[#f5f0e8] rounded-xl p-4 text-sm text-left space-y-2 mb-6">
              <div className="flex justify-between"><span className="text-[#6b5744]">Майстер</span><span className="font-semibold text-[#1a1208]">{selectedStaff?.name}</span></div>
              <div className="flex justify-between"><span className="text-[#6b5744]">Послуга</span><span className="font-semibold text-[#1a1208]">{selectedService?.name}</span></div>
              <div className="h-px bg-[#e8dfc9]" />
              <div className="flex justify-between"><span className="text-[#6b5744]">Дата</span><span className="font-semibold text-[#1a1208]">{selectedDate?.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}</span></div>
              <div className="flex justify-between"><span className="text-[#6b5744]">Час</span><span className="font-bold text-[#1a1208]">{selectedTime}</span></div>
            </div>
            {clientEmail && <p className="text-[#6b5744] text-xs mb-4">📧 Підтвердження надіслано на {clientEmail}</p>}
            <button onClick={resetBooking} className="w-full bg-[#1a1208] text-[#C9A84C] font-bold py-3 rounded-xl hover:bg-[#2d1f0d] transition min-h-[44px]">Новий запис</button>
          </div>
        </div>
      </main>
    )
  }

  const isHero = step === 'hero'
  const availableSlots = step === 'time' ? getAvailableSlots() : []

  return (
    <main className="min-h-screen bg-[#f5f0e8] flex flex-col" lang="uk">

      {/* Hero header */}
      <div className={`bg-[#1a1208] text-white text-center transition-all ${isHero ? 'px-6 pt-12 pb-20' : 'px-6 py-5'}`}>
        {isHero ? (
          <>
            <div className="inline-flex items-center gap-2 bg-white/10 text-[#C9A84C] text-xs font-medium px-3 py-1 rounded-full mb-4">
              <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-pulse" aria-hidden="true" />
              Онлайн запис
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2 leading-tight">{org.name}</h1>
            {org.address && (
              <p className="text-white/60 text-sm mb-1 flex items-center justify-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {org.address}
              </p>
            )}
            {org.phone && (
              <a href={`tel:${org.phone}`} className="text-white/60 text-sm hover:text-white transition flex items-center justify-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.1 6.1l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {org.phone}
              </a>
            )}
            {!hasStaff || !hasServices ? (
              <div className="mt-6 bg-white/10 text-white/60 text-sm px-4 py-3 rounded-xl inline-block">Салон ще налаштовується. Заходьте пізніше.</div>
            ) : (
              <button onClick={handleBookCTA} className="mt-6 bg-[#C9A84C] text-black font-bold px-8 py-4 rounded-xl hover:bg-[#e8d08a] transition text-base min-h-[52px] shadow-lg shadow-[#C9A84C]/20 active:scale-[0.98]">
                Записатись онлайн →
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <button onClick={resetBooking} className="text-white/50 hover:text-white transition p-1 -ml-1 min-h-[44px] min-w-[44px] flex items-center" aria-label="Назад до головної">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <p className="font-serif text-[#C9A84C] font-bold">✂ {org.name}</p>
            <div className="w-10" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Services/staff preview on hero */}
      {isHero && hasStaff && hasServices && (
        <div className="max-w-lg mx-auto w-full px-4 -mt-6 pb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8dfc9] overflow-hidden">
            <div className="px-4 pt-4 pb-2 border-b border-[#f0e8dc]">
              <p className="text-xs font-semibold text-[#6b5744] uppercase tracking-wide">Послуги</p>
            </div>
            <div className="divide-y divide-[#f0e8dc]">
              {services.slice(0, 4).map(s => (
                <button key={s.id}
                  onClick={() => { if (staff.length === 1) setSelectedStaff(staff[0]); setSelectedService(s); setStep(staff.length === 1 ? 'time' : 'staff') }}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#faf7f2] transition text-left active:bg-[#f5f0e8]"
                  aria-label={`Записатись на ${s.name}, ${s.duration_min} хв, $${(s.price_cents / 100).toFixed(0)}`}>
                  <div>
                    <div className="font-semibold text-[#1a1208] text-sm">{s.name}</div>
                    <div className="text-[#6b5744] text-xs mt-0.5">{s.duration_min} хв</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#1a1208] text-sm">${(s.price_cents / 100).toFixed(0)}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </button>
              ))}
              {services.length > 4 && (
                <button onClick={handleBookCTA} className="w-full px-4 py-3 text-sm text-[#C9A84C] font-medium hover:bg-[#faf7f2] transition text-center">Ще {services.length - 4} послуг →</button>
              )}
            </div>
          </div>
          {staff.length > 0 && (
            <div className="mt-4 bg-white rounded-2xl shadow-sm border border-[#e8dfc9] overflow-hidden">
              <div className="px-4 pt-4 pb-2 border-b border-[#f0e8dc]">
                <p className="text-xs font-semibold text-[#6b5744] uppercase tracking-wide">Майстри</p>
              </div>
              <div className="flex gap-4 px-4 py-3 overflow-x-auto">
                {staff.map(m => (
                  <div key={m.id} className="flex flex-col items-center gap-1.5 flex-none">
                    <div className="w-12 h-12 rounded-full bg-[#f5f0e8] border-2 border-[#e8dfc9] flex items-center justify-center text-[#1a1208]" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <span className="text-xs font-medium text-[#1a1208] whitespace-nowrap">{m.name.split(' ')[0]}</span>
                    <span className="text-xs text-[#6b5744] capitalize">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isHero && (!hasStaff || !hasServices) && (
        <div className="max-w-lg mx-auto w-full px-4 -mt-6 pb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8dfc9] p-8 text-center">
            <div className="w-14 h-14 bg-[#f5f0e8] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p className="font-semibold text-[#1a1208] mb-1">{!hasStaff ? 'Майстрів ще немає' : 'Послуг ще немає'}</p>
            <p className="text-[#6b5744] text-sm">Власник салону скоро додасть інформацію.</p>
          </div>
        </div>
      )}

      {/* Booking flow */}
      {!isHero && (
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">

          {/* Progress */}
          <div className="flex gap-1 mb-6" role="progressbar" aria-label="Прогрес бронювання">
            {(['staff', 'service', 'time', 'confirm'] as const).map((s, i) => (
              <div key={s} className={`flex-1 h-1 rounded-full transition-all ${step === s ? 'bg-[#C9A84C]' : ['staff', 'service', 'time', 'confirm'].indexOf(step) > i ? 'bg-[#1a1208]' : 'bg-[#d4c9b8]'}`} />
            ))}
          </div>

          {/* Summary bar */}
          {(selectedStaff || selectedService || selectedTime) && (
            <div className="bg-white border border-[#e8dfc9] rounded-xl px-4 py-2.5 mb-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#1a1208]" role="status">
              {selectedStaff && <span className="font-medium">✂ {selectedStaff.name}</span>}
              {selectedService && <span className="text-[#6b5744]">· {selectedService.name} <strong className="text-[#1a1208]">${(selectedService.price_cents / 100).toFixed(0)}</strong></span>}
              {selectedDate && selectedTime && <span className="text-[#6b5744]">· <strong className="text-[#1a1208]">{selectedDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })} {selectedTime}</strong></span>}
            </div>
          )}

          {/* STEP: Staff */}
          {step === 'staff' && (
            <section aria-labelledby="step-staff-title">
              <h2 id="step-staff-title" className="text-lg font-bold text-[#1a1208] mb-4">Оберіть майстра</h2>
              <div className="space-y-2">
                {staff.map(m => (
                  <button key={m.id} onClick={() => handleSelectStaff(m)}
                    className="w-full bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 border-2 border-transparent hover:border-[#C9A84C] transition active:scale-[0.99]"
                    aria-label={`Обрати ${m.name}, ${m.role}`}>
                    <div className="w-10 h-10 rounded-full bg-[#f5f0e8] flex items-center justify-center flex-none" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1208" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-[#1a1208] text-sm">{m.name}</div>
                      <div className="text-[#6b5744] text-xs capitalize">{m.role}</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* STEP: Service */}
          {step === 'service' && (
            <section aria-labelledby="step-service-title">
              <h2 id="step-service-title" className="text-lg font-bold text-[#1a1208] mb-4">Оберіть послугу</h2>
              <div className="space-y-2">
                {services.map(s => (
                  <button key={s.id} onClick={() => handleSelectService(s)}
                    className="w-full bg-white rounded-xl px-4 py-3.5 flex items-center justify-between border-2 border-transparent hover:border-[#C9A84C] transition active:scale-[0.99]"
                    aria-label={`${s.name}, ${s.duration_min} хв, $${(s.price_cents / 100).toFixed(0)}`}>
                    <div className="text-left">
                      <div className="font-semibold text-[#1a1208] text-sm">{s.name}</div>
                      <div className="text-[#6b5744] text-xs mt-0.5">{s.duration_min} хв</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#1a1208]">${(s.price_cents / 100).toFixed(0)}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </button>
                ))}
              </div>
              {staff.length > 1 && (
                <button onClick={() => setStep('staff')} className="mt-4 text-sm text-[#6b5744] hover:text-[#1a1208] hover:underline px-1 py-2 min-h-[44px]">← Назад</button>
              )}
            </section>
          )}

          {/* STEP: Time */}
          {step === 'time' && (
            <section aria-labelledby="step-time-title">
              <h2 id="step-time-title" className="text-lg font-bold text-[#1a1208] mb-4">Оберіть час</h2>

              {/* Date pills */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4" role="group" aria-label="Дата">
                {dates.map(d => {
                  const isSelected = selectedDate?.toDateString() === d.toDateString()
                  const unavailable = selectedStaff ? isDateUnavailable(selectedStaff.id, d) : false
                  return (
                    <button key={d.toISOString()}
                      onClick={() => { if (!unavailable) { setSelectedDate(d); setSelectedTime(null) } }}
                      disabled={unavailable}
                      aria-pressed={isSelected}
                      aria-label={`${d.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}${unavailable ? ' — недоступно' : ''}`}
                      className={`flex-none flex flex-col items-center px-3.5 py-2.5 rounded-xl border-2 transition min-w-[52px] min-h-[56px] active:scale-[0.97]
                        ${unavailable ? 'border-[#e8dfc9] bg-[#f0ebe0] opacity-40 cursor-not-allowed' :
                          isSelected ? 'border-[#C9A84C] bg-[#1a1208] text-white' : 'border-[#d4c9b8] bg-white text-[#1a1208]'}`}>
                      <span className={`text-[10px] font-medium ${isSelected ? 'text-[#C9A84C]' : unavailable ? 'text-[#8b7a65]' : 'text-[#6b5744]'}`} aria-hidden="true">
                        {d.toLocaleDateString('uk-UA', { weekday: 'short' })}
                      </span>
                      <span className="font-bold text-sm" aria-hidden="true">{d.getDate()}</span>
                      {unavailable && <span className="text-[8px] text-[#8b7a65] mt-0.5" aria-hidden="true">вихідний</span>}
                    </button>
                  )
                })}
              </div>

              {/* Time slots */}
              {!selectedDate ? (
                <div className="bg-white rounded-xl p-5 text-center text-sm text-[#6b5744]">Оберіть дату, щоб побачити доступні слоти</div>
              ) : slotsLoading ? (
                <div className="bg-white rounded-xl p-5 text-center">
                  <svg className="animate-spin w-5 h-5 text-[#C9A84C] mx-auto" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="bg-white rounded-xl p-5 text-center text-sm text-[#6b5744]">
                  На цей день немає доступних слотів. Оберіть іншу дату.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2" role="group" aria-label="Час">
                  {availableSlots.map(({ time, available }) => (
                    <button key={time}
                      onClick={() => available && setSelectedTime(time)}
                      disabled={!available}
                      aria-pressed={selectedTime === time}
                      aria-label={`${time}${!available ? ' — зайнято' : ''}`}
                      className={`py-3 rounded-lg text-sm font-medium border transition min-h-[44px] active:scale-[0.97]
                        ${!available ? 'border-[#e8dfc9] bg-[#f5f0e8] text-[#c8bfb0] line-through cursor-not-allowed' :
                          selectedTime === time ? 'border-[#C9A84C] bg-[#C9A84C] text-black' :
                          'border-[#d4c9b8] bg-white text-[#1a1208] hover:border-[#C9A84C]'}`}>
                      {time}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-5 items-center">
                <button onClick={() => setStep('service')} className="text-sm text-[#6b5744] hover:text-[#1a1208] hover:underline px-1 py-2 min-h-[44px]">← Назад</button>
                {selectedDate && selectedTime && (
                  <button onClick={() => setStep('confirm')} className="ml-auto bg-[#C9A84C] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#e8d08a] transition min-h-[44px] active:scale-[0.98]">Далі →</button>
                )}
              </div>
            </section>
          )}

          {/* STEP: Confirm */}
          {step === 'confirm' && (
            <section aria-labelledby="step-confirm-title">
              <h2 id="step-confirm-title" className="text-lg font-bold text-[#1a1208] mb-4">Підтвердження</h2>
              <div className="bg-white rounded-xl border border-[#e8dfc9] p-4 mb-4 text-sm space-y-2.5" aria-label="Деталі запису">
                <div className="flex justify-between"><span className="text-[#6b5744]">Майстер</span><span className="font-semibold text-[#1a1208]">{selectedStaff?.name}</span></div>
                <div className="flex justify-between"><span className="text-[#6b5744]">Послуга</span><span className="font-semibold text-[#1a1208]">{selectedService?.name}</span></div>
                <div className="flex justify-between"><span className="text-[#6b5744]">Вартість</span><span className="font-bold text-[#1a1208]">${((selectedService?.price_cents || 0) / 100).toFixed(0)}</span></div>
                <div className="h-px bg-[#f0e8dc]" />
                <div className="flex justify-between"><span className="text-[#6b5744]">Дата</span><span className="font-semibold text-[#1a1208]">{selectedDate?.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}</span></div>
                <div className="flex justify-between"><span className="text-[#6b5744]">Час</span><span className="font-bold text-[#C9A84C] text-base">{selectedTime}</span></div>
              </div>
              <div className="space-y-3 mb-4">
                <div>
                  <label htmlFor="client-name" className="block text-sm font-medium text-[#1a1208] mb-1.5">Ваше ім'я <span className="text-red-600" aria-hidden="true">*</span></label>
                  <input id="client-name" type="text" value={name} onChange={e => setName(e.target.value)} autoComplete="name" required aria-required="true" placeholder="Іван Іваненко" className="w-full border border-[#c8bfb0] rounded-xl px-4 py-3 text-sm text-[#1a1208] outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white placeholder-[#a0907e] min-h-[48px]" />
                </div>
                <div>
                  <label htmlFor="client-phone" className="block text-sm font-medium text-[#1a1208] mb-1.5">Телефон <span className="text-red-600" aria-hidden="true">*</span></label>
                  <input id="client-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" required aria-required="true" placeholder="+380 (XX) XXX-XXXX" className="w-full border border-[#c8bfb0] rounded-xl px-4 py-3 text-sm text-[#1a1208] outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white placeholder-[#a0907e] min-h-[48px]" />
                </div>
                <div>
                  <label htmlFor="client-email" className="block text-sm font-medium text-[#1a1208] mb-1.5">Email <span className="text-[#6b5744] font-normal text-xs">(для підтвердження)</span></label>
                  <input id="client-email" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} autoComplete="email" placeholder="your@email.com" className="w-full border border-[#c8bfb0] rounded-xl px-4 py-3 text-sm text-[#1a1208] outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white placeholder-[#a0907e] min-h-[48px]" />
                </div>
                <label className="flex items-start gap-3 py-1 cursor-pointer">
                  <input type="checkbox" checked={smsConsent} onChange={e => setSmsConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#C9A84C]" aria-describedby="sms-desc" />
                  <span id="sms-desc" className="text-xs text-[#6b5744] leading-relaxed">Погоджуюсь на SMS-нагадування про запис. Відповідайте STOP для відмови.</span>
                </label>
              </div>
              <div role="alert" aria-live="assertive" aria-atomic="true">
                {error && <div className="text-red-700 text-sm mb-3 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</div>}
              </div>
              <div className="space-y-2">
                <button onClick={handleConfirm} disabled={submitting} className="w-full bg-[#C9A84C] text-black font-bold py-4 rounded-xl hover:bg-[#e8d08a] transition min-h-[52px] text-base disabled:opacity-50 active:scale-[0.98]">
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg>
                      Надсилання...
                    </span>
                  ) : 'Підтвердити запис →'}
                </button>
                <button onClick={() => setStep('time')} className="w-full text-sm text-[#6b5744] hover:text-[#1a1208] py-2 min-h-[44px] hover:underline">← Назад</button>
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  )
}
