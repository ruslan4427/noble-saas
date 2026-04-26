import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms and Conditions — Noble',
  description: 'Terms and Conditions for Noble booking platform.',
}

const UPDATED = 'April 25, 2025'
const COMPANY = 'Noble'
const SITE = 'noblelink.app'
const EMAIL = 'support@noblelink.app'

export default function TermsAndConditions() {
  return (
    <main className="min-h-screen bg-[#0F0A00] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="font-serif text-xl text-[#C9A84C]">✂ Noble</Link>
        <Link href="/legal" className="text-sm text-white/50 hover:text-white transition">← Legal</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">Terms and Conditions</h1>
          <p className="text-white/40 text-sm">Last updated: {UPDATED}</p>
        </div>

        <Section title="1. Acceptance of Terms">
          <p>By accessing or using {COMPANY} ("the Platform") at {SITE}, you agree to be bound by these Terms and Conditions. If you do not agree, do not use the Platform.</p>
          <p>These Terms apply to both salon owners ("Users") and their end clients ("Clients") who interact with booking pages hosted on the Platform.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>{COMPANY} is a SaaS booking platform that allows salon and barbershop owners to:</p>
          <ul>
            <li>Create a public-facing online booking page.</li>
            <li>Manage staff schedules, services, and appointments.</li>
            <li>Send automated email and SMS appointment reminders to clients.</li>
            <li>Accept and track bookings in real time.</li>
          </ul>
          <p>The Platform is offered on a subscription basis with plans as described on the pricing page.</p>
        </Section>

        <Section title="3. Account Registration">
          <ul>
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li>You must be at least 18 years old to create an account.</li>
            <li>One account per business. You may not share accounts.</li>
          </ul>
        </Section>

        <Section title="4. Subscriptions and Billing">
          <ul>
            <li>Subscriptions are billed monthly in advance via Stripe.</li>
            <li>New accounts receive a free trial period as stated at signup.</li>
            <li>After the trial, a paid subscription is required to continue using the Platform.</li>
            <li>You may cancel at any time. Cancellation takes effect at the end of the current billing period — no partial refunds.</li>
            <li>We reserve the right to change pricing with 30 days' notice.</li>
          </ul>
        </Section>

        <Section title="5. SMS Messaging Terms">
          <p>The Platform sends SMS appointment reminders on behalf of salon owners. The following terms apply to all SMS communications:</p>
          <ul>
            <li><strong>Opt-in:</strong> SMS messages are sent only to clients who have explicitly opted in during the booking process by checking the SMS consent checkbox.</li>
            <li><strong>Message frequency:</strong> Typically 1 message per booking (a reminder sent approximately 2 hours before the appointment).</li>
            <li><strong>Message and data rates may apply</strong> depending on the client's mobile carrier and plan.</li>
            <li><strong>Opt-out:</strong> Clients may opt out at any time by replying <strong>STOP</strong> to any SMS message. After opting out, no further SMS messages will be sent.</li>
            <li><strong>Help:</strong> Clients may reply <strong>HELP</strong> for assistance, or contact {EMAIL}.</li>
            <li><strong>No marketing SMS:</strong> We do not send promotional or marketing SMS messages. All SMS messages are strictly transactional appointment reminders.</li>
            <li><strong>No third-party sharing:</strong> Phone numbers collected for SMS reminders are never sold or shared with third parties for marketing purposes.</li>
            <li>SMS delivery is provided by Twilio. Carriers are not liable for delayed or undelivered messages.</li>
          </ul>
        </Section>

        <Section title="6. Acceptable Use">
          <p>You agree not to:</p>
          <ul>
            <li>Use the Platform for any unlawful purpose.</li>
            <li>Send unsolicited communications (spam) through the Platform.</li>
            <li>Attempt to gain unauthorized access to any part of the Platform.</li>
            <li>Reverse engineer, copy, or resell any part of the Platform.</li>
            <li>Upload false, misleading, or fraudulent business information.</li>
            <li>Use the SMS feature to send messages to clients who have not opted in.</li>
          </ul>
        </Section>

        <Section title="7. Client Data and Privacy">
          <p>Salon owners are responsible for ensuring that client data collected through the Platform is handled in accordance with applicable privacy laws (including GDPR, CCPA, and TCPA where applicable).</p>
          <p>By using the Platform, you agree to our <Link href="/legal/privacy" className="text-[#C9A84C] hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference.</p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>{COMPANY} owns all rights to the Platform, including its design, code, and branding. Your business data (salon name, services, bookings) remains yours.</p>
          <p>You grant {COMPANY} a limited license to use your data solely to operate and improve the Platform.</p>
        </Section>

        <Section title="9. Disclaimers">
          <p>The Platform is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free operation. We are not responsible for missed appointments, lost revenue, or client disputes arising from use of the Platform.</p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>To the maximum extent permitted by law, {COMPANY}'s total liability to you for any claim arising from use of the Platform shall not exceed the amount you paid us in the 3 months preceding the claim.</p>
          <p>We are not liable for indirect, incidental, special, or consequential damages.</p>
        </Section>

        <Section title="11. Termination">
          <p>We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or abuse the SMS messaging feature. You may cancel your account at any time from the billing settings.</p>
        </Section>

        <Section title="12. Changes to Terms">
          <p>We may update these Terms from time to time. We will notify account holders by email at least 14 days before material changes take effect. Continued use after the effective date constitutes acceptance.</p>
        </Section>

        <Section title="13. Governing Law">
          <p>These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.</p>
        </Section>

        <Section title="14. Contact">
          <p>Questions about these Terms:</p>
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
