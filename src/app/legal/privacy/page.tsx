import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Noble',
  description: 'Privacy Policy for Noble booking platform.',
}

const UPDATED = 'April 25, 2025'
const COMPANY = 'Noble'
const SITE = 'noblelink.app'
const EMAIL = 'support@noblelink.app'

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#0F0A00] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="font-serif text-xl text-[#C9A84C]">✂ Noble</Link>
        <Link href="/legal" className="text-sm text-white/50 hover:text-white transition">← Legal</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">Privacy Policy</h1>
          <p className="text-white/40 text-sm">Last updated: {UPDATED}</p>
        </div>

        <Section title="1. Who We Are">
          <p>{COMPANY} ("we", "us", "our") operates the booking platform at {SITE}. This Privacy Policy explains how we collect, use, and protect information about salon owners and their clients.</p>
        </Section>

        <Section title="2. Information We Collect">
          <p>We collect the following categories of information:</p>
          <ul>
            <li><strong>Account information:</strong> name, email address, and password when you create an account.</li>
            <li><strong>Business information:</strong> salon name, address, phone number, and social media links.</li>
            <li><strong>Client booking data:</strong> client name, phone number, email address, appointment date and time, and service selected — provided by clients at the time of booking.</li>
            <li><strong>Payment information:</strong> billing details processed securely by Stripe. We do not store card numbers.</li>
            <li><strong>Usage data:</strong> pages visited, features used, and device/browser information.</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <ul>
            <li>To operate and provide the booking platform.</li>
            <li>To send appointment confirmation emails to clients.</li>
            <li>To send SMS appointment reminders — only when the client has explicitly opted in (see Section 6).</li>
            <li>To process subscription payments via Stripe.</li>
            <li>To send service announcements and account-related notifications.</li>
            <li>To improve platform performance and fix issues.</li>
          </ul>
        </Section>

        <Section title="4. SMS Communications">
          <p>We send SMS messages only to clients who have explicitly opted in by entering their mobile phone number during the booking process and agreeing to receive SMS appointment reminders via a required consent checkbox. Consent is tied to the specific phone number provided at the time of booking.</p>

          <p>Message frequency varies depending on booking activity. Typically, clients receive 1 SMS message per booking (for example, a reminder sent approximately 2 hours before the appointment). Additional messages may be sent for booking updates or changes.</p>

          <p><strong>Message and data rates may apply.</strong> Msg &amp; Data rates may apply. Carriers are not liable for delayed or undelivered messages.</p>

          <p>To opt out, reply <strong>STOP</strong> to any SMS message. After opting out, no further messages will be sent unless the user opts in again.</p>

          <p>For help, reply <strong>HELP</strong> or contact <a href={`mailto:${EMAIL}`} className="text-[#C9A84C] hover:underline">{EMAIL}</a>.</p>

          <p>We do not sell, rent, or share phone numbers or SMS consent data with third parties for marketing or promotional purposes.</p>

          <p>SMS communications are strictly transactional and related to appointment scheduling. We do not send marketing or promotional messages.</p>
        </Section>

        <Section title="5. Sharing of Information">
          <p>We do not sell your personal information. We share data only with:</p>
          <ul>
            <li><strong>Stripe</strong> — payment processing.</li>
            <li><strong>Twilio</strong> — SMS delivery.</li>
            <li><strong>Resend</strong> — transactional email delivery.</li>
            <li><strong>Supabase</strong> — secure database hosting.</li>
            <li><strong>Sentry</strong> — error monitoring (no personal data logged).</li>
            <li><strong>Vercel</strong> — application hosting.</li>
          </ul>
          <p className="mt-2">All service providers are bound by data processing agreements and applicable privacy laws.</p>
        </Section>

        <Section title="6. Data Retention">
          <p>We retain booking records for up to 3 years for business reporting purposes. Account data is retained while your account is active. You may request deletion at any time by contacting {EMAIL}.</p>
        </Section>

        <Section title="7. Your Rights">
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you.</li>
            <li>Request correction or deletion of your data.</li>
            <li>Opt out of SMS communications at any time by replying STOP.</li>
            <li>Lodge a complaint with your local data protection authority.</li>
          </ul>
          <p className="mt-2">To exercise these rights, contact {EMAIL}.</p>
        </Section>

        <Section title="8. Security">
          <p>We use industry-standard security measures including encrypted connections (HTTPS), row-level security in our database, and restricted access to production systems. No method of transmission over the internet is 100% secure.</p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>Our platform is not directed to children under 13. We do not knowingly collect personal information from children.</p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. We will notify account holders by email of material changes. Continued use of the platform after changes constitutes acceptance.</p>
        </Section>

        <Section title="11. Contact Us">
          <p>For privacy-related questions or requests:</p>
          <p className="mt-2">
            <strong>{COMPANY}</strong><br />
            Email: <a href={`mailto:${EMAIL}`} className="text-[#C9A84C] hover:underline">{EMAIL}</a><br />
            Website: <a href={`https://${SITE}`} className="text-[#C9A84C] hover:underline">{SITE}</a>
          </p>
        </Section>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-[#C9A84C]">{title}</h2>
      <div className="text-white/70 text-sm leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-white">
        {children}
      </div>
    </section>
  )
}
