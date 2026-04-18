'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { toAmPm } from '@/lib/time'

interface Org {
  id: string; name: string; slug: string
  phone?: string | null; address?: string | null; timezone?: string
  instagram?: string | null; facebook?: string | null; tiktok?: string | null
}
interface Staff { id: string; name: string; role: string; avatar_url?: string | null }
interface Service { id: string; name: string; price_cents: number; duration_min: number }
interface DaySchedule {
  day_of_week: number; is_day_off: boolean
  work_start: string | null; work_end: string | null
  break_start: string | null; break_end: string | null
}
interface CalendarBlock { staff_id: string | null; start_time: string; end_time: string }
interface Props { org: Org; staff: Staff[]; services: Service[] }

const DEFAULT_WORK_START = '09:00'
const DEFAULT_WORK_END = '19:00'

function getDates() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return d
  })
}
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number); return h * 60 + m
}
function toTimeStr(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}
function isSlotBlocked(dateStr: string, slotMin: number, slotEndMin: number, staffId: string, blocks: CalendarBlock[]): boolean {
  return blocks.some(b => {
    if (b.staff_id !== null && b.staff_id !== staffId) return false
    const bs = new Date(b.start_time); const be = new Date(b.end_time)
    const bsMin = bs.getHours() * 60 + bs.getMinutes()
    const beMin = be.getHours() * 60 + be.getMinutes()
    const bd = `${bs.getFullYear()}-${String(bs.getMonth()+1).padStart(2,'0')}-${String(bs.getDate()).padStart(2,'0')}`
    return bd === dateStr && slotMin < beMin && slotEndMin > bsMin
  })
}
function buildSlots(date: Date, schedule: DaySchedule | null, bookedSlots: string[], serviceDuration: number, blocks: CalendarBlock[], staffId: string): { time: string; available: boolean }[] {
  if (schedule?.is_day_off) return []
  const wsMin = toMinutes(schedule?.work_start || DEFAULT_WORK_START)
  const weMin = toMinutes(schedule?.work_end || DEFAULT_WORK_END)
  const bsMin = schedule?.break_start ? toMinutes(schedule.break_start) : null
  const beMin = schedule?.break_end ? toMinutes(schedule.break_end) : null
  const now = new Date(); const isToday = date.toDateString() === now.toDateString()
  const cutoff = isToday ? now.getHours() * 60 + now.getMinutes() : -1
  const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
  const slots: { time: string; available: boolean }[] = []
  for (let min = wsMin; min + serviceDuration <= weMin; min += 30) {
    const end = min + serviceDuration
    if (isToday && min <= cutoff) continue
    if (bsMin !== null && beMin !== null && min < beMin && end > bsMin) continue
    if (isSlotBlocked(ds, min, end, staffId, blocks)) continue
    slots.push({ time: toTimeStr(min), available: !bookedSlots.includes(toTimeStr(min)) })
  }
  return slots
}

function SalonFooter({ org }: { org: Org }) {
  const hasSocial = org.instagram || org.facebook || org.tiktok
  const hasContact = org.phone || org.address
  if (!hasSocial && !hasContact) return null
  return (
    <footer className="bg-[#1a1208] mt-auto">
      <div className="max-w-lg mx-auto px-6 py-8 text-center space-y-4">
        <p className="font-serif text-[#C9A84C] font-bold text-sm">✂ {org.name}</p>
        {hasContact && (
          <div className="flex flex-col items-center gap-1.5">
            {org.address && (
              <span className="text-white/50 text-xs flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {org.address}
              </span>
            )}
            {org.phone && (
              <a href={`tel:${org.phone}`} className="text-white/50 hover:text-white text-xs flex items-center gap-1.5 transition">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.1 6.1l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {org.phone}
              </a>
            )}
          </div>
        )}
        {hasSocial && (
          <div className="flex items-center justify-center gap-3">
            {org.instagram && (
              <a href={org.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition active:scale-95">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            )}
            {org.facebook && (
              <a href={org.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition active:scale-95">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            )}
            {org.tiktok && (
              <a href={org.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition active:scale-95">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.16 8.16 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z"/></svg>
              </a>
            )}
          </div>
        )}
        <p className="text-white/20 text-[10px]">Powered by Noble</p>
      </div>
    </footer>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e0d8cc] rounded-lg ${className}`} />
}
function LoadingState() {
  return (
    <main className="min-h-screen bg-[#f5f0e8]">
      <div className="bg-[#1a1208] px-6 pt-12 pb-16 text-center">
        <Skeleton className="h-8 w-48 mx-auto mb-3 bg-white/10" />
        <Skeleton className="h-4 w-32 mx-auto bg-white/10" />
        <Skeleton className="h-12 w-44 mx-auto mt-6 rounded-xl bg-[#C9A84C]/30" />
      </div>
    </main>
  )
}

export default function SalonClient({ org, staff, services }: Props) {
  const [step, setStep] = useState<'hero'|'staff'|'service'|'time'|'confirm'|'done'>('hero')
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
  const [scheduleMap, setScheduleMap] = useState<Record<string, DaySchedule[]>>({})
  const [vacationMap, setVacationMap] = useState<Record<string, { date_from: string; date_to: string }[]>>({})
  const [bookedSlotsMap, setBookedSlotsMap] = useState<Record<string, string[]>>({})
  const [blocks, setBlocks] = useState<CalendarBlock[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const supabase = createClient()
  const dates = getDates()

  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 300); return () => clearTimeout(t) }, [])
  useEffect(() => {
    supabase.from('calendar_blocks').select('staff_id,start_time,end_time').eq('org_id', org.id).gte('end_time', new Date().toISOString()).then(({ data }) => setBlocks(data || []))
  }, [org.id])
  useEffect(() => {
    if (!selectedStaff) return
    const sid = selectedStaff.id
    if (scheduleMap[sid] !== undefined) return
    Promise.all([
      supabase.from('staff_schedule').select('*').eq('staff_id', sid),
      supabase.from('vacation_blocks').select('date_from,date_to').eq('staff_id', sid),
    ]).then(([{ data: sched }, { data: vac }]) => {
      setScheduleMap(prev => ({ ...prev, [sid]: sched || [] }))
      setVacationMap(prev => ({ ...prev, [sid]: vac || [] }))
    })
  }, [selectedStaff])
  useEffect(() => {
    if (!selectedStaff || !selectedDate) return
    const sid = selectedStaff.id; const ds = toDateStr(selectedDate); const key = `${sid}_${ds}`
    if (bookedSlotsMap[key] !== undefined) return
    setSlotsLoading(true)
    supabase.from('bookings').select('time_slot').eq('master_id', sid).eq('date', ds).neq('status', 'cancelled')
      .then(({ data }) => { setBookedSlotsMap(prev => ({ ...prev, [key]: (data||[]).map((b:{ time_slot:string })=>b.time_slot) })); setSlotsLoading(false) })
  }, [selectedStaff, selectedDate])

  function toDateStr(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
  function isVacationDate(staffId: string, date: Date) { const ds = toDateStr(date); return (vacationMap[staffId]||[]).some(v => ds >= v.date_from && ds <= v.date_to) }
  function getScheduleForDate(staffId: string, date: Date): DaySchedule | null { return (scheduleMap[staffId]||[]).find(s => s.day_of_week === date.getDay()) || null }
  function isDateUnavailable(staffId: string, date: Date) { if (isVacationDate(staffId, date)) return true; const s = getScheduleForDate(staffId, date); return s !== null && s.is_day_off }
  function getAvailableSlots() {
    if (!selectedStaff || !selectedDate || !selectedService) return []
    const sid = selectedStaff.id; const key = `${sid}_${toDateStr(selectedDate)}`
    return buildSlots(selectedDate, getScheduleForDate(sid, selectedDate), bookedSlotsMap[key]||[], selectedService.duration_min, blocks, sid)
  }

  const hasStaff = staff.length > 0; const hasServices = services.length > 0
  function handleBookCTA() { if (!hasStaff) return; if (staff.length === 1) { setSelectedStaff(staff[0]); setStep('service') } else setStep('staff') }
  function handleSelectStaff(m: Staff) { setSelectedStaff(m); setStep(selectedService ? 'time' : 'service') }
  function handleSelectService(s: Service) { setSelectedService(s); setStep('time') }

  async function handleConfirm() {
    if (!selectedStaff || !selectedService || !selectedDate || !selectedTime || !name || !phone) { setError('Please fill in all required fields'); return }
    setSubmitting(true); setError('')
    try {
      const ds = toDateStr(selectedDate)
      const [h, m] = selectedTime.split(':').map(Number)
      const startDate = new Date(`${ds}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`)
      const reminderAt = new Date(startDate.getTime() - 2*60*60*1000)
      if (smsConsent && phone) await fetch('/api/sms/consent', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ org_id:org.id, client_phone:phone, client_name:name, consented:true }) })
      const { data: newBooking, error: bookingError } = await supabase.from('bookings').insert({
        org_id:org.id, master_id:selectedStaff.id, date:ds, time_slot:selectedTime,
        start_time:startDate.toISOString(), reminder_at:reminderAt.toISOString(), reminder_sent:false,
        client_name:name, client_phone:phone, client_email:clientEmail||null,
        service_name:selectedService.name, price_cents:selectedService.price_cents, status:'confirmed',
      }).select('id').single()
      if (bookingError) throw bookingError
      fetch('/api/email/booking', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
        org_id:org.id, client_name:name, client_phone:phone, client_email:clientEmail||null,
        master_name:selectedStaff.name, service_name:selectedService.name,
        date:selectedDate.toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'}),
        time:selectedTime, price_cents:selectedService.price_cents, booking_id:newBooking?.id,
      }) }).catch(()=>{})
      setStep('done')
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.') }
    finally { setSubmitting(false) }
  }

  function resetBooking() { setStep('hero'); setSelectedStaff(null); setSelectedService(null); setSelectedDate(null); setSelectedTime(null); setName(''); setPhone(''); setClientEmail(''); setError('') }

  if (pageLoading) return <LoadingState />

  if (step === 'done') return (
    <main className="min-h-screen bg-[#f5f0e8] flex flex-col">
      <div className="bg-[#1a1208] px-6 py-5 text-center"><p className="font-serif text-[#C9A84C] text-lg font-bold">✂ {org.name}</p></div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-[#e8dfc9]">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 className="text-xl font-bold text-[#1a1208] mb-1">Booking confirmed!</h1>
          <p className="text-[#4a3728] text-sm mb-4">We look forward to seeing you</p>
          <div className="bg-[#f5f0e8] rounded-xl p-4 text-sm text-left space-y-2 mb-6">
            <div className="flex justify-between"><span className="text-[#6b5744]">Barber</span><span className="font-semibold text-[#1a1208]">{selectedStaff?.name}</span></div>
            <div className="flex justify-between"><span className="text-[#6b5744]">Service</span><span className="font-semibold text-[#1a1208]">{selectedService?.name}</span></div>
            <div className="h-px bg-[#e8dfc9]"/>
            <div className="flex justify-between"><span className="text-[#6b5744]">Date</span><span className="font-semibold text-[#1a1208]">{selectedDate?.toLocaleDateString('en-US',{day:'numeric',month:'long'})}</span></div>
            <div className="flex justify-between"><span className="text-[#6b5744]">Time</span><span className="font-bold text-[#1a1208]">{toAmPm(selectedTime??'')}</span></div>
          </div>
          {clientEmail && <p className="text-[#6b5744] text-xs mb-4">📧 Confirmation sent to {clientEmail}</p>}
          <button onClick={resetBooking} className="w-full bg-[#1a1208] text-[#C9A84C] font-bold py-3 rounded-xl hover:bg-[#2d1f0d] transition min-h-[44px]">Book again</button>
        </div>
      </div>
      <SalonFooter org={org} />
    </main>
  )

  const isHero = step === 'hero'
  const availableSlots = step === 'time' ? getAvailableSlots() : []
  const availableCount = availableSlots.filter(s => s.available).length

  return (
    <main className="min-h-screen bg-[#f5f0e8] flex flex-col">
      <div className={`bg-[#1a1208] text-white text-center transition-all ${isHero ? 'px-6 pt-12 pb-20' : 'px-6 py-5'}`}>
        {isHero ? (
          <>
            <div className="inline-flex items-center gap-2 bg-white/10 text-[#C9A84C] text-xs font-medium px-3 py-1 rounded-full mb-4">
              <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-pulse"/>Online booking
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2 leading-tight">{org.name}</h1>
            {!hasStaff||!hasServices
              ? <div className="mt-6 bg-white/10 text-white/60 text-sm px-4 py-3 rounded-xl inline-block">This salon is still getting set up. Check back soon.</div>
              : <button onClick={handleBookCTA} className="mt-5 bg-[#C9A84C] text-black font-bold px-8 py-4 rounded-xl hover:bg-[#e8d08a] transition text-base min-h-[52px] shadow-lg shadow-[#C9A84C]/20 active:scale-[0.98]">Book online →</button>}
          </>
        ) : (
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <button onClick={resetBooking} className="text-white/50 hover:text-white transition p-1 -ml-1 min-h-[44px] min-w-[44px] flex items-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg></button>
            <p className="font-serif text-[#C9A84C] font-bold">✂ {org.name}</p>
            <div className="w-10"/>
          </div>
        )}
      </div>

      {isHero && hasStaff && hasServices && (
        <div className="max-w-lg mx-auto w-full px-4 -mt-6 pb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8dfc9] overflow-hidden">
            <div className="px-4 pt-4 pb-2 border-b border-[#f0e8dc]"><p className="text-xs font-semibold text-[#6b5744] uppercase tracking-wide">Services</p></div>
            <div className="divide-y divide-[#f0e8dc]">
              {services.slice(0,4).map(s => (
                <button key={s.id} onClick={() => { if (staff.length===1) setSelectedStaff(staff[0]); setSelectedService(s); setStep(staff.length===1?'time':'staff') }}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#faf7f2] transition text-left active:bg-[#f5f0e8]">
                  <div><div className="font-semibold text-[#1a1208] text-sm">{s.name}</div><div className="text-[#6b5744] text-xs mt-0.5">{s.duration_min} min</div></div>
                  <div className="flex items-center gap-3"><span className="font-bold text-[#1a1208] text-sm">${(s.price_cents/100).toFixed(0)}</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></div>
                </button>
              ))}
              {services.length > 4 && <button onClick={handleBookCTA} className="w-full px-4 py-3 text-sm text-[#C9A84C] font-medium hover:bg-[#faf7f2] transition text-center">{services.length-4} more services →</button>}
            </div>
          </div>
          <div className="mt-4 bg-white rounded-2xl shadow-sm border border-[#e8dfc9] overflow-hidden">
            <div className="px-4 pt-4 pb-2 border-b border-[#f0e8dc]"><p className="text-xs font-semibold text-[#6b5744] uppercase tracking-wide">Our team</p></div>
            <div className="flex gap-4 px-4 py-4 overflow-x-auto">
              {staff.map(m => (
                <div key={m.id} className="flex flex-col items-center gap-2 flex-none">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={m.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#e8dfc9]" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#f5f0e8] border-2 border-[#e8dfc9] flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b5744" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                  )}
                  <span className="text-xs font-semibold text-[#1a1208] whitespace-nowrap">{m.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-[#6b5744] -mt-1">{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isHero && (!hasStaff || !hasServices) && (
        <div className="max-w-lg mx-auto w-full px-4 -mt-6 pb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8dfc9] p-8 text-center">
            <p className="font-semibold text-[#1a1208] mb-1">{!hasStaff ? 'No staff added yet' : 'No services added yet'}</p>
            <p className="text-[#6b5744] text-sm">The salon owner will add information soon.</p>
          </div>
        </div>
      )}

      {!isHero && (
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
          <div className="flex gap-1 mb-6">
            {(['staff','service','time','confirm'] as const).map((s,i) => (
              <div key={s} className={`flex-1 h-1 rounded-full transition-all ${step===s?'bg-[#C9A84C]':['staff','service','time','confirm'].indexOf(step)>i?'bg-[#1a1208]':'bg-[#d4c9b8]'}`}/>
            ))}
          </div>

          {(selectedStaff||selectedService||selectedTime) && (
            <div className="bg-white border border-[#e8dfc9] rounded-xl px-4 py-2.5 mb-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#1a1208]">
              {selectedStaff && <span className="font-medium">✂ {selectedStaff.name}</span>}
              {selectedService && <span className="text-[#6b5744]">· {selectedService.name} <strong className="text-[#1a1208]">${(selectedService.price_cents/100).toFixed(0)}</strong></span>}
              {selectedDate && selectedTime && <span className="text-[#6b5744]">· <strong className="text-[#1a1208]">{selectedDate.toLocaleDateString('en-US',{day:'numeric',month:'short'})} {toAmPm(selectedTime)}</strong></span>}
            </div>
          )}

          {step === 'staff' && (
            <section>
              <h2 className="text-lg font-bold text-[#1a1208] mb-4">Choose your barber</h2>
              <div className="space-y-2">
                {staff.map(m => (
                  <button key={m.id} onClick={() => handleSelectStaff(m)} className="w-full bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 border-2 border-transparent hover:border-[#C9A84C] transition active:scale-[0.99]">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt={m.name} className="w-12 h-12 rounded-full object-cover flex-none border-2 border-[#e8dfc9]" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#f5f0e8] flex items-center justify-center flex-none border-2 border-[#e8dfc9]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b5744" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-[#1a1208] text-sm">{m.name}</div>
                      <div className="text-[#6b5744] text-xs">{m.role}</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 'service' && (
            <section>
              <h2 className="text-lg font-bold text-[#1a1208] mb-4">Choose a service</h2>
              <div className="space-y-2">
                {services.map(s => (
                  <button key={s.id} onClick={() => handleSelectService(s)} className="w-full bg-white rounded-xl px-4 py-3.5 flex items-center justify-between border-2 border-transparent hover:border-[#C9A84C] transition active:scale-[0.99]">
                    <div className="text-left"><div className="font-semibold text-[#1a1208] text-sm">{s.name}</div><div className="text-[#6b5744] text-xs mt-0.5">{s.duration_min} min</div></div>
                    <div className="flex items-center gap-3"><span className="font-bold text-[#1a1208]">${(s.price_cents/100).toFixed(0)}</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></div>
                  </button>
                ))}
              </div>
              {staff.length > 1 && <button onClick={() => setStep('staff')} className="mt-4 text-sm text-[#6b5744] hover:text-[#1a1208] hover:underline px-1 py-2 min-h-[44px]">← Back</button>}
            </section>
          )}

          {step === 'time' && (
            <section>
              <h2 className="text-lg font-bold text-[#1a1208] mb-4">Pick a time</h2>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
                {dates.map(d => {
                  const isSel = selectedDate?.toDateString() === d.toDateString()
                  const unavail = selectedStaff ? isDateUnavailable(selectedStaff.id, d) : false
                  return (
                    <button key={d.toISOString()} onClick={() => { if (!unavail) { setSelectedDate(d); setSelectedTime(null) } }} disabled={unavail}
                      className={`flex-none flex flex-col items-center px-3.5 py-2.5 rounded-xl border-2 transition min-w-[52px] min-h-[56px] active:scale-[0.97] ${unavail?'border-[#e8dfc9] bg-[#f0ebe0] opacity-40 cursor-not-allowed':isSel?'border-[#C9A84C] bg-[#1a1208] text-white':'border-[#d4c9b8] bg-white text-[#1a1208]'}`}>
                      <span className={`text-[10px] font-medium ${isSel?'text-[#C9A84C]':'text-[#6b5744]'}`}>{d.toLocaleDateString('en-US',{weekday:'short'})}</span>
                      <span className="font-bold text-sm">{d.getDate()}</span>
                      {unavail && <span className="text-[8px] text-[#8b7a65] mt-0.5">off</span>}
                    </button>
                  )
                })}
              </div>
              {!selectedDate ? (
                <div className="bg-white rounded-xl p-5 text-center text-sm text-[#6b5744]">Select a date to see available slots</div>
              ) : slotsLoading ? (
                <div className="bg-white rounded-xl p-5 text-center"><svg className="animate-spin w-5 h-5 text-[#C9A84C] mx-auto" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg></div>
              ) : availableSlots.length === 0 ? (
                <div className="bg-white rounded-xl p-5 text-center space-y-1"><p className="text-sm font-medium text-[#1a1208]">No available slots</p><p className="text-xs text-[#6b5744]">Try a different date or barber</p></div>
              ) : (
                <>
                  <p className="text-xs text-[#6b5744] mb-2">{availableCount > 0 ? `${availableCount} slots available` : 'All slots booked — try another date'}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map(({ time, available }) => (
                      <button key={time} onClick={() => available && setSelectedTime(time)} disabled={!available}
                        className={`py-3 rounded-lg text-sm font-medium border transition min-h-[44px] active:scale-[0.97] ${!available?'border-[#e8dfc9] bg-[#f5f0e8] text-[#c8bfb0] line-through cursor-not-allowed':selectedTime===time?'border-[#C9A84C] bg-[#C9A84C] text-black':'border-[#d4c9b8] bg-white text-[#1a1208] hover:border-[#C9A84C]'}`}>
                        {toAmPm(time)}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="flex gap-3 mt-5 items-center">
                <button onClick={() => setStep('service')} className="text-sm text-[#6b5744] hover:text-[#1a1208] hover:underline px-1 py-2 min-h-[44px]">← Back</button>
                {selectedDate && selectedTime && <button onClick={() => setStep('confirm')} className="ml-auto bg-[#C9A84C] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#e8d08a] transition min-h-[44px] active:scale-[0.98]">Next →</button>}
              </div>
            </section>
          )}

          {step === 'confirm' && (
            <section>
              <h2 className="text-lg font-bold text-[#1a1208] mb-4">Confirm booking</h2>
              <div className="bg-white rounded-xl border border-[#e8dfc9] p-4 mb-4 text-sm space-y-2.5">
                <div className="flex justify-between"><span className="text-[#6b5744]">Barber</span><span className="font-semibold text-[#1a1208]">{selectedStaff?.name}</span></div>
                <div className="flex justify-between"><span className="text-[#6b5744]">Service</span><span className="font-semibold text-[#1a1208]">{selectedService?.name}</span></div>
                <div className="flex justify-between"><span className="text-[#6b5744]">Price</span><span className="font-bold text-[#1a1208]">${((selectedService?.price_cents||0)/100).toFixed(0)}</span></div>
                <div className="h-px bg-[#f0e8dc]"/>
                <div className="flex justify-between"><span className="text-[#6b5744]">Date</span><span className="font-semibold text-[#1a1208]">{selectedDate?.toLocaleDateString('en-US',{day:'numeric',month:'long'})}</span></div>
                <div className="flex justify-between"><span className="text-[#6b5744]">Time</span><span className="font-bold text-[#C9A84C] text-base">{toAmPm(selectedTime??'')}</span></div>
              </div>
              <div className="space-y-3 mb-4">
                <div>
                  <label htmlFor="client-name" className="block text-sm font-medium text-[#1a1208] mb-1.5">Your name <span className="text-red-600">*</span></label>
                  <input id="client-name" type="text" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" required placeholder="John Smith" className="w-full border border-[#c8bfb0] rounded-xl px-4 py-3 text-sm text-[#1a1208] outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white placeholder-[#a0907e] min-h-[48px]"/>
                </div>
                <div>
                  <label htmlFor="client-phone" className="block text-sm font-medium text-[#1a1208] mb-1.5">Phone <span className="text-red-600">*</span></label>
                  <input id="client-phone" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} autoComplete="tel" required placeholder="+1 (555) 000-0000" className="w-full border border-[#c8bfb0] rounded-xl px-4 py-3 text-sm text-[#1a1208] outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white placeholder-[#a0907e] min-h-[48px]"/>
                </div>
                <div>
                  <label htmlFor="client-email" className="block text-sm font-medium text-[#1a1208] mb-1.5">Email <span className="text-[#6b5744] font-normal text-xs">(for confirmation)</span></label>
                  <input id="client-email" type="email" value={clientEmail} onChange={e=>setClientEmail(e.target.value)} autoComplete="email" placeholder="your@email.com" className="w-full border border-[#c8bfb0] rounded-xl px-4 py-3 text-sm text-[#1a1208] outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white placeholder-[#a0907e] min-h-[48px]"/>
                </div>
                <label className="flex items-start gap-3 py-1 cursor-pointer">
                  <input type="checkbox" checked={smsConsent} onChange={e=>setSmsConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#C9A84C]"/>
                  <span className="text-xs text-[#6b5744] leading-relaxed">I agree to receive SMS reminders about my appointment. Reply STOP to opt out.</span>
                </label>
              </div>
              <div role="alert" aria-live="assertive">
                {error && <div className="text-red-700 text-sm mb-3 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</div>}
              </div>
              <div className="space-y-2">
                <button onClick={handleConfirm} disabled={submitting} className="w-full bg-[#C9A84C] text-black font-bold py-4 rounded-xl hover:bg-[#e8d08a] transition min-h-[52px] text-base disabled:opacity-50 active:scale-[0.98]">
                  {submitting ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg>Booking...</span> : 'Confirm booking →'}
                </button>
                <button onClick={() => setStep('time')} className="w-full text-sm text-[#6b5744] hover:text-[#1a1208] py-2 min-h-[44px] hover:underline">← Back</button>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Footer — always at bottom */}
      <SalonFooter org={org} />
    </main>
  )
}
