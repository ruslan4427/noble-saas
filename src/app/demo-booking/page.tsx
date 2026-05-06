'use client'
import { useState } from 'react'
import Link from 'next/link'

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export default function DemoBookingPage() {
  const [phone,    setPhone]   = useState('')
  const [consent,  setConsent] = useState(false)
  const [phoneErr, setPhoneErr] = useState('')
  const [done,     setDone]    = useState(false)
  const [loading,  setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Only phone is required — SMS consent is strictly optional
    if (phone.replace(/\D/g, '').length < 10) {
      setPhoneErr('Enter a valid 10-digit US phone number.')
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    setDone(true)
  }

  if (done) return (
    <Page>
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8dfc9', padding: '40px 32px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(201,168,76,0.12)', border: '2px solid #C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26 }}>✓</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1208', marginBottom: 10 }}>Booking Confirmed!</h2>
        <p style={{ fontSize: 14, color: '#6b5744', lineHeight: 1.7, marginBottom: 8 }}>
          Your appointment has been booked for <strong>{phone}</strong>.
        </p>
        {consent ? (
          <p style={{ fontSize: 13, color: '#6b5744', lineHeight: 1.65, marginBottom: 24 }}>
            SMS reminders will be sent to your number.<br />
            Reply <strong>STOP</strong> at any time to unsubscribe.
          </p>
        ) : (
          <p style={{ fontSize: 13, color: '#9c8b7a', lineHeight: 1.65, marginBottom: 24 }}>
            You have not opted in to SMS reminders.
          </p>
        )}
        <button
          onClick={() => { setDone(false); setPhone(''); setConsent(false) }}
          style={{ background: '#C9A84C', color: '#000', fontWeight: 700, fontSize: 14, padding: '13px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', minHeight: 44 }}>
          Book Another
        </button>
      </div>
    </Page>
  )

  return (
    <Page>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1208', marginBottom: 6 }}>Book an Appointment</h1>
          <p style={{ fontSize: 14, color: '#6b5744' }}>Noble Barbershop · Demo</p>
        </div>

        <form onSubmit={handleSubmit} noValidate
          style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8dfc9', padding: '32px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Phone number (required) ── */}
          <div>
            <label style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1208', display: 'block', marginBottom: 6 }}>
              Mobile Phone Number <span style={{ color: '#C9A84C' }}>*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(formatPhone(e.target.value)); setPhoneErr('') }}
              placeholder="(555) 123-4567"
              inputMode="numeric"
              autoComplete="tel"
              style={{
                width: '100%', padding: '13px 14px', fontSize: 15, borderRadius: 12,
                border: `1.5px solid ${phoneErr ? '#dc2626' : '#e8dfc9'}`,
                background: '#fdfaf5', color: '#1a1208', outline: 'none',
                boxSizing: 'border-box', minHeight: 48,
              }}
            />
            {phoneErr && (
              <p style={{ fontSize: 12.5, color: '#dc2626', marginTop: 5 }}>{phoneErr}</p>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e8dfc9', margin: 0 }} />

          {/* ── SMS Consent (optional) ── */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1208', marginBottom: 10 }}>
              SMS Notifications{' '}
              <span style={{ fontWeight: 400, color: '#9c8b7a' }}>(Optional — not required to book)</span>
            </p>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                // NOT required — form submits regardless
                style={{ width: 18, height: 18, marginTop: 3, flexShrink: 0, accentColor: '#C9A84C', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, color: '#6b5744', lineHeight: 1.7 }}>
                I agree to receive SMS appointment reminders from Noble at the phone number provided.
                Message frequency varies. Msg &amp; Data rates may apply.
                Reply <strong>STOP</strong> to unsubscribe, <strong>HELP</strong> for help.{' '}
                <strong>Consent is not a condition of purchase.</strong>
              </span>
            </label>

            <p style={{ fontSize: 12, color: '#9c8b7a', marginTop: 10, paddingLeft: 30, lineHeight: 1.6 }}>
              Providing consent to receive SMS messages is not required to complete the booking.
            </p>
            <p style={{ fontSize: 12, color: '#9c8b7a', marginTop: 6, paddingLeft: 30 }}>
              Message frequency varies.
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e8dfc9', margin: 0 }} />

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: '#C9A84C', color: '#000', fontWeight: 700,
              fontSize: 16, padding: '15px', borderRadius: 14, border: 'none',
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: '0 6px 20px rgba(201,168,76,0.3)',
              opacity: loading ? 0.7 : 1, minHeight: 52,
            }}>
            {loading ? 'Booking…' : 'Book Appointment'}
          </button>

          <p style={{ fontSize: 12, color: '#9c8b7a', textAlign: 'center', margin: 0 }}>
            If you opt in, you will receive SMS confirmation after booking.
          </p>

          {/* ── Legal links (visible below submit) ── */}
          <p style={{ fontSize: 12, color: '#9c8b7a', textAlign: 'center', margin: 0, lineHeight: 1.8 }}>
            By booking, you agree to our{' '}
            <Link href="/legal/terms" target="_blank" style={{ color: '#C9A84C', textDecoration: 'underline' }}>
              Terms and Conditions
            </Link>
            {' '}and{' '}
            <Link href="/legal/privacy" target="_blank" style={{ color: '#C9A84C', textDecoration: 'underline' }}>
              Privacy Policy
            </Link>.
          </p>

        </form>
      </div>
    </Page>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#1a1208', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#C9A84C' }}>✂ Noble</span>
        </Link>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Demo Booking</span>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        {children}
      </main>

      <footer style={{ background: '#1a1208', padding: '20px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 10, flexWrap: 'wrap' }}>
          <Link href="/legal/privacy" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>Privacy Policy</Link>
          <Link href="/legal/terms"   style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>Terms and Conditions</Link>
          <Link href="/sms-consent"   style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>SMS Consent</Link>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0, lineHeight: 1.7 }}>
          © {new Date().getFullYear()} Noble. SMS consent is optional and not required for booking.<br />
          Reply STOP to any SMS to unsubscribe.
        </p>
      </footer>
    </div>
  )
}
