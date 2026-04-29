'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'

const SERVICES = ['Skin Fade — $45', 'Beard Sculpting — $30', 'Classic Cut — $35', 'Hot Towel Shave — $40']

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export default function DemoBookingPage() {
  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [service, setService] = useState('')
  const [date,    setDate]    = useState('')
  const [consent, setConsent] = useState(false)
  const [errors,  setErrors]  = useState<Record<string, string>>({})
  const [done,    setDone]    = useState(false)
  const [loading, setLoading] = useState(false)
  const checkRef = useRef<HTMLInputElement>(null)

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim())                 e.name    = 'Name is required.'
    if (phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid 10-digit US phone number.'
    if (!service)                     e.service = 'Please select a service.'
    if (!date)                        e.date    = 'Please choose a date.'
    if (!consent)                     e.consent = 'You must agree to receive SMS reminders to proceed.'
    return e
  }

  function handlePhone(v: string) {
    setPhone(formatPhone(v))
    if (errors.phone) setErrors(p => ({ ...p, phone: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      if (errs.consent) checkRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setLoading(true)
    // Simulate network delay
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f0e8', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8dfc9', padding: '40px 36px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(201,168,76,0.12)', border: '2px solid #C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1208', marginBottom: 8 }}>Booking Confirmed!</h2>
            <p style={{ fontSize: 14.5, color: '#6b5744', lineHeight: 1.7, marginBottom: 24 }}>
              Your appointment has been booked. An SMS confirmation will be sent to <strong>{phone}</strong>.<br /><br />
              Reply <strong>STOP</strong> at any time to unsubscribe from reminders.
            </p>
            <button onClick={() => { setDone(false); setName(''); setPhone(''); setService(''); setDate(''); setConsent(false) }} style={{ background: '#C9A84C', color: '#000', fontWeight: 700, fontSize: 14, padding: '11px 28px', borderRadius: 12, border: 'none', cursor: 'pointer' }}>
              Book Another
            </button>
          </div>
        </main>
        <PageFooter />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '36px 20px 60px' }}>
        <div style={{ width: '100%', maxWidth: 500 }}>

          {/* Intro */}
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1208', marginBottom: 8 }}>
              Book Your Appointment
            </h1>
            <p style={{ fontSize: 14.5, color: '#6b5744', lineHeight: 1.6 }}>
              Chop-Chop Barbershop · Demo Booking
            </p>
          </div>

          {/* Form card */}
          <form onSubmit={handleSubmit} noValidate style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8dfc9', padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Name */}
            <Field label="Full Name" required error={errors.name}>
              <input
                type="text" value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
                placeholder="John Doe" autoComplete="name"
                style={inputStyle(!!errors.name)}
              />
            </Field>

            {/* Phone */}
            <Field label="Phone Number" required error={errors.phone}>
              <input
                type="tel" value={phone} onChange={e => handlePhone(e.target.value)}
                placeholder="(555) 123-4567" autoComplete="tel" inputMode="numeric"
                style={inputStyle(!!errors.phone)}
              />
              <div style={{ fontSize: 12, color: '#9c8b7a', marginTop: 4 }}>US numbers only. Standard rates may apply.</div>
            </Field>

            {/* Service */}
            <Field label="Service" required error={errors.service}>
              <select
                value={service} onChange={e => { setService(e.target.value); setErrors(p => ({ ...p, service: '' })) }}
                style={{ ...inputStyle(!!errors.service), color: service ? '#1a1208' : '#9c8b7a' }}
              >
                <option value="" disabled>Select a service…</option>
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            {/* Date */}
            <Field label="Preferred Date" required error={errors.date}>
              <input
                type="date" value={date} onChange={e => { setDate(e.target.value); setErrors(p => ({ ...p, date: '' })) }}
                min={new Date().toISOString().split('T')[0]}
                style={inputStyle(!!errors.date)}
              />
            </Field>

            {/* Divider */}
            <hr style={{ border: 'none', borderTop: '1px solid #e8dfc9', margin: '4px 0' }} />

            {/* SMS Consent checkbox — CRITICAL */}
            <div ref={checkRef}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => { setConsent(e.target.checked); setErrors(p => ({ ...p, consent: '' })) }}
                  required
                  style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: '#C9A84C', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: '#6b5744', lineHeight: 1.6 }}>
                  I agree to receive SMS appointment reminders from Noble at the phone number provided.
                  Message frequency varies. Msg &amp; Data rates may apply.
                  Reply <strong>STOP</strong> to unsubscribe, <strong>HELP</strong> for help.
                </span>
              </label>
              {errors.consent && (
                <div style={{ fontSize: 12.5, color: '#dc2626', marginTop: 6, paddingLeft: 30 }}>
                  {errors.consent}
                </div>
              )}
            </div>

            {/* Legal links */}
            <div style={{ fontSize: 12.5, color: '#9c8b7a', textAlign: 'center', lineHeight: 1.7 }}>
              By booking, you agree to our{' '}
              <Link href="/legal/terms" target="_blank" style={{ color: '#C9A84C', textDecoration: 'underline' }}>Terms and Conditions</Link>
              {' '}and{' '}
              <Link href="/legal/privacy" target="_blank" style={{ color: '#C9A84C', textDecoration: 'underline' }}>Privacy Policy</Link>.
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{ width: '100%', background: loading ? '#d4b86a' : '#C9A84C', color: '#000', fontWeight: 700, fontSize: 16, padding: '15px', borderRadius: 14, border: 'none', cursor: loading ? 'wait' : 'pointer', boxShadow: '0 6px 20px rgba(201,168,76,0.35)', transition: 'background 0.2s ease', marginTop: 4 }}
            >
              {loading ? 'Booking…' : 'Book Appointment'}
            </button>

            <p style={{ fontSize: 12, color: '#9c8b7a', textAlign: 'center', margin: 0 }}>
              SMS confirmation will be sent after booking.
            </p>
          </form>
        </div>
      </main>

      <PageFooter />
    </div>
  )
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function Header() {
  return (
    <header style={{ background: '#1a1208', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#C9A84C' }}>✂ Noble</span>
      </Link>
      <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>Demo Booking</span>
    </header>
  )
}

function PageFooter() {
  return (
    <footer style={{ background: '#1a1208', padding: '20px 24px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 10, flexWrap: 'wrap' }}>
        <Link href="/legal/privacy" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>Privacy Policy</Link>
        <Link href="/legal/terms"   style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>Terms and Conditions</Link>
        <Link href="/sms-consent"   style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>SMS Consent</Link>
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
        © {new Date().getFullYear()} Noble. To opt out of SMS, reply STOP to any message.
      </p>
    </footer>
  )
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1208' }}>
        {label}{required && <span style={{ color: '#C9A84C', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <div style={{ fontSize: 12.5, color: '#dc2626' }}>{error}</div>}
    </div>
  )
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '12px 14px', fontSize: 14.5, borderRadius: 12,
    border: `1.5px solid ${hasError ? '#dc2626' : '#e8dfc9'}`,
    background: '#fdfaf5', color: '#1a1208',
    outline: 'none', transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  }
}
