import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SMS Consent & Opt-In Process — Noble',
  description: 'How Noble collects SMS opt-in consent for appointment reminders.',
}

export default function SmsConsentPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ background: '#1a1208', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#C9A84C' }}>✂ Noble</span>
        </Link>
      </header>

      <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: '48px 24px 72px', width: '100%' }}>

        <h1 style={{ fontSize: 30, fontWeight: 700, color: '#1a1208', marginBottom: 8 }}>
          SMS Consent &amp; Opt-In Process
        </h1>
        <p style={{ fontSize: 14.5, color: '#6b5744', marginBottom: 40, lineHeight: 1.7 }}>
          This page documents how Noble collects and manages user consent for SMS appointment reminders.
          It is provided for transparency and for carrier/compliance review.
        </p>

        {/* ── Section 1: How opt-in works ────────────────────────────── */}
        <Section title="1. How Users Opt In">
          <p>
            Users provide SMS consent through the online booking form available at:{' '}
            <Link href="/demo-booking" style={linkStyle}>https://www.noblelink.app/demo-booking</Link>
          </p>
          <p>
            To complete a booking, users must:
          </p>
          <ol style={olStyle}>
            <li>Enter their full name.</li>
            <li>Enter their <strong>mobile phone number</strong> (required field).</li>
            <li>Select a service and date.</li>
            <li>
              Actively <strong>check the SMS consent checkbox</strong> — it is{' '}
              <strong style={{ color: '#dc2626' }}>not pre-selected</strong>.
            </li>
            <li>Click <strong>&quot;Book Appointment&quot;</strong>.</li>
          </ol>
          <p>
            The form cannot be submitted without checking the consent checkbox. Submission is blocked and
            an error is shown if the user attempts to proceed without consent.
          </p>
        </Section>

        {/* ── Section 2: Consent language ─────────────────────────────── */}
        <Section title="2. Consent Checkbox Text">
          <p>The exact text shown next to the unchecked checkbox on the booking form:</p>
          <blockquote style={blockquoteStyle}>
            I agree to receive SMS appointment reminders from Noble at the phone number provided.
            Message frequency varies. Msg &amp; Data rates may apply. Reply <strong>STOP</strong> to
            unsubscribe, <strong>HELP</strong> for help.
          </blockquote>
        </Section>

        {/* ── Section 3: Visual of the form ───────────────────────────── */}
        <Section title="3. Booking Form — Consent Area">
          <p style={{ marginBottom: 20 }}>
            Below is a live render of the consent section as it appears to users on the booking form.
            The checkbox is unchecked by default and required for form submission.
          </p>

          {/* Live form mockup */}
          <div style={{ background: '#fff', border: '2px solid #C9A84C', borderRadius: 16, padding: '24px', maxWidth: 520, boxShadow: '0 4px 20px rgba(201,168,76,0.15)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              As shown on /demo-booking
            </div>

            {/* Mock phone field */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1208', marginBottom: 6 }}>
                Phone Number <span style={{ color: '#C9A84C' }}>*</span>
              </div>
              <div style={{ padding: '11px 14px', border: '1.5px solid #e8dfc9', borderRadius: 10, fontSize: 14, color: '#9c8b7a', background: '#fdfaf5' }}>
                (555) 123-4567
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e8dfc9', margin: '16px 0' }} />

            {/* Consent checkbox — NOT checked */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 18, height: 18, border: '2px solid #C9A84C', borderRadius: 3, marginTop: 2, flexShrink: 0, background: '#fff' }} />
              <span style={{ fontSize: 13, color: '#6b5744', lineHeight: 1.6 }}>
                I agree to receive SMS appointment reminders from Noble at the phone number provided.
                Message frequency varies. Msg &amp; Data rates may apply.
                Reply <strong>STOP</strong> to unsubscribe, <strong>HELP</strong> for help.
              </span>
            </div>

            {/* Legal links */}
            <div style={{ fontSize: 12.5, color: '#9c8b7a', textAlign: 'center', marginBottom: 16 }}>
              By booking, you agree to our{' '}
              <span style={{ color: '#C9A84C', textDecoration: 'underline' }}>Terms and Conditions</span>
              {' '}and{' '}
              <span style={{ color: '#C9A84C', textDecoration: 'underline' }}>Privacy Policy</span>.
            </div>

            {/* Submit button */}
            <div style={{ width: '100%', background: '#C9A84C', color: '#000', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 12, textAlign: 'center', boxShadow: '0 4px 16px rgba(201,168,76,0.35)' }}>
              Book Appointment
            </div>

            <div style={{ fontSize: 11.5, color: '#9c8b7a', textAlign: 'center', marginTop: 10 }}>
              SMS confirmation will be sent after booking.
            </div>
          </div>

          <p style={{ marginTop: 20, fontSize: 13.5, color: '#6b5744' }}>
            ↑ The checkbox is <strong>not pre-checked</strong>. The user must actively check it.
            Without checking, the &quot;Book Appointment&quot; button triggers a validation error.
          </p>
        </Section>

        {/* ── Section 4: What messages are sent ───────────────────────── */}
        <Section title="4. SMS Messages Sent">
          <p>After a user completes the booking form with consent, Noble sends:</p>
          <ul style={ulStyle}>
            <li><strong>Booking confirmation</strong> — immediately after successful booking.</li>
            <li><strong>Appointment reminder</strong> — approximately 2 hours before the scheduled time.</li>
          </ul>
          <p>
            All messages include opt-out instructions. Users can reply <strong>STOP</strong> at any time to
            unsubscribe and will receive a confirmation of opt-out. They can reply <strong>HELP</strong> for
            support contact information.
          </p>
          <p>Message frequency: typically 1–2 messages per booking.</p>
        </Section>

        {/* ── Section 5: Data handling ─────────────────────────────────── */}
        <Section title="5. Data Handling">
          <ul style={ulStyle}>
            <li>Phone numbers are stored in Noble&apos;s database (Supabase) and never sold to third parties.</li>
            <li>SMS messages are sent via Twilio on behalf of the salon.</li>
            <li>Consent is tied to the phone number submitted at the time of booking.</li>
            <li>Consent records are retained for compliance purposes.</li>
          </ul>
          <p>
            Full details in our{' '}
            <Link href="/legal/privacy" style={linkStyle}>Privacy Policy</Link>.
          </p>
        </Section>

        {/* ── Section 6: Opt-out ───────────────────────────────────────── */}
        <Section title="6. Opt-Out">
          <ul style={ulStyle}>
            <li>Reply <strong>STOP</strong> to any SMS — immediate opt-out confirmation sent.</li>
            <li>Reply <strong>HELP</strong> to receive support contact information.</li>
            <li>Opt-out applies to all future messages from that sender to that number.</li>
          </ul>
        </Section>

        {/* ── Section 7: Links ─────────────────────────────────────────── */}
        <Section title="7. Related Pages">
          <ul style={ulStyle}>
            <li><Link href="/demo-booking"   style={linkStyle}>Booking form (opt-in point)</Link></li>
            <li><Link href="/legal/privacy"  style={linkStyle}>Privacy Policy</Link></li>
            <li><Link href="/legal/terms"    style={linkStyle}>Terms and Conditions</Link></li>
          </ul>
        </Section>

      </main>

      {/* Footer */}
      <footer style={{ background: '#1a1208', padding: '20px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 10, flexWrap: 'wrap' }}>
          <Link href="/legal/privacy" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>Privacy Policy</Link>
          <Link href="/legal/terms"   style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>Terms and Conditions</Link>
          <Link href="/demo-booking"  style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>Demo Booking</Link>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
          © {new Date().getFullYear()} Noble. To opt out of SMS, reply STOP to any message.
        </p>
      </footer>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1208', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #e8dfc9' }}>{title}</h2>
      <div style={{ fontSize: 14.5, color: '#3d2b1a', lineHeight: 1.75, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </section>
  )
}

const linkStyle: React.CSSProperties  = { color: '#C9A84C', textDecoration: 'underline' }
const ulStyle:   React.CSSProperties  = { paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6, margin: 0 }
const olStyle:   React.CSSProperties  = { paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6, margin: 0 }
const blockquoteStyle: React.CSSProperties = {
  margin: '4px 0', padding: '14px 18px',
  borderLeft: '3px solid #C9A84C',
  background: 'rgba(201,168,76,0.06)',
  borderRadius: '0 10px 10px 0',
  fontSize: 14.5, color: '#3d2b1a', lineHeight: 1.7,
}
