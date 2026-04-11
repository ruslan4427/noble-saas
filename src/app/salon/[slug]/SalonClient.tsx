'use client'
import { useState } from 'react'
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

interface Props {
  org: Org
  staff: Staff[]
  services: Service[]
}

const STEPS = ['Майстер', 'Послуга', 'Час', 'Підсумок']

function getDates() {
  const dates = []
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
}

function getTimeSlots() {
  const slots = []
  for (let h = 9; h < 19; h++) {
    slots.push(`${String(h).padStart(2,'0')}:00`)
    slots.push(`${String(h).padStart(2,'0')}:30`)
  }
  return slots
}

export default function SalonClient({ org, staff, services }: Props) {
  const [step, setStep] = useState(0)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const dates = getDates()
  const timeSlots = getTimeSlots()

  async function handleConfirm() {
    if (!selectedStaff || !selectedService || !selectedDate || !selectedTime || !name || !phone) {
      setError('Будь ласка, заповніть всі обов\'язкові поля')
      return
    }
    setLoading(true)
    setError('')
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const dateFormatted = selectedDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const startISO = `${dateStr}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00`
      const startDate = new Date(startISO)
      const reminderAt = new Date(startDate.getTime() - 2 * 60 * 60 * 1000)

      const { error: bookingError } = await supabase.from('bookings').insert({
        org_id: org.id,
        master_id: selectedStaff.id,
        date: dateStr,
        time_slot: selectedTime,
        start_time: startDate.toISOString(),
        reminder_at: clientEmail ? reminderAt.toISOString() : null,
        reminder_sent: false,
        client_name: name,
        client_phone: phone,
        client_email: clientEmail || null,
        service_name: selectedService.name,
        price_cents: selectedService.price_cents,
        status: 'confirmed',
      })
      if (bookingError) throw bookingError

      fetch('/api/email/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: org.id,
          client_name: name,
          client_phone: phone,
          client_email: clientEmail || null,
          master_name: selectedStaff.name,
          service_name: selectedService.name,
          date: dateFormatted,
          time: selectedTime,
          price_cents: selectedService.price_cents,
        }),
      }).catch(err => console.warn('Email notification failed:', err))

      if (smsConsent) {
        await fetch('/api/sms/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ org_id: org.id, client_phone: phone, client_name: name, consented: true }),
        })
      }
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-[#f5f0e8] flex items-center justify-center px-4" lang="uk">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg" role="status" aria-live="polite">
          <div className="text-5xl mb-4" aria-hidden="true">✅</div>
          <h1 className="text-2xl font-bold mb-2 text-[#1a1208]">Запис підтверджено!</h1>
          <p className="text-[#8b7a65] text-sm mb-1">{selectedStaff?.name}</p>
          <p className="text-[#8b7a65] text-sm mb-1">{selectedService?.name} · ${((selectedService?.price_cents || 0) / 100).toFixed(0)}</p>
          <p className="text-[#8b7a65] text-sm mb-2">{selectedDate?.toLocaleDateString('uk-UA')} о {selectedTime}</p>
          {clientEmail && (
            <p className="text-[#C9A84C] text-xs mb-4">📧 Підтвердження та нагадування надіслано на {clientEmail}</p>
          )}
          <button
            onClick={() => {
              setDone(false); setStep(0);
              setSelectedStaff(null); setSelectedService(null);
              setSelectedDate(null); setSelectedTime(null);
              setName(''); setPhone(''); setClientEmail('');
            }}
            className="bg-[#C9A84C] text-black font-bold px-6 py-3 rounded-lg hover:bg-[#e8d08a] transition min-h-[44px]">
            Новий запис
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8]" lang="uk">

      {/* Salon header */}
      <div className="bg-[#1a1208] text-white px-6 py-8 text-center">
        <h1 className="font-serif text-3xl font-bold mb-1">{org.name}</h1>
        {org.address && <p className="text-white/60 text-sm">{org.address}</p>}
        {org.phone && <p className="text-white/60 text-sm">{org.phone}</p>}
      </div>

      {/* Stepper — WCAG aria-label + aria-current */}
      <nav aria-label="Кроки бронювання" className="bg-white border-b border-[#e8dfc9]">
        <ol className="flex justify-center gap-2 px-6 py-4" role="list">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${i <= step ? 'bg-[#C9A84C] text-black' : 'bg-[#e8dfc9] text-[#8b7a65]'}`}
                aria-label={`Крок ${i + 1}: ${s}${i === step ? ' (поточний)' : i < step ? ' (завершено)' : ''}`}
                aria-current={i === step ? 'step' : undefined}
              >
                {i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i <= step ? 'text-[#1a1208] font-medium' : 'text-[#8b7a65]'}`} aria-hidden="true">{s}</span>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-[#e8dfc9]" aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </nav>

      {/* Summary bar — shows selections above fold */}
      {(selectedStaff || selectedService || selectedTime) && (
        <div className="bg-[#f5f0e8] border-b border-[#e8dfc9] px-4 py-2" aria-label="Ваш вибір" role="status">
          <div className="max-w-lg mx-auto flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8b7a65]">
            {selectedStaff && <span>✂ <strong className="text-[#1a1208]">{selectedStaff.name}</strong></span>}
            {selectedService && <span>· <strong className="text-[#1a1208]">{selectedService.name}</strong> ${(selectedService.price_cents/100).toFixed(0)}</span>}
            {selectedDate && selectedTime && <span>· <strong className="text-[#1a1208]">{selectedDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })} о {selectedTime}</strong></span>}
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Step 0 — Майстер */}
        {step === 0 && (
          <section aria-labelledby="step-master">
            <h2 id="step-master" className="text-xl font-bold text-[#1a1208] mb-4">Оберіть майстра</h2>
            {staff.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-[#8b7a65]">Майстрів ще немає</div>
            ) : (
              <div className="grid grid-cols-2 gap-3" role="list">
                {staff.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedStaff(m); setStep(1) }}
                    aria-pressed={selectedStaff?.id === m.id}
                    aria-label={`Обрати майстра ${m.name}, ${m.role}`}
                    className={`bg-white rounded-xl p-4 text-left border-2 transition hover:border-[#C9A84C] min-h-[80px] ${selectedStaff?.id === m.id ? 'border-[#C9A84C]' : 'border-transparent'}`}>
                    <div className="w-12 h-12 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-xl mb-2" aria-hidden="true">✂</div>
                    <div className="font-semibold text-[#1a1208] text-sm">{m.name}</div>
                    <div className="text-[#8b7a65] text-xs capitalize">{m.role}</div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Step 1 — Послуга */}
        {step === 1 && (
          <section aria-labelledby="step-service">
            <h2 id="step-service" className="text-xl font-bold text-[#1a1208] mb-4">Оберіть послугу</h2>
            {services.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-[#8b7a65]">Послуг ще немає</div>
            ) : (
              <div className="space-y-2" role="list">
                {services.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedService(s); setStep(2) }}
                    aria-pressed={selectedService?.id === s.id}
                    aria-label={`${s.name}, ${s.duration_min} хвилин, $${(s.price_cents/100).toFixed(0)}`}
                    className={`w-full bg-white rounded-xl p-4 flex items-center justify-between border-2 transition hover:border-[#C9A84C] min-h-[64px] ${selectedService?.id === s.id ? 'border-[#C9A84C]' : 'border-transparent'}`}>
                    <div className="text-left">
                      <div className="font-semibold text-[#1a1208]">{s.name}</div>
                      <div className="text-[#8b7a65] text-sm">{s.duration_min} хв</div>
                    </div>
                    <div className="font-bold text-[#C9A84C]">${(s.price_cents / 100).toFixed(0)}</div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setStep(0)} className="mt-4 text-sm text-[#8b7a65] hover:text-[#1a1208] px-2 py-3 min-h-[44px]">← Назад</button>
          </section>
        )}

        {/* Step 2 — Час */}
        {step === 2 && (
          <section aria-labelledby="step-time">
            <h2 id="step-time" className="text-xl font-bold text-[#1a1208] mb-4">Оберіть час</h2>

            {/* Date picker */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4" role="group" aria-label="Оберіть дату">
              {dates.map(d => (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDate(d)}
                  aria-pressed={selectedDate?.toDateString() === d.toDateString()}
                  aria-label={d.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}
                  className={`flex-none flex flex-col items-center px-3 py-3 rounded-xl border-2 transition min-w-[52px] min-h-[56px] ${selectedDate?.toDateString() === d.toDateString() ? 'border-[#C9A84C] bg-[#C9A84C]/10' : 'border-[#e8dfc9] bg-white'}`}>
                  <span className="text-xs text-[#8b7a65]" aria-hidden="true">{d.toLocaleDateString('uk-UA', { weekday: 'short' })}</span>
                  <span className="font-bold text-[#1a1208]" aria-hidden="true">{d.getDate()}</span>
                </button>
              ))}
            </div>

            {/* Time slots — 44px height */}
            {selectedDate && (
              <div className="grid grid-cols-4 gap-2" role="group" aria-label="Оберіть час">
                {timeSlots.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    aria-pressed={selectedTime === t}
                    aria-label={`${t} — ${selectedTime === t ? 'обрано' : 'доступно'}`}
                    className={`py-3 rounded-lg text-sm font-medium border transition min-h-[44px] ${selectedTime === t ? 'border-[#C9A84C] bg-[#C9A84C] text-black' : 'border-[#e8dfc9] bg-white text-[#1a1208] hover:border-[#C9A84C]'}`}>
                    {t}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep(1)} className="text-sm text-[#8b7a65] hover:text-[#1a1208] px-2 py-3 min-h-[44px]">← Назад</button>
              {selectedDate && selectedTime && (
                <button onClick={() => setStep(3)} className="ml-auto bg-[#C9A84C] text-black font-bold px-6 py-3 rounded-lg hover:bg-[#e8d08a] transition min-h-[44px]">
                  Далі →
                </button>
              )}
            </div>
          </section>
        )}

        {/* Step 3 — Підтвердження */}
        {step === 3 && (
          <section aria-labelledby="step-confirm">
            <h2 id="step-confirm" className="text-xl font-bold text-[#1a1208] mb-4">Підтвердження</h2>

            {/* Booking summary */}
            <div className="bg-white rounded-xl p-4 mb-4 space-y-2 text-sm" aria-label="Деталі запису">
              <div className="flex justify-between"><span className="text-[#8b7a65]">Майстер</span><span className="font-medium">{selectedStaff?.name}</span></div>
              <div className="flex justify-between"><span className="text-[#8b7a65]">Послуга</span><span className="font-medium">{selectedService?.name}</span></div>
              <div className="flex justify-between"><span className="text-[#8b7a65]">Вартість</span><span className="font-bold text-[#C9A84C]">${((selectedService?.price_cents || 0) / 100).toFixed(0)}</span></div>
              <div className="flex justify-between"><span className="text-[#8b7a65]">Дата</span><span className="font-medium">{selectedDate?.toLocaleDateString('uk-UA')}</span></div>
              <div className="flex justify-between"><span className="text-[#8b7a65]">Час</span><span className="font-medium">{selectedTime}</span></div>
            </div>

            {/* Form — with labels + autocomplete + 44px height */}
            <div className="space-y-3 mb-4">
              <div>
                <label htmlFor="client-name" className="block text-sm font-medium text-[#4a3728] mb-1">
                  Ваше ім'я <span aria-hidden="true" className="text-red-500">*</span>
                  <span className="sr-only">(обов'язкове поле)</span>
                </label>
                <input
                  id="client-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                  required
                  aria-required="true"
                  placeholder="Іван Іваненко"
                  className="w-full border border-[#c8bfb0] rounded-lg px-3 py-3 text-sm text-[#1a1208] outline-none focus:border-[#C9A84C] bg-white placeholder-[#9e8e80] min-h-[44px]"
                />
              </div>
              <div>
                <label htmlFor="client-phone" className="block text-sm font-medium text-[#4a3728] mb-1">
                  Телефон <span aria-hidden="true" className="text-red-500">*</span>
                  <span className="sr-only">(обов'язкове поле)</span>
                </label>
                <input
                  id="client-phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                  required
                  aria-required="true"
                  placeholder="+1 (555) 000-0000"
                  className="w-full border border-[#c8bfb0] rounded-lg px-3 py-3 text-sm text-[#1a1208] outline-none focus:border-[#C9A84C] bg-white placeholder-[#9e8e80] min-h-[44px]"
                />
              </div>
              <div>
                <label htmlFor="client-email" className="block text-sm font-medium text-[#4a3728] mb-1">
                  Email <span className="text-[#9e8e80] font-normal text-xs">(необов'язково — для підтвердження)</span>
                </label>
                <input
                  id="client-email"
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="your@email.com"
                  className="w-full border border-[#c8bfb0] rounded-lg px-3 py-3 text-sm text-[#1a1208] outline-none focus:border-[#C9A84C] bg-white placeholder-[#9e8e80] min-h-[44px]"
                />
              </div>
              <label className="flex items-start gap-3 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={smsConsent}
                  onChange={e => setSmsConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#C9A84C]"
                  aria-describedby="sms-consent-desc"
                />
                <span id="sms-consent-desc" className="text-xs text-[#8b7a65] leading-relaxed">
                  Я погоджуюсь отримувати SMS-нагадування про запис. Відповідайте STOP для відмови.
                </span>
              </label>
            </div>

            {/* aria-live error */}
            <div role="alert" aria-live="assertive" aria-atomic="true">
              {error && <div className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="text-sm text-[#8b7a65] hover:text-[#1a1208] px-2 py-3 min-h-[44px]">← Назад</button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="ml-auto bg-[#C9A84C] text-black font-bold px-6 py-3 rounded-lg hover:bg-[#e8d08a] transition min-h-[44px] disabled:opacity-50">
                {loading ? 'Надсилання...' : 'Підтвердити запис →'}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
