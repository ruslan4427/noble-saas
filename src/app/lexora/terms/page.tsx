import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Lexora',
  description: 'Terms of Service for Lexora — audio-based vocabulary learning app.',
}

const UPDATED = 'September 16, 2026'
const APP = 'Lexora'
const CONTACT = 'support@noblelink.app'

export default function LexoraTerms() {
  return (
    <main className="min-h-screen bg-[#0B1220] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/lexora" className="font-bold text-xl text-[#006FFD]">Lexora</Link>
        <Link href="/lexora" className="text-sm text-white/50 hover:text-white transition">← Back</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-white/40 text-sm">Last updated: {UPDATED}</p>
        </div>

        <Section title="1. Acceptance of Terms">
          <p>
            By creating an account or using the {APP} mobile app, you agree to these Terms of
            Service. If you do not agree, do not use the app.
          </p>
        </Section>

        <Section title="2. The Service">
          <p>
            {APP} lets you create playlists of word pairs (Column A + Column B), generates audio
            from the text using Google Cloud Text-to-Speech, and plays it back as an audio
            playlist. The service is provided as-is, primarily for personal language learning.
          </p>
        </Section>

        <Section title="3. Your Account">
          <ul>
            <li>You must be at least 13 years old to create an account.</li>
            <li>
              You are responsible for the security of your credentials and for all activity on
              your account.
            </li>
            <li>
              You may create an account using email, Google Sign-In, or Apple Sign In. Do not
              share your account with others.
            </li>
          </ul>
        </Section>

        <Section title="4. Your Content">
          <p>
            You keep ownership of the text (word pairs) and profile images you add to {APP}. By
            using the app you grant us a limited license to store, process, transmit, and generate
            audio from that text solely to operate the service for you.
          </p>
          <p>You are responsible for the content you enter. You agree NOT to submit text that:</p>
          <ul>
            <li>Infringes third-party intellectual property.</li>
            <li>Is illegal, harassing, hateful, or explicit.</li>
            <li>Contains personal data of others without their consent.</li>
            <li>Attempts to abuse the text-to-speech service or spam its output.</li>
          </ul>
          <p>We may remove content that violates these terms without notice.</p>
        </Section>

        <Section title="5. Acceptable Use">
          <ul>
            <li>Do not attempt to reverse-engineer, scrape, or circumvent access controls.</li>
            <li>Do not use the app for any commercial resale of the generated audio.</li>
            <li>Do not overload the service with automated requests.</li>
            <li>Do not use the app to violate any law or third-party rights.</li>
          </ul>
        </Section>

        <Section title="6. Third-Party Services">
          <p>
            The app relies on Supabase (authentication + storage) and Google Cloud Text-to-Speech
            (audio generation). Their terms and privacy policies also apply to your use of {APP}.
          </p>
        </Section>

        <Section title="7. Account Deletion">
          <p>
            You can delete your account at any time from Profile → Delete Account. Deletion is
            permanent and removes your playlists, word pairs, generated audio, and profile
            information from our systems, usually within 24 hours.
          </p>
        </Section>

        <Section title="8. Availability & Changes">
          <p>
            We may modify, suspend, or discontinue features at any time. We aim to keep the
            service running but make no uptime guarantees. Material changes to these Terms will be
            highlighted in the app or by email.
          </p>
        </Section>

        <Section title="9. Disclaimer of Warranties">
          <p>
            {APP} IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF
            ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING (WITHOUT LIMITATION) WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, {APP} AND ITS OPERATORS WILL NOT BE LIABLE FOR
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA,
            REVENUE, OR PROFITS, ARISING OUT OF YOUR USE OF THE APP.
          </p>
        </Section>

        <Section title="11. Termination">
          <p>
            We may suspend or terminate your access to the app if you violate these Terms. You may
            terminate your use of the app at any time by deleting your account.
          </p>
        </Section>

        <Section title="12. Governing Law">
          <p>
            These Terms are governed by the laws of Ukraine, without regard to conflict-of-law
            rules. Nothing here limits any mandatory consumer-protection rights you have in your
            country of residence.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            Questions: <a className="text-[#006FFD]" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </p>
        </Section>

        <div className="pt-6 text-center text-white/30 text-xs">
          © {new Date().getFullYear()} {APP}
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-[#006FFD]">{title}</h2>
      <div className="text-white/80 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:underline">
        {children}
      </div>
    </section>
  )
}
