import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Lexora',
  description: 'Privacy Policy for Lexora — audio-based vocabulary learning app.',
}

const UPDATED = 'September 16, 2026'
const APP = 'Lexora'
const CONTACT = 'support@noblelink.app'

export default function LexoraPrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#0B1220] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/lexora" className="font-bold text-xl text-[#006FFD]">Lexora</Link>
        <Link href="/lexora" className="text-sm text-white/50 hover:text-white transition">← Back</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-white/40 text-sm">Last updated: {UPDATED}</p>
        </div>

        <Section title="1. Who We Are">
          <p>
            {APP} is a mobile application that lets you create playlists of word pairs and listen to
            them via text-to-speech audio. This Privacy Policy explains what data we collect, how we
            use it, and your rights.
          </p>
          <p>Contact: <a className="text-[#006FFD]" href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
        </Section>

        <Section title="2. Data We Collect">
          <ul>
            <li>
              <strong>Account data:</strong> email address, display name, and an optional profile
              picture. Created when you sign up with email, Google, or Apple.
            </li>
            <li>
              <strong>Content you create:</strong> playlists, word pairs (Column A + Column B),
              playback settings, and language preferences you configure.
            </li>
            <li>
              <strong>Generated audio:</strong> audio files produced by Google Cloud Text-to-Speech
              from the text you enter. Stored so we do not re-generate identical audio on repeat
              playback.
            </li>
            <li>
              <strong>Usage data:</strong> minimal diagnostic information (app version, crash
              reports) needed to keep the app working.
            </li>
          </ul>
          <p>We do NOT collect: location, contacts, microphone recordings, or advertising IDs.</p>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul>
            <li>To create and maintain your account and let you sign in across devices.</li>
            <li>To store the playlists and word pairs you create so they are available on your account.</li>
            <li>To generate spoken audio for the words you add, using Google Cloud Text-to-Speech.</li>
            <li>To provide the audio playback and playlist features of the app.</li>
            <li>To fix bugs and improve stability.</li>
          </ul>
          <p>
            We do NOT sell your data, use it for advertising, or share it for marketing purposes.
          </p>
        </Section>

        <Section title="4. Third-Party Services">
          <p>{APP} relies on the following processors to operate:</p>
          <ul>
            <li>
              <strong>Supabase</strong> — hosts authentication, database (your playlists and word
              pairs), and file storage (generated audio + optional profile picture). See{' '}
              <a className="text-[#006FFD]" href="https://supabase.com/privacy">Supabase Privacy Policy</a>.
            </li>
            <li>
              <strong>Google Cloud Text-to-Speech</strong> — converts your text into spoken audio.
              The text you enter is sent to Google for synthesis. See{' '}
              <a className="text-[#006FFD]" href="https://cloud.google.com/terms/cloud-privacy-notice">
                Google Cloud Privacy Notice
              </a>.
            </li>
            <li>
              <strong>Google Sign-In / Apple Sign In</strong> — optional sign-in methods. When you
              choose them, the provider tells us your email + name so we can create your account.
            </li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p>
            We keep your account data and content for as long as your account is active. When you
            delete your account (Profile → Delete Account) we permanently delete: your profile,
            your playlists, your word pairs, and all audio generated for your content, usually
            within 24 hours.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <ul>
            <li>
              <strong>Access &amp; portability:</strong> email {CONTACT} to request an export.
            </li>
            <li>
              <strong>Correction:</strong> edit your profile and content directly in the app.
            </li>
            <li>
              <strong>Deletion:</strong> delete your account in-app (Profile → Delete Account), or
              email {CONTACT}.
            </li>
            <li>
              <strong>Objection / withdrawal of consent:</strong> stop using the app and delete
              your account.
            </li>
          </ul>
          <p>
            EU / EEA / UK residents have additional rights under GDPR / UK GDPR. Contact us at{' '}
            {CONTACT} to exercise them.
          </p>
        </Section>

        <Section title="7. Data Security">
          <p>
            Data is transmitted over TLS. Authentication tokens are managed by Supabase. Passwords
            are never stored in plain text. Audio files are stored in Supabase Storage with access
            restricted to your account.
          </p>
        </Section>

        <Section title="8. Children">
          <p>
            {APP} is not directed at children under 13. If you believe a child has provided us
            personal data, contact {CONTACT} and we will delete it.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this policy. Material changes will be highlighted in the app or by email.
            The date at the top of this page shows the last update.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Questions or requests: <a className="text-[#006FFD]" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
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
