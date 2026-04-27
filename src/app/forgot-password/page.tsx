'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import LangToggle, { type Lang } from '@/components/LangToggle'

const T = {
  en: {
    sub: 'Reset your password',
    hint: "Enter your email and we'll send you a reset link.",
    email: 'Email', send: 'Send reset link →', sending: 'Sending...',
    back: '← Back to sign in',
    doneTitle: 'Check your email',
    doneMsg: (email: string) => `If an account exists for ${email}, we sent a reset link. Check your inbox and spam folder.`,
  },
  es: {
    sub: 'Restablecer contraseña',
    hint: 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.',
    email: 'Correo', send: 'Enviar enlace →', sending: 'Enviando...',
    back: '← Volver al inicio de sesión',
    doneTitle: 'Revisa tu correo',
    doneMsg: (email: string) => `Si existe una cuenta para ${email}, enviamos un enlace de restablecimiento. Revisa tu bandeja y spam.`,
  },
}

export default function ForgotPassword() {
  const [lang, setLang] = useState<Lang>('en')
  const t = T[lang]
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/auth/send-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok && json.error) { setError(json.error); return }
    setSent(true)
  }

  return (
    <main className="min-h-screen bg-[#0F0A00] flex items-center justify-center px-4">
      <LangToggle lang={lang} onChange={setLang} fixed />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-2xl text-[#C9A84C]">✂ Noble</Link>
          <p className="text-white/50 text-sm mt-2">{t.sub}</p>
        </div>
        {sent ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
              </svg>
            </div>
            <h2 className="text-white font-bold text-lg">{t.doneTitle}</h2>
            <p className="text-white/40 text-sm">{t.doneMsg(email)}</p>
            <Link href="/login" className="block text-[#C9A84C] hover:underline text-sm">{t.back}</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded">{error}</div>}
            <p className="text-white/50 text-sm">{t.hint}</p>
            <div>
              <label htmlFor="fp-email" className="text-sm text-white/60 mb-1 block">{t.email}</label>
              <input id="fp-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email" required
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-3 text-white text-sm outline-none focus:border-[#C9A84C] min-h-[44px]"
                placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#C9A84C] text-black font-bold py-3 rounded hover:bg-[#e8d08a] transition disabled:opacity-50 min-h-[44px]">
              {loading ? t.sending : t.send}
            </button>
            <p className="text-center">
              <Link href="/login" className="text-white/40 hover:text-white/70 text-sm transition">{t.back}</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
