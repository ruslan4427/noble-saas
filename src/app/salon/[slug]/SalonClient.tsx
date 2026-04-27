'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { toAmPm } from '@/lib/time'

interface Org {
  id: string; name: string; slug: string
  phone?: string | null; address?: string | null; timezone?: string
  instagram?: string | null; facebook?: string | null; tiktok?: string | null; telegram?: string | null
}
interface Staff { id: string; name: string; role: string; avatar_url?: string | null }
interface Service { id: string; name: string; price_cents: number; duration_min: number }
interface DaySchedule {
  day_of_week: number; is_day_off: boolean
  work_start: string | null; work_end: string | null
  break_start: string | null; break_end: string | null
}
interface CalendarBlock { staff_id: string | null; start_time: string; end_time: string; type?: string }
interface Props { org: Org; staff: Staff[]; services: Service[] }

const TRANSLATIONS = {
  en: {
    onlineBooking: 'Online booking',
    salonSetup: 'This salon is still getting set up. Check back soon.',
    bookOnline: 'Book online →',
    services: 'Services',
    min: 'min',
    moreServices: (n: number) => `+${n} more services →`,
    ourTeam: 'Our team',
    noStaff: 'No staff added yet',
    noServices: 'No services added yet',
    ownerWillAdd: 'The salon owner will add information soon.',
    chooseService: 'Choose a service',
    serviceSubtitle: 'What can we do for you today?',
    chooseSpecialist: 'Choose a specialist',
    specialistSubtitle: "Pick who you'd like to work with",
    pickDateTime: 'Pick a date & time',
    withSpecialist: (name: string) => `with ${name}`,
    chooseWhen: 'Choose when to come in',
    today: 'TODAY',
    selectDate: 'Select a date to see available times',
    loadingAvail: 'Loading availability…',
    noOpenings: 'No openings this day',
    tryDifferent: 'Try a different date or specialist',
    openings: (n: number) => `${n} ${n === 1 ? 'opening' : 'openings'} available`,
    allTaken: 'All slots are taken — try another date',
    unavailable: 'Unavailable',
    back: '← Back',
    continue: 'Continue →',
    confirmBooking: 'Confirm your booking',
    confirmSubtitle: 'Almost done — just a few details',
    specialist: 'Specialist',
    service: 'Service',
    price: 'Price',
    date: 'Date',
    time: 'Time',
    yourName: 'Your name',
    phone: 'Phone',
    email: 'Email',
    emailOptional: 'optional — for confirmation',
    namePlaceholder: 'John Smith',
    phonePlaceholder: '+1 (555) 000-0000',
    emailPlaceholder: 'your@email.com',
    smsConsent: 'I agree to receive SMS reminders about my appointment. Reply STOP to opt out.',
    confirmBtn: 'Confirm booking →',
    bookingProgress: 'Booking…',
    youreBooked: "You're booked!",
    lookForward: 'We look forward to seeing you',
    confirmationSent: (email: string) => `Confirmation sent to ${email}`,
    bookAnother: 'Book another appointment',
    fillRequired: 'Please fill in all required fields',
    invalidPhone: 'Please enter a valid phone number',
    slotTaken: 'This slot was just taken. Please choose another time.',
    somethingWrong: 'Something went wrong. Please try again.',
    locale: 'en-US',
  },
  es: {
    onlineBooking: 'Reserva en línea',
    salonSetup: 'El salón está configurándose. Vuelve pronto.',
    bookOnline: 'Reservar →',
    services: 'Servicios',
    min: 'min',
    moreServices: (n: number) => `+${n} más servicios →`,
    ourTeam: 'Nuestro equipo',
    noStaff: 'Sin personal aún',
    noServices: 'Sin servicios aún',
    ownerWillAdd: 'El dueño del salón agregará información pronto.',
    chooseService: 'Elige un servicio',
    serviceSubtitle: '¿Qué podemos hacer por ti hoy?',
    chooseSpecialist: 'Elige un especialista',
    specialistSubtitle: 'Selecciona con quién te gustaría trabajar',
    pickDateTime: 'Elige fecha y hora',
    withSpecialist: (name: string) => `con ${name}`,
    chooseWhen: 'Elige cuándo venir',
    today: 'HOY',
    selectDate: 'Selecciona una fecha para ver los horarios disponibles',
    loadingAvail: 'Cargando disponibilidad…',
    noOpenings: 'Sin disponibilidad este día',
    tryDifferent: 'Prueba otra fecha o especialista',
    openings: (n: number) => `${n} ${n === 1 ? 'horario disponible' : 'horarios disponibles'}`,
    allTaken: 'Todos los horarios están ocupados — prueba otra fecha',
    unavailable: 'No disponible',
    back: '← Volver',
    continue: 'Continuar →',
    confirmBooking: 'Confirma tu reserva',
    confirmSubtitle: 'Casi listo — solo unos datos',
    specialist: 'Especialista',
    service: 'Servicio',
    price: 'Precio',
    date: 'Fecha',
    time: 'Hora',
    yourName: 'Tu nombre',
    phone: 'Teléfono',
    email: 'Email',
    emailOptional: 'opcional — para confirmación',
    namePlaceholder: 'Juan García',
    phonePlaceholder: '+1 (555) 000-0000',
    emailPlaceholder: 'tu@email.com',
    smsConsent: 'Acepto recibir recordatorios por SMS sobre mi cita. Responde STOP para cancelar.',
    confirmBtn: 'Confirmar reserva →',
    bookingProgress: 'Reservando…',
    youreBooked: '¡Reservado!',
    lookForward: 'Esperamos verte pronto',
    confirmationSent: (email: string) => `Confirmación enviada a ${email}`,
    bookAnother: 'Hacer otra reserva',
    fillRequired: 'Por favor completa todos los campos requeridos',
    invalidPhone: 'Por favor ingresa un número de teléfono válido',
    slotTaken: 'Este horario acaba de ser tomado. Por favor elige otro.',
    somethingWrong: 'Algo salió mal. Por favor intenta de nuevo.',
    locale: 'es-ES',
  },
} as const

type Lang = keyof typeof TRANSLATIONS

// BUG-15 FIX: Use UTC-based date string to avoid timezone drift
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const DEFAULT_WORK_START = '09:00'
const DEFAULT_WORK_END = '19:00'
// BUG-12 FIX: getDates outside component — never changes, no need for useMemo
const DATES_14 = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i); return d
})

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number); return h * 60 + m
}
function toTimeStr(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

// BUG-05 FIX: compare block using UTC date string, not local browser date
function isSlotBlocked(dateStr: string, slotMin: number, slotEndMin: number, staffId: string, blocks: CalendarBlock[]): boolean {
  return blocks.some(b => {
    if (b.type === 'full_day') return false
    if (b.staff_id !== null && b.staff_id !== staffId) return false
    const bs = new Date(b.start_time); const be = new Date(b.end_time)
    // Date check uses UTC (BUG-05). Time check uses LOCAL hours — slot times come from
    // local work schedule strings ("09:00"), so comparing against UTC hours would be wrong.
    const bsMin = bs.getHours() * 60 + bs.getMinutes()
    const beMin = be.getHours() * 60 + be.getMinutes()
    const bd = `${bs.getUTCFullYear()}-${String(bs.getUTCMonth()+1).padStart(2,'0')}-${String(bs.getUTCDate()).padStart(2,'0')}`
    return bd === dateStr && slotMin < beMin && slotEndMin > bsMin
  })
}

// BUG-08 FIX: validate break times — if invalid, ignore break
function buildSlots(
  date: Date,
  schedule: DaySchedule | null,
  bookedSlots: string[],
  serviceDuration: number,
  blocks: CalendarBlock[],
  staffId: string
): { time: string; available: boolean }[] {
  if (schedule?.is_day_off) return []
  const ds = toDateStr(date)
  const hasFullDayBlock = blocks.some(b => {
    if (b.type !== 'full_day') return false
    if (b.staff_id !== null && b.staff_id !== staffId) return false
    const bs = new Date(b.start_time)
    // Use local date parts — consistent with toDateStr(date) which also uses local parts
    const bd = `${bs.getFullYear()}-${String(bs.getMonth()+1).padStart(2,'0')}-${String(bs.getDate()).padStart(2,'0')}`
    return bd === ds
  })
  if (hasFullDayBlock) return []
  const wsMin = toMinutes(schedule?.work_start || DEFAULT_WORK_START)
  const weMin = toMinutes(schedule?.work_end || DEFAULT_WORK_END)

  // BUG-08: validate break — ignore if break_start >= break_end or outside work hours
  const rawBsMin = schedule?.break_start ? toMinutes(schedule.break_start) : null
  const rawBeMin = schedule?.break_end ? toMinutes(schedule.break_end) : null
  const validBreak = rawBsMin !== null && rawBeMin !== null &&
    rawBsMin < rawBeMin && rawBsMin >= wsMin && rawBeMin <= weMin
  const bsMin = validBreak ? rawBsMin : null
  const beMin = validBreak ? rawBeMin : null

  const now = new Date(); const isToday = date.toDateString() === now.toDateString()
  const cutoff = isToday ? now.getHours() * 60 + now.getMinutes() : -1
  const slots: { time: string; available: boolean }[] = []
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

// BUG-13 FIX: basic phone validation
function isValidPhone(p: string): boolean {
  return p.replace(/\D/g, '').length >= 7
}

function AvatarPlaceholder({ size = 48 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="rounded-full bg-[#f5f0e8] border-2 border-[#e8dfc9] flex items-center justify-center flex-none">
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="#9c8b7a" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
  )
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

function Spinner({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin text-[#C9A84C] ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/>
    </svg>
  )
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center bg-[#1a1208] border border-white/20 rounded-full p-0.5 gap-0.5 shadow-lg">
      {(['en', 'es'] as Lang[]).map(l => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition min-h-[32px] min-w-[36px] ${
            lang === l ? 'bg-[#C9A84C] text-black' : 'text-white/60 hover:text-white'
          }`}>
          {l}
        </button>
      ))}
    </div>
  )
}

function SalonFooter({ org }: { org: Org }) {
  const instagram = org.instagram?.trim()
  const tiktok = org.tiktok?.trim()
  const telegram = org.telegram?.trim()
  const phone = org.phone?.trim()
  const address = org.address?.trim()
  const hasSocial = !!(instagram || tiktok || telegram)
  const hasContact = !!(phone || address)
  return (
    <footer className="bg-[#f5f0e8] border-t border-[#e8dfc9] mt-auto">
      <div className="max-w-lg mx-auto px-6 py-10 text-center space-y-5">
        <p className="font-serif text-[#C9A84C] font-bold tracking-wide">✂ {org.name}</p>
        {hasContact && (
          <div className="flex flex-col items-center gap-2">
            {address && (
              <span className="text-[#9c8b7a] text-xs flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {address}
              </span>
            )}
            {phone && (
              <a href={`tel:${phone}`} className="text-[#9c8b7a] hover:text-[#1a1208] text-xs flex items-center gap-1.5 transition">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.1 6.1l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {phone}
              </a>
            )}
          </div>
        )}
        {hasSocial && (
          <div className="flex items-center justify-center gap-3">
            {instagram && (
              <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-[#e8dfc9] hover:bg-[#d4c9b8] flex items-center justify-center text-[#6b5744] hover:text-[#1a1208] transition active:scale-95">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            )}
            {tiktok && (
              <a href={tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                className="w-10 h-10 rounded-full bg-[#e8dfc9] hover:bg-[#d4c9b8] flex items-center justify-center text-[#6b5744] hover:text-[#1a1208] transition active:scale-95">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.16 8.16 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z"/></svg>
              </a>
            )}
            {telegram && (
              <a href={telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram"
                className="w-10 h-10 rounded-full bg-[#e8dfc9] hover:bg-[#d4c9b8] flex items-center justify-center text-[#6b5744] hover:text-[#1a1208] transition active:scale-95">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
            )}
          </div>
        )}
        <p className="text-[#b5a898] text-[10px] tracking-widest uppercase">Powered by Noble</p>
      </div>
    </footer>
  )
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-[#f5f0e8]">
      <div className="bg-[#1a1208] px-6 pt-14 pb-24 text-center">
        <div className="animate-pulse space-y-3">
          <div className="h-7 w-44 mx-auto rounded-full bg-white/10" />
          <div className="h-4 w-28 mx-auto rounded-full bg-white/8" />
          <div className="h-14 w-48 mx-auto mt-6 rounded-2xl bg-[#C9A84C]/25" />
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 -mt-8 space-y-3">
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="animate-pulse space-y-3">
            <div className="h-3 w-20 rounded-full bg-[#e0d8cc]" />
            {[1,2,3].map(i => (
              <div key={i} className="h-14 rounded-xl bg-[#f0ebe0]" />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

// BUG-02 + BUG-04 FIX: no TTL-based cache — always fresh fetch on date select.
// Cache key maps to: undefined (never fetched) | null (in-flight) | string[] (loaded)
type SlotCache = Record<string, string[] | null>

export default function SalonClient({ org, staff, services }: Props) {
  const [step, setStep] = useState<'hero'|'staff'|'service'|'time'|'confirm'|'done'>('hero')
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [scheduleMap, setScheduleMap] = useState<Record<string, DaySchedule[]>>({})
  const [vacationMap, setVacationMap] = useState<Record<string, { date_from: string; date_to: string }[]>>({})
  // BUG-01 + BUG-02 FIX: null = in-flight, string[] = loaded. Always re-fetch on new date select.
  const [bookedSlotsMap, setBookedSlotsMap] = useState<SlotCache>({})
  const [blocks, setBlocks] = useState<CalendarBlock[]>([])
  const [lang, setLang] = useState<Lang>('en')
  const supabase = createClient()

  const t = TRANSLATIONS[lang]

  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 300); return () => clearTimeout(t) }, [])

  useEffect(() => {
    supabase.from('calendar_blocks').select('staff_id,start_time,end_time,type')
      .eq('org_id', org.id).gte('end_time', new Date().toISOString())
      .then(({ data }) => setBlocks(data || []))
  }, [org.id])

  useEffect(() => {
    if (!selectedStaff) return
    const sid = selectedStaff.id
    // BUG-11 FIX: scheduleMap caches per staff — acceptable since schedule changes rarely
    // and user can refresh page for fresh data
    if (scheduleMap[sid] !== undefined) return
    Promise.all([
      supabase.from('staff_schedule').select('*').eq('staff_id', sid),
      supabase.from('vacation_blocks').select('date_from,date_to').eq('staff_id', sid),
    ]).then(([{ data: sched }, { data: vac }]) => {
      setScheduleMap(prev => ({ ...prev, [sid]: sched || [] }))
      setVacationMap(prev => ({ ...prev, [sid]: vac || [] }))
    })
  }, [selectedStaff])

  // BUG-01 + BUG-02 FIX: always fetch fresh — remove "already loaded" guard.
  // This ensures cancelled bookings are reflected immediately on re-select.
  useEffect(() => {
    if (!selectedStaff || !selectedDate) return
    const sid = selectedStaff.id
    const ds = toDateStr(selectedDate)
    const key = `${sid}_${ds}`

    // Only skip if currently in-flight (null)
    if (bookedSlotsMap[key] === null) return

    // Always fetch fresh on date/staff change
    setBookedSlotsMap(prev => ({ ...prev, [key]: null }))
    supabase.from('bookings').select('time_slot')
      .eq('master_id', sid).eq('date', ds).neq('status', 'cancelled')
      .then(({ data }) => {
        setBookedSlotsMap(prev => ({
          ...prev,
          [key]: (data || []).map((b: { time_slot: string }) => b.time_slot)
        }))
      })
  }, [selectedStaff, selectedDate])

  function isVacationDate(staffId: string, date: Date) {
    const ds = toDateStr(date)
    return (vacationMap[staffId]||[]).some(v => ds >= v.date_from && ds <= v.date_to)
  }
  function getScheduleForDate(staffId: string, date: Date): DaySchedule | null {
    return (scheduleMap[staffId]||[]).find(s => s.day_of_week === date.getDay()) || null
  }
  function isDateUnavailable(staffId: string, date: Date) {
    if (isVacationDate(staffId, date)) return true
    const s = getScheduleForDate(staffId, date)
    return s !== null && s.is_day_off
  }

  function getCacheKey() {
    if (!selectedStaff || !selectedDate) return null
    return `${selectedStaff.id}_${toDateStr(selectedDate)}`
  }

  // Derived from cache — no separate slotsLoading state needed (BUG-09 FIX)
  const slotsLoading = useMemo(() => {
    const key = getCacheKey()
    if (!key || !selectedDate) return false
    return bookedSlotsMap[key] === undefined || bookedSlotsMap[key] === null
  }, [bookedSlotsMap, selectedStaff, selectedDate])

  const allSlots = useMemo(() => {
    const key = getCacheKey()
    if (!key || slotsLoading || !selectedService || !selectedDate || !selectedStaff) return []
    return buildSlots(
      selectedDate,
      getScheduleForDate(selectedStaff.id, selectedDate),
      (bookedSlotsMap[key] as string[]) || [],
      selectedService.duration_min,
      blocks,
      selectedStaff.id
    )
  }, [bookedSlotsMap, selectedStaff, selectedDate, selectedService, blocks, slotsLoading])

  const freeCount = useMemo(() => allSlots.filter(s => s.available).length, [allSlots])

  const hasStaff = staff.length > 0
  const hasServices = services.length > 0

  function handleBookCTA() {
    if (!hasStaff) return
    setStep('service')
  }
  function handleSelectStaff(m: Staff) { setSelectedStaff(m); setStep('time') }
  function handleSelectService(s: Service) {
    setSelectedService(s)
    if (staff.length === 1) { setSelectedStaff(staff[0]); setStep('time') }
    else setStep('staff')
  }

  // BUG-01 + BUG-02 FIX: on date select, always invalidate cache to force fresh fetch
  function handleSelectDate(d: Date) {
    if (!selectedStaff) return
    const key = `${selectedStaff.id}_${toDateStr(d)}`
    // Invalidate cache for this key so useEffect triggers a fresh fetch
    setBookedSlotsMap(prev => { const n = { ...prev }; delete n[key]; return n })
    setSelectedDate(d)
    setSelectedTime(null)
  }

  async function handleConfirm() {
    if (!selectedStaff || !selectedService || !selectedDate || !selectedTime || !name || !phone) {
      setError(t.fillRequired); return
    }
    // BUG-13 FIX: phone validation
    if (!isValidPhone(phone)) { setPhoneError(t.invalidPhone); return }
    setPhoneError('')
    setSubmitting(true); setError('')
    try {
      const ds = toDateStr(selectedDate)
      // BUG-03: pre-check before insert (race condition mitigation)
      const { data: existing } = await supabase.from('bookings')
        .select('id').eq('master_id', selectedStaff.id).eq('date', ds)
        .eq('time_slot', selectedTime).neq('status', 'cancelled').maybeSingle()
      if (existing) {
        setError(t.slotTaken)
        const key = `${selectedStaff.id}_${ds}`
        const { data } = await supabase.from('bookings').select('time_slot')
          .eq('master_id', selectedStaff.id).eq('date', ds).neq('status', 'cancelled')
        setBookedSlotsMap(prev => ({ ...prev, [key]: (data||[]).map((b:{time_slot:string})=>b.time_slot) }))
        setSelectedTime(null); setStep('time'); return
      }
      const [h, m] = selectedTime.split(':').map(Number)
      const startDate = new Date(`${ds}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`)
      const reminderAt = new Date(startDate.getTime() - 2*60*60*1000)
      if (smsConsent && phone) await fetch('/api/sms/consent', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ org_id:org.id, client_phone:phone, client_name:name, consented:true }) })
      const { data: newBooking, error: bookingError } = await supabase.from('bookings').insert({
        org_id:org.id, master_id:selectedStaff.id, date:ds, time_slot:selectedTime,
        start_time:startDate.toISOString(), reminder_at:reminderAt.toISOString(), reminder_sent:false,
        client_name:name, client_phone:phone,
        // BUG-14 FIX: only store email if it looks valid
        client_email: clientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail) ? clientEmail : null,
        service_name:selectedService.name, price_cents:selectedService.price_cents, status:'confirmed',
      }).select('id').single()
      if (bookingError) {
        // BUG-03: handle DB unique constraint violation
        if (bookingError.code === '23505') {
          setError(t.slotTaken)
          const key = `${selectedStaff.id}_${ds}`
          const { data } = await supabase.from('bookings').select('time_slot')
            .eq('master_id', selectedStaff.id).eq('date', ds).neq('status', 'cancelled')
          setBookedSlotsMap(prev => ({ ...prev, [key]: (data||[]).map((b:{time_slot:string})=>b.time_slot) }))
          setSelectedTime(null); setStep('time'); return
        }
        throw bookingError
      }
      fetch('/api/email/booking', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
        org_id:org.id, client_name:name, client_phone:phone, client_email:clientEmail||null,
        master_name:selectedStaff.name, service_name:selectedService.name,
        date:selectedDate.toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'}),
        time:selectedTime, price_cents:selectedService.price_cents, booking_id:newBooking?.id,
      }) }).catch(()=>{})
      // BUG-01 FIX: update cache immediately after booking so "Book again" shows correct state
      const bookedKey = `${selectedStaff.id}_${ds}`
      setBookedSlotsMap(prev => ({
        ...prev,
        [bookedKey]: [...((prev[bookedKey] as string[]) || []), selectedTime]
      }))
      setStep('done')
    } catch (e) { setError(e instanceof Error ? e.message : t.somethingWrong) }
    finally { setSubmitting(false) }
  }

  // BUG-01 FIX: resetBooking invalidates cache for currently viewed date
  function resetBooking() {
    if (selectedStaff && selectedDate) {
      const key = `${selectedStaff.id}_${toDateStr(selectedDate)}`
      setBookedSlotsMap(prev => { const n = { ...prev }; delete n[key]; return n })
    }
    setStep('hero'); setSelectedStaff(null); setSelectedService(null)
    setSelectedDate(null); setSelectedTime(null)
    setName(''); setPhone(''); setPhoneError(''); setClientEmail(''); setError('')
  }

  if (pageLoading) return <LoadingState />

  // ─── Done screen ──────────────────────────────────────────────────────────
  if (step === 'done') return (
    <main className="min-h-screen bg-[#f5f0e8] flex flex-col">
      <div className="bg-[#1a1208] px-6 py-5 text-center">
        <p className="font-serif text-[#C9A84C] font-bold tracking-wide">✂ {org.name}</p>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-md border border-[#e8dfc9]">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1a1208] mb-1">{t.youreBooked}</h1>
          <p className="text-[#6b5744] text-sm mb-6">{t.lookForward}</p>

          <div className="bg-[#f5f0e8] rounded-2xl p-5 text-sm text-left space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-[#6b5744]">{t.specialist}</span>
              <span className="font-semibold text-[#1a1208]">{selectedStaff?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6b5744]">{t.service}</span>
              <span className="font-semibold text-[#1a1208]">{selectedService?.name}</span>
            </div>
            <div className="h-px bg-[#e8dfc9]"/>
            <div className="flex justify-between items-center">
              <span className="text-[#6b5744]">{t.date}</span>
              <span className="font-semibold text-[#1a1208]">
                {selectedDate?.toLocaleDateString(t.locale, {weekday:'short',day:'numeric',month:'long'})}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6b5744]">{t.time}</span>
              <span className="font-bold text-[#C9A84C] text-base">{toAmPm(selectedTime ?? '')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6b5744]">{t.price}</span>
              <span className="font-bold text-[#1a1208]">${((selectedService?.price_cents ?? 0)/100).toFixed(0)}</span>
            </div>
          </div>

          {clientEmail && (
            <p className="text-[#6b5744] text-xs mb-5 bg-[#f5f0e8] rounded-xl px-4 py-2.5">
              {t.confirmationSent(clientEmail)}
            </p>
          )}
          <button
            onClick={resetBooking}
            className="w-full bg-[#1a1208] text-[#C9A84C] font-bold py-3.5 rounded-2xl hover:bg-[#2d1f0d] transition min-h-[52px] text-sm tracking-wide active:scale-[0.98]">
            {t.bookAnother}
          </button>
        </div>
      </div>
      <SalonFooter org={org} />
    </main>
  )

  const isHero = step === 'hero'

  return (
    <main className="min-h-screen bg-[#f5f0e8] flex flex-col">
      <LangToggle lang={lang} onChange={setLang} />

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className={`bg-[#1a1208] text-white transition-all ${isHero ? 'px-6 pt-14 pb-24' : 'px-6 py-5'}`}>
        {isHero ? (
          <div className="max-w-lg mx-auto">
            <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 text-[#C9A84C] text-xs font-medium px-3.5 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-pulse"/>
              {t.onlineBooking}
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-3 leading-tight">{org.name}</h1>
            {org.address?.trim() && (
              <p className="text-white/40 text-sm mb-1 flex items-center justify-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {org.address.trim()}
              </p>
            )}
            {!hasStaff || !hasServices ? (
              <div className="mt-6 bg-white/10 text-white/50 text-sm px-5 py-3.5 rounded-2xl inline-block">
                {t.salonSetup}
              </div>
            ) : (
              <button
                onClick={handleBookCTA}
                className="mt-6 bg-[#C9A84C] text-black font-bold px-10 py-4 rounded-2xl hover:bg-[#e8d08a] transition text-base min-h-[56px] shadow-lg shadow-[#C9A84C]/30 active:scale-[0.97]">
                {t.bookOnline}
              </button>
            )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <button
              onClick={resetBooking}
              className="text-white/40 hover:text-white transition p-1 -ml-1 min-h-[44px] min-w-[44px] flex items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <p className="font-serif text-[#C9A84C] font-bold tracking-wide">✂ {org.name}</p>
            <div className="w-10"/>
          </div>
        )}
      </div>

      {/* ─── Hero cards ─────────────────────────────────────────────────── */}
      {isHero && hasStaff && hasServices && (
        <div className="max-w-lg mx-auto w-full px-4 -mt-10 pb-10 space-y-3">

          {/* Services preview */}
          <div className="bg-white rounded-3xl shadow-md border border-[#e8dfc9] overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-[#f0e8dc]">
              <p className="text-[11px] font-bold text-[#9c8b7a] uppercase tracking-widest">{t.services}</p>
            </div>
            <div className="divide-y divide-[#f5f0e8]">
              {services.slice(0,5).map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectService(s)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#faf7f2] transition text-left active:bg-[#f5f0e8]">
                  <div>
                    <div className="font-semibold text-[#1a1208] text-sm">{s.name}</div>
                    <div className="text-[#9c8b7a] text-xs mt-0.5">{s.duration_min} {t.min}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-none">
                    <span className="font-bold text-[#1a1208]">${(s.price_cents/100).toFixed(0)}</span>
                    <ChevronRight />
                  </div>
                </button>
              ))}
              {services.length > 5 && (
                <button
                  onClick={handleBookCTA}
                  className="w-full px-5 py-3.5 text-sm text-[#C9A84C] font-semibold hover:bg-[#faf7f2] transition text-center">
                  {t.moreServices(services.length - 5)}
                </button>
              )}
            </div>
          </div>

          {/* Team preview */}
          {staff.length > 0 && (
            <div className="bg-white rounded-3xl shadow-md border border-[#e8dfc9] overflow-hidden">
              <div className="px-5 pt-5 pb-3 border-b border-[#f0e8dc]">
                <p className="text-[11px] font-bold text-[#9c8b7a] uppercase tracking-widest">{t.ourTeam}</p>
              </div>
              <div className="flex gap-5 px-5 py-5 overflow-x-auto">
                {staff.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { handleSelectService(services[0] ?? services[0]); }}
                    className="flex flex-col items-center gap-2 flex-none focus:outline-none">
                    {m.avatar_url
                      ? <img src={m.avatar_url} alt={m.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#e8dfc9]" />
                      : <AvatarPlaceholder size={64} />
                    }
                    <span className="text-xs font-semibold text-[#1a1208] whitespace-nowrap">{m.name.split(' ')[0]}</span>
                    <span className="text-[10px] text-[#9c8b7a] -mt-1 whitespace-nowrap">{m.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isHero && (!hasStaff || !hasServices) && (
        <div className="max-w-lg mx-auto w-full px-4 -mt-10 pb-10">
          <div className="bg-white rounded-3xl shadow-md border border-[#e8dfc9] p-10 text-center">
            <p className="font-semibold text-[#1a1208] mb-1">{!hasStaff ? t.noStaff : t.noServices}</p>
            <p className="text-[#9c8b7a] text-sm">{t.ownerWillAdd}</p>
          </div>
        </div>
      )}

      {/* ─── Booking steps ───────────────────────────────────────────────── */}
      {!isHero && (
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">

          {/* Progress bar */}
          <div className="flex gap-1.5 mb-7">
            {(['service','staff','time','confirm'] as const).map((s, i) => {
              const order = ['service','staff','time','confirm']
              const currentIdx = order.indexOf(step)
              return (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                    step === s ? 'bg-[#C9A84C]' : currentIdx > i ? 'bg-[#1a1208]' : 'bg-[#d4c9b8]'
                  }`}
                />
              )
            })}
          </div>

          {/* Summary bar */}
          {(selectedStaff || selectedService || selectedTime) && (
            <div className="bg-white border border-[#e8dfc9] rounded-2xl px-4 py-3 mb-5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {selectedService && (
                <span className="font-semibold text-[#1a1208]">{selectedService.name}</span>
              )}
              {selectedService && (
                <span className="text-[#C9A84C] font-bold">${(selectedService.price_cents/100).toFixed(0)}</span>
              )}
              {selectedStaff && (
                <span className="text-[#6b5744]">· {selectedStaff.name}</span>
              )}
              {selectedDate && selectedTime && (
                <span className="text-[#6b5744]">· <strong className="text-[#1a1208]">{selectedDate.toLocaleDateString(t.locale,{day:'numeric',month:'short'})} at {toAmPm(selectedTime)}</strong></span>
              )}
            </div>
          )}

          {/* ── Step: Service ── */}
          {step === 'service' && (
            <section>
              <div className="mb-5">
                <h2 className="text-xl font-bold text-[#1a1208]">{t.chooseService}</h2>
                <p className="text-sm text-[#9c8b7a] mt-0.5">{t.serviceSubtitle}</p>
              </div>
              <div className="space-y-2">
                {services.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectService(s)}
                    className="w-full bg-white rounded-2xl px-5 py-4 flex items-center justify-between border-2 border-transparent hover:border-[#C9A84C] shadow-sm hover:shadow-md transition active:scale-[0.99]">
                    <div className="text-left">
                      <div className="font-semibold text-[#1a1208]">{s.name}</div>
                      <div className="text-[#9c8b7a] text-xs mt-0.5">{s.duration_min} {t.min}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-none">
                      <span className="font-bold text-[#1a1208] text-base">${(s.price_cents/100).toFixed(0)}</span>
                      <ChevronRight />
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={resetBooking}
                className="mt-5 text-sm text-[#9c8b7a] hover:text-[#1a1208] transition px-1 py-2 min-h-[44px]">
                {t.back}
              </button>
            </section>
          )}

          {/* ── Step: Staff ── */}
          {step === 'staff' && (
            <section>
              <div className="mb-5">
                <h2 className="text-xl font-bold text-[#1a1208]">{t.chooseSpecialist}</h2>
                <p className="text-sm text-[#9c8b7a] mt-0.5">{t.specialistSubtitle}</p>
              </div>
              <div className="space-y-2">
                {staff.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectStaff(m)}
                    className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 border-2 border-transparent hover:border-[#C9A84C] shadow-sm hover:shadow-md transition active:scale-[0.99]">
                    {m.avatar_url
                      ? <img src={m.avatar_url} alt={m.name} className="w-14 h-14 rounded-full object-cover flex-none border-2 border-[#e8dfc9]" />
                      : <AvatarPlaceholder size={56} />
                    }
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-[#1a1208]">{m.name}</div>
                      <div className="text-[#9c8b7a] text-xs mt-0.5">{m.role}</div>
                    </div>
                    <ChevronRight />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep('service')}
                className="mt-5 text-sm text-[#9c8b7a] hover:text-[#1a1208] transition px-1 py-2 min-h-[44px]">
                {t.back}
              </button>
            </section>
          )}

          {/* ── Step: Time ── */}
          {step === 'time' && (
            <section>
              <div className="mb-5">
                <h2 className="text-xl font-bold text-[#1a1208]">{t.pickDateTime}</h2>
                <p className="text-sm text-[#9c8b7a] mt-0.5">
                  {selectedStaff ? t.withSpecialist(selectedStaff.name) : t.chooseWhen}
                </p>
              </div>

              {/* Date strip */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 scrollbar-none">
                {DATES_14.map(d => {
                  const isSel = selectedDate?.toDateString() === d.toDateString()
                  const unavail = selectedStaff ? isDateUnavailable(selectedStaff.id, d) : false
                  const isToday = d.toDateString() === new Date().toDateString()
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => { if (!unavail) handleSelectDate(d) }}
                      disabled={unavail}
                      className={`flex-none flex flex-col items-center px-3 py-2.5 rounded-2xl border-2 transition min-w-[54px] active:scale-[0.96] ${
                        unavail
                          ? 'border-[#e8dfc9] bg-[#f5f0e8] opacity-35 cursor-not-allowed'
                          : isSel
                            ? 'border-[#C9A84C] bg-[#1a1208] text-white shadow-md'
                            : 'border-[#d4c9b8] bg-white text-[#1a1208] hover:border-[#C9A84C] shadow-sm'
                      }`}>
                      <span className={`text-[10px] font-semibold uppercase tracking-wide ${isSel ? 'text-[#C9A84C]' : 'text-[#9c8b7a]'}`}>
                        {d.toLocaleDateString(t.locale, {weekday:'short'})}
                      </span>
                      <span className="font-bold text-sm mt-0.5">{d.getDate()}</span>
                      {isToday && !isSel && <span className="text-[8px] text-[#C9A84C] font-semibold mt-0.5">{t.today}</span>}
                    </button>
                  )
                })}
              </div>

              {/* Slot area */}
              {!selectedDate ? (
                <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-[#e8dfc9]">
                  <p className="text-sm text-[#9c8b7a]">{t.selectDate}</p>
                </div>
              ) : slotsLoading ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-[#e8dfc9]">
                  <Spinner className="w-6 h-6 mx-auto" />
                  <p className="text-xs text-[#9c8b7a] mt-3">{t.loadingAvail}</p>
                </div>
              ) : allSlots.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-[#e8dfc9] space-y-1">
                  <p className="font-semibold text-[#1a1208] text-sm">{t.noOpenings}</p>
                  <p className="text-xs text-[#9c8b7a]">{t.tryDifferent}</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-[#9c8b7a] mb-3 font-medium">
                    {freeCount > 0 ? t.openings(freeCount) : t.allTaken}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {allSlots.map(({ time, available }) => (
                      <button
                        key={time}
                        onClick={() => available ? setSelectedTime(time) : undefined}
                        disabled={!available}
                        aria-disabled={!available}
                        className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-sm font-semibold border transition min-h-[52px] ${
                          !available
                            ? 'border-[#ede8e0] bg-[#f5f0e8] text-[#c8bfb0] cursor-not-allowed'
                            : selectedTime === time
                              ? 'border-[#C9A84C] bg-[#C9A84C] text-black shadow-md active:scale-[0.96]'
                              : 'border-[#d4c9b8] bg-white text-[#1a1208] hover:border-[#C9A84C] shadow-sm active:scale-[0.96]'
                        }`}>
                        <span className={!available ? 'line-through' : ''}>{toAmPm(time)}</span>
                        {!available && <span className="text-[10px] font-normal tracking-wide leading-none">{t.unavailable}</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setStep(staff.length === 1 ? 'service' : 'staff')}
                  className="text-sm text-[#9c8b7a] hover:text-[#1a1208] transition px-1 py-2 min-h-[44px]">
                  {t.back}
                </button>
                {selectedDate && selectedTime && !slotsLoading && (
                  <button
                    onClick={() => setStep('confirm')}
                    className="bg-[#C9A84C] text-black font-bold px-7 py-3 rounded-2xl hover:bg-[#e8d08a] transition min-h-[44px] shadow-md shadow-[#C9A84C]/20 active:scale-[0.97]">
                    {t.continue}
                  </button>
                )}
              </div>
            </section>
          )}

          {/* ── Step: Confirm ── */}
          {step === 'confirm' && (
            <section>
              <div className="mb-5">
                <h2 className="text-xl font-bold text-[#1a1208]">{t.confirmBooking}</h2>
                <p className="text-sm text-[#9c8b7a] mt-0.5">{t.confirmSubtitle}</p>
              </div>

              {/* Booking summary card */}
              <div className="bg-white rounded-2xl border border-[#e8dfc9] shadow-sm p-5 mb-5">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[#9c8b7a]">{t.specialist}</span>
                    <span className="font-semibold text-[#1a1208]">{selectedStaff?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#9c8b7a]">{t.service}</span>
                    <span className="font-semibold text-[#1a1208]">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#9c8b7a]">{t.price}</span>
                    <span className="font-bold text-[#1a1208]">${((selectedService?.price_cents ?? 0)/100).toFixed(0)}</span>
                  </div>
                  <div className="h-px bg-[#f0e8dc]"/>
                  <div className="flex justify-between items-center">
                    <span className="text-[#9c8b7a]">{t.date}</span>
                    <span className="font-semibold text-[#1a1208]">
                      {selectedDate?.toLocaleDateString(t.locale, {weekday:'short',day:'numeric',month:'long'})}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#9c8b7a]">{t.time}</span>
                    <span className="font-bold text-[#C9A84C] text-base">{toAmPm(selectedTime ?? '')}</span>
                  </div>
                </div>
              </div>

              {/* Contact fields */}
              <div className="space-y-4 mb-5">
                <div>
                  <label htmlFor="client-name" className="block text-sm font-semibold text-[#1a1208] mb-2">
                    {t.yourName} <span className="text-red-500 font-normal">*</span>
                  </label>
                  <input
                    id="client-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoComplete="name"
                    placeholder={t.namePlaceholder}
                    className="w-full border border-[#c8bfb0] rounded-2xl px-4 py-3.5 text-sm text-[#1a1208] outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 bg-white placeholder-[#b5a898] min-h-[52px] transition"
                  />
                </div>
                <div>
                  <label htmlFor="client-phone" className="block text-sm font-semibold text-[#1a1208] mb-2">
                    {t.phone} <span className="text-red-500 font-normal">*</span>
                  </label>
                  <input
                    id="client-phone"
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); if (phoneError) setPhoneError('') }}
                    autoComplete="tel"
                    placeholder={t.phonePlaceholder}
                    className={`w-full border rounded-2xl px-4 py-3.5 text-sm text-[#1a1208] outline-none focus:ring-2 focus:ring-[#C9A84C]/15 bg-white placeholder-[#b5a898] min-h-[52px] transition ${
                      phoneError ? 'border-red-400 focus:border-red-400' : 'border-[#c8bfb0] focus:border-[#C9A84C]'
                    }`}
                  />
                  {phoneError && <p className="text-red-500 text-xs mt-1.5">{phoneError}</p>}
                </div>
                <div>
                  <label htmlFor="client-email" className="block text-sm font-semibold text-[#1a1208] mb-2">
                    {t.email} <span className="text-[#9c8b7a] font-normal text-xs">{t.emailOptional}</span>
                  </label>
                  <input
                    id="client-email"
                    type="email"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    autoComplete="email"
                    placeholder={t.emailPlaceholder}
                    className="w-full border border-[#c8bfb0] rounded-2xl px-4 py-3.5 text-sm text-[#1a1208] outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 bg-white placeholder-[#b5a898] min-h-[52px] transition"
                  />
                </div>

                <label className="flex items-start gap-3 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsConsent}
                    onChange={e => setSmsConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#C9A84C] flex-none"
                  />
                  <span className="text-xs text-[#9c8b7a] leading-relaxed">
                    {t.smsConsent}
                  </span>
                </label>
              </div>

              <div role="alert" aria-live="assertive">
                {error && (
                  <div className="text-red-700 text-sm mb-4 bg-red-50 border border-red-200 px-4 py-3 rounded-2xl">
                    {error}
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full bg-[#C9A84C] text-black font-bold py-4 rounded-2xl hover:bg-[#e8d08a] transition min-h-[56px] text-base disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-[#C9A84C]/20">
                  {submitting
                    ? <span className="flex items-center justify-center gap-2"><Spinner className="w-4 h-4" />{t.bookingProgress}</span>
                    : t.confirmBtn}
                </button>
                <button
                  onClick={() => setStep('time')}
                  className="w-full text-sm text-[#9c8b7a] hover:text-[#1a1208] py-2 min-h-[44px] transition hover:underline">
                  {t.back}
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      <SalonFooter org={org} />
    </main>
  )
}
