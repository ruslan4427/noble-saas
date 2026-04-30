'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import LangToggle, { type Lang } from '@/components/LangToggle'

const T = {
  en: {
    sub: 'Set a new password',
    newPw: 'New password', confirmPw: 'Confirm password',
    ph: 'Min. 6 characters', phRepeat: 'Repeat password',
    submit: 'Update password →', submitting: 'Updating...',
    doneTitle: 'Password updated!', doneRedirect: 'Redirecting to sign in…',
    noMatch: 'Passwords do not match', tooShort: 'Password must be at least 6 characters',
    invalidLink: 'Invalid reset link. Please request a new one.',
    requestNew: 'Request a new link',
    strength: ['', 'Weak', 'Fair', 'Good', 'Strong'],
  },
  es: {
    sub: 'Establece una nueva contraseña',
    newPw: 'Nueva contraseña', confirmPw: 'Confirmar contraseña',
    ph: 'Mín. 6 caracteres', phRepeat: 'Repite la contraseña',
    submit: 'Actualizar contraseña →', submitting: 'Actualizando...',
    doneTitle: '¡Contraseña actualizada!', doneRedirect: 'Redirigiendo al inicio de sesión…',
    noMatch: 'Las contraseñas no coinciden', tooShort: 'La contraseña debe tener al menos 6 caracteres',
    invalidLink: 'Enlace inválido. Solicita uno nuevo.',
    requestNew: 'Solicitar nuevo enlace',
    strength: ['', 'Débil', 'Regular', 'Buena', 'Fuerte'],
  },
}

function PasswordStrength({ password, labels }: { password: string; labels: string[] }) {
  if (!password) return null
  const checks = [password.length >= 6, password.length >= 10, /[A-Z]/.test(password), /[0-9]/.test(password)]
  const score = checks.filter(Boolean).length
  const colors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-400', 'bg-green-500']
  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= score ? colors[score] : 'bg-white/10'}`} />
        ))}
      </div>
      {score > 0 && <p className="text-xs text-white/40">{labels[score]} password</p>}
    </div>
  )
}

function ResetForm({ lang }: { lang: Lang }) {
  const t = T[lang]
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()

  const linkError = (!token || !email) ? t.invalidLink : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError(t.noMatch); return }
    if (password.length < 6) { setError(t.tooShort); return }
    setLoading(true); setError('')
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, password }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setError(json.error || 'Something went wrong'); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  if (done) return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <h2 className="text-white font-bold text-lg">{t.doneTitle}</h2>
      <p className="text-white/40 text-sm">{t.doneRedirect}</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
      {(error || linkError) && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded">
          {error || linkError}
          {(!token || !email) && <span> <Link href="/forgot-password" className="underline">{t.requestNew}</Link></span>}
        </div>
      )}
      <div>
        <label htmlFor="rp-password" className="text-sm text-white/60 mb-1 block">{t.newPw}</label>
        <div className="relative">
          <input id="rp-password" type={showPassword ? 'text' : 'password'} value={password}
            onChange={e => setPassword(e.target.value)} autoComplete="new-password"
            required minLength={6} disabled={!token || !email}
            className="w-full bg-white/10 border border-white/20 rounded px-3 py-3 pr-12 text-white text-sm outline-none focus:border-[#C9A84C] min-h-[44px] disabled:opacity-40"
            placeholder={t.ph} />
          <button type="button" onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Hide' : 'Show'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            {showPassword
              ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
              : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            }
          </button>
        </div>
        <PasswordStrength password={password} labels={t.strength} />
      </div>
      <div>
        <label htmlFor="rp-confirm" className="text-sm text-white/60 mb-1 block">{t.confirmPw}</label>
        <input id="rp-confirm" type={showPassword ? 'text' : 'password'} value={confirm}
          onChange={e => setConfirm(e.target.value)} autoComplete="new-password"
          required minLength={6} disabled={!token || !email}
          className="w-full bg-white/10 border border-white/20 rounded px-3 py-3 text-white text-sm outline-none focus:border-[#C9A84C] min-h-[44px] disabled:opacity-40"
          placeholder={t.phRepeat} />
      </div>
      <button type="submit" disabled={loading || !token || !email}
        className="w-full bg-[#C9A84C] text-black font-bold py-3 rounded hover:bg-[#e8d08a] transition disabled:opacity-50 min-h-[44px]">
        {loading ? t.submitting : t.submit}
      </button>
    </form>
  )
}

export default function ResetPassword() {
  const [lang, setLang] = useState<Lang>('en')
  return (
    <main className="min-h-screen bg-[#0F0A00] flex items-center justify-center px-4">
      <LangToggle lang={lang} onChange={setLang} fixed />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-2xl text-[#C9A84C]">✂ Noble</Link>
          <p className="text-white/50 text-sm mt-2">{T[lang].sub}</p>
        </div>
        <Suspense fallback={<div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center text-white/40 text-sm">Loading…</div>}>
          <ResetForm lang={lang} />
        </Suspense>
      </div>
    </main>
  )
}
