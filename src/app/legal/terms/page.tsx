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
          <p>
            <strong>Program name: Noble Appointment Reminder Program.</strong> {COMPANY} sends transactional SMS appointment reminders on behalf of salon and barbershop owners who use the Platform. The following terms govern all SMS communications sent through this program.
          </p>

          <p><strong>5.1 How to Opt In</strong></p>
          <p>
            SMS reminders are sent exclusively to clients who provide explicit written consent. Consent is obtained as follows:
          </p>
          <ul>
            <li>During the online booking process, a client enters their mobile phone number in the designated phone number field.</li>
            <li>A required checkbox is displayed with the following or substantially similar language: <em>"By checking this box, I agree to receive SMS appointment reminders from [Salon Name] via Noble at the mobile number I provided. Consent is not a condition of purchase."</em></li>
            <li>The checkbox must be actively checked by the client — it is not pre-checked.</li>
            <li>Consent is tied to the specific mobile number entered and is recorded at the time of booking.</li>
            <li>Clients who do not check the consent checkbox will not receive SMS messages.</li>
            <li>Providing consent to receive SMS messages is not a condition of purchase.</li>
          </ul>

          <p><strong>5.2 Message Frequency</strong></p>
          <p>
            Message frequency varies. Clients typically receive 1 SMS message per booking (a reminder sent approximately 2 hours before the appointment start time). Additional messages may be sent in connection with reschedules or booking updates. No promotional or marketing messages are ever sent.
          </p>

          <p><strong>5.3 Message and Data Rates</strong></p>
          <p>
            <strong>Message and data rates may apply.</strong> Msg &amp; Data rates may apply. Charges depend on the client's mobile carrier and plan. {COMPANY} does not charge separately for SMS messages.
          </p>

          <p><strong>5.4 How to Opt Out (STOP)</strong></p>
          <p>
            Clients may opt out of SMS messages at any time by replying <strong>STOP</strong> to any message received from the program. Upon receipt of a STOP message, no further SMS messages will be sent to that number. Opt-out requests are processed immediately and are permanent unless the client re-opts in during a future booking.
          </p>

          <p><strong>5.5 Help and Support (HELP)</strong></p>
          <p>
            Clients may reply <strong>HELP</strong> to any SMS message to receive support information. Alternatively, clients may contact us directly at <a href={`mailto:${EMAIL}`} className="text-[#C9A84C] hover:underline">{EMAIL}</a>. We respond to support inquiries within 2 business days.
          </p>

          <p><strong>5.6 Transactional Nature — No Marketing SMS</strong></p>
          <p>
            All SMS messages sent through the Noble Appointment Reminder Program are strictly transactional in nature. We do not send promotional, marketing, or advertising SMS messages. Messages are limited to appointment reminders and booking-related notifications directly requested by the client's booking action.
          </p>

          <p><strong>5.7 No Third-Party Sharing</strong></p>
          <p>
            Mobile phone numbers collected for the purpose of SMS appointment reminders are never sold, rented, or shared with third parties for marketing or promotional purposes. Numbers are used solely to deliver the appointment reminders the client consented to receive.
          </p>

          <p><strong>5.8 Carrier Disclaimer</strong></p>
          <p>
            SMS delivery is facilitated by Twilio, Inc. as the messaging service provider. <strong>Carriers are not liable for delayed or undelivered messages.</strong> Delivery is subject to the client's network coverage, carrier policies, and device availability.
          </p>
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
