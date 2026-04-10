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
  const [smsConsent, setSmsConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const dates = getDates()
  const timeSlots = getTimeSlots()

  async function handleConfirm() {
    if (!selectedStaff || !selectedService || !selectedDate || !selectedTime || !name || !phone) {
      setError('Заповніть всі поля')
      return
    }
    setLoading(true)
    setError('')
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const { error: bookingError } = await supabase.from('bookings').insert({
        org_id: org.id,
        master_id: selectedStaff.id,
        date: dateStr,
        time_slot: selectedTime,
        client_name: name,
        client_phone: phone,
        service_name: selectedService.name,
        price_cents: selectedService.price_cents,
        status: 'confirmed',
      })
      if (bookingError) throw bookingError

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
      <main className="min-h-screen bg-[#f5f0e8] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2 text-[#1a1208]">Запис підтверджено!</h2>
          <p className="text-[#8b7a65] text-sm mb-1">{selectedStaff?.name}</p>
          <p className="text-[#8b7a65] text-sm mb-1">{selectedService?.name} · ${((selectedService?.price_cents || 0) / 100).toFixed(0)}</p>
          <p className="text-[#8b7a65] text-sm mb-4">
            {selectedDate?.toLocaleDateString('uk-UA')} о {selectedTime}
          </p>
          <button onClick={() => { setDone(false); setStep(0); setSelectedStaff(null); setSelectedService(null); setSelectedDate(null); setSelectedTime(null); setName(''); setPhone(''); }}
            className="bg-[#C9A84C] text-black font-bold px-6 py-2 rounded-lg hover:bg-[#e8d08a] transition text-sm">
            Новий запис
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8]">
      {/* Header */}
      <div className="bg-[#1a1208] text-white px-6 py-8 text-center">
        <h1 className="font-serif text-3xl font-bold mb-1">{org.name}</h1>
        {org.address && <p className="text-white/60 text-sm">{org.address}</p>}
        {org.phone && <p className="text-white/60 text-sm">{org.phone}</p>}
      </div>

      {/* Stepper */}
      <div className="flex justify-center gap-2 px-6 py-4 bg-white border-b border-[#e8dfc9]">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${i <= step ? 'bg-[#C9A84C] text-black' : 'bg-[#e8dfc9] text-[#8b7a65]'}`}>
              {i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i <= step ? 'text-[#1a1208] font-medium' : 'text-[#8b7a65]'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-[#e8dfc9]" />}
          </div>
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Step 0 — Staff */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold text-[#1a1208] mb-4">Оберіть майстра</h2>
            {staff.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-[#8b7a65]">Майстрів ще немає</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {staff.map(m => (
                  <button key={m.id} onClick={() => { setSelectedStaff(m); setStep(1) }}
                    className={`bg-white rounded-xl p-4 text-left border-2 transition hover:border-[#C9A84C] ${selectedStaff?.id === m.id ? 'border-[#C9A84C]' : 'border-transparent'}`}>
                    <div className="w-12 h-12 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-xl mb-2">✂</div>
                    <div className="font-semibold text-[#1a1208] text-sm">{m.name}</div>
                    <div className="text-[#8b7a65] text-xs capitalize">{m.role}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 1 — Service */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-[#1a1208] mb-4">Оберіть послугу</h2>
            {services.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-[#8b7a65]">Послуг ще немає</div>
            ) : (
              <div className="space-y-2">
                {services.map(s => (
                  <button key={s.id} onClick={() => { setSelectedService(s); setStep(2) }}
                    className={`w-full bg-white rounded-xl p-4 flex items-center justify-between border-2 transition hover:border-[#C9A84C] ${selectedService?.id === s.id ? 'border-[#C9A84C]' : 'border-transparent'}`}>
                    <div className="text-left">
                      <div className="font-semibold text-[#1a1208]">{s.name}</div>
                      <div className="text-[#8b7a65] text-sm">{s.duration_min} хв</div>
                    </div>
                    <div className="font-bold text-[#C9A84C]">${(s.price_cents / 100).toFixed(0)}</div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setStep(0)} className="mt-4 text-sm text-[#8b7a65] hover:text-[#1a1208]">← Назад</button>
          </div>
        )}

        {/* Step 2 — Time */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-[#1a1208] mb-4">Оберіть час</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {dates.map(d => (
                <button key={d.toISOString()} onClick={() => setSelectedDate(d)}
                  className={`flex-none flex flex-col items-center px-3 py-2 rounded-xl border-2 transition ${selectedDate?.toDateString() === d.toDateString() ? 'border-[#C9A84C] bg-[#C9A84C]/10' : 'border-[#e8dfc9] bg-white'}`}>
                  <span className="text-xs text-[#8b7a65]">{d.toLocaleDateString('uk-UA', { weekday: 'short' })}</span>
                  <span className="font-bold text-[#1a1208]">{d.getDate()}</span>
                </button>
              ))}
            </div>
            {selectedDate && (
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(t => (
                  <button key={t} onClick={() => setSelectedTime(t)}
                    className={`py-2 rounded-lg text-sm font-medium border transition ${selectedTime === t ? 'border-[#C9A84C] bg-[#C9A84C] text-black' : 'border-[#e8dfc9] bg-white text-[#1a1208] hover:border-[#C9A84C]'}`}>
                    {t}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep(1)} className="text-sm text-[#8b7a65] hover:text-[#1a1208]">← Назад</button>
              {selectedDate && selectedTime && (
                <button onClick={() => setStep(3)} className="ml-auto bg-[#C9A84C] text-black font-bold px-6 py-2 rounded-lg hover:bg-[#e8d08a] transition text-sm">
                  Далі →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — Confirm */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-[#1a1208] mb-4">Підтвердження</h2>
            <div className="bg-white rounded-xl p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#8b7a65]">Майстер</span><span className="font-medium">{selectedStaff?.name}</span></div>
              <div className="flex justify-between"><span className="text-[#8b7a65]">Послуга</span><span className="font-medium">{selectedService?.name}</span></div>
              <div className="flex justify-between"><span className="text-[#8b7a65]">Вартість</span><span className="font-bold text-[#C9A84C]">${((selectedService?.price_cents || 0) / 100).toFixed(0)}</span></div>
              <div className="flex justify-between"><span className="text-[#8b7a65]">Дата</span><span className="font-medium">{selectedDate?.toLocaleDateString('uk-UA')}</span></div>
              <div className="flex justify-between"><span className="text-[#8b7a65]">Час</span><span className="font-medium">{selectedTime}</span></div>
            </div>
            <div className="space-y-3 mb-4">
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-[#e8dfc9] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
                placeholder="Ваше ім'я" />
              <input value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full border border-[#e8dfc9] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
                placeholder="+1 (XXX) XXX-XXXX" type="tel" />
              <label className="flex items-start gap-2 text-xs text-[#8b7a65] cursor-pointer">
                <input type="checkbox" checked={smsConsent} onChange={e => setSmsConsent(e.target.checked)} className="mt-0.5" />
                <span>Я погоджуюсь отримувати SMS-нагадування про запис. Відповідайте STOP для відмови.</span>
              </label>
            </div>
            {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="text-sm text-[#8b7a65] hover:text-[#1a1208]">← Назад</button>
              <button onClick={handleConfirm} disabled={loading}
                className="ml-auto bg-[#C9A84C] text-black font-bold px-6 py-2 rounded-lg hover:bg-[#e8d08a] transition text-sm disabled:opacity-50">
                {loading ? 'Надсилання...' : 'Підтвердити запис →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
