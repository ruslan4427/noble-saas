'use client'
export const dynamic = 'force-dynamic'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LangToggle, { type Lang } from '@/components/LangToggle'

const T = {
  en: {
    sub: 'Start your 14-day free trial', noCc: 'No credit card required',
    name: 'Full name', email: 'Email', password: 'Password',
    namePh: 'John Smith', pwPh: 'Min. 6 characters',
    submit: 'Continue →', submitting: 'Creating account...',
    terms: 'By signing up you agree to our', termsLink: 'Terms', and: 'and', privacyLink: 'Privacy Policy',
    haveAccount: 'Already have an account?', signIn: 'Sign in',
    checkEmail: 'Check your email',
    codeSent: (email: string) => <>We sent a 6-digit code to<br /><span className="text-white font-medium">{email}</span></>,
    codeHint: 'Enter the code from the email to continue',
    resend: 'Resend code', resendIn: (s: number) => `Resend in ${s}s`,
    back: '← Back',
    strength: ['', 'Weak', 'Fair', 'Good', 'Strong'],
    showPw: 'Show password', hidePw: 'Hide password',
  },
  es: {
    sub: 'Comienza tu prueba gratuita de 14 días', noCc: 'Sin tarjeta de crédito',
    name: 'Nombre completo', email: 'Correo', password: 'Contraseña',
    namePh: 'Juan García', pwPh: 'Mín. 6 caracteres',
    submit: 'Continuar →', submitting: 'Creando cuenta...',
    terms: 'Al registrarte aceptas nuestros', termsLink: 'Términos', and: 'y', privacyLink: 'Política de privacidad',
    haveAccount: '¿Ya tienes cuenta?', signIn: 'Iniciar sesión',
    checkEmail: 'Revisa tu correo',
    codeSent: (email: string) => <>Enviamos un código de 6 dígitos a<br /><span className="text-white font-medium">{email}</span></>,
    codeHint: 'Ingresa el código del correo para continuar',
    resend: 'Reenviar código', resendIn: (s: number) => `Reenviar en ${s}s`,
    back: '← Atrás',
    strength: ['', 'Débil', 'Regular', 'Buena', 'Fuerte'],
    showPw: 'Mostrar contraseña', hidePw: 'Ocultar contraseña',
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

function OtpInput({ onComplete }: { onComplete: (code: string) => void }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const refs = useRef<(HTMLInputElement | null)[]>([])
  useEffect(() => { refs.current[0]?.focus() }, [])
  function handleChange(i: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]; next[i] = digit; setDigits(next)
    if (digit && i < 5) refs.current[i + 1]?.focus()
    if (next.every(d => d)) onComplete(next.join(''))
  }
  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }
  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = ['', '', '', '', '', '']; pasted.split('').forEach((c, i) => { next[i] = c }); setDigits(next)
    refs.current[Math.min(pasted.length, 5)]?.focus()
    if (pasted.length === 6) onComplete(pasted)
  }
  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input key={i} ref={el => { refs.current[i] = el }} type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
          className={`w-11 h-14 text-center text-xl font-bold bg-white/10 border-2 rounded-xl text-white outline-none transition ${d ? 'border-[#C9A84C]' : 'border-white/20 focus:border-[#C9A84C]/60'}`} />
      ))}
    </div>
  )
}

export default function Signup() {
  const [lang, setLang] = useState<Lang>('en')
  const t = T[lang]
  const [step, setStep] = useState<'credentials' | 'verify'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [userId, setUserId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!cooldown) return
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    const uid = data.user?.id
    // If no user was created it's a real error. If user exists but Supabase
    // failed to send its own confirmation email — that's fine, we use our OTP.
    if (!uid) { setError(error?.message || 'Signup failed. Try again.'); setLoading(false); return }
    setUserId(uid)
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userId: uid }),
    })
    const json = await res.json()
    if (res.status === 409) {
      // Email already confirmed — push to login with a clear message
      setLoading(false)
      router.push('/login?notice=already_registered')
      return
    }
    if (!res.ok) { setError(json.error || 'Failed to send code'); setLoading(false); return }
    setLoading(false); setStep('verify'); setCooldown(60)
  }

  async function handleVerify(code: string) {
    setVerifying(true); setError('')
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, userId }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Invalid code'); setVerifying(false); return }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) { setError(signInError.message); setVerifying(false); return }
    router.push('/onboarding')
  }

  async function handleResend() {
    if (cooldown > 0) return; setError('')
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userId }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Failed to send code'); return }
    setCooldown(60)
  }

  return (
    <main className="min-h-screen bg-[#0F0A00] flex items-center justify-center px-4">
      <LangToggle lang={lang} onChange={setLang} fixed />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-2xl text-[#C9A84C]">✂ Noble</Link>
          {step === 'credentials' && (
            <>
              <p className="text-white/50 text-sm mt-2">{t.sub}</p>
              <div className="inline-block bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-xs px-3 py-1 rounded-full mt-2">{t.noCc}</div>
            </>
          )}
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleSignup} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4" noValidate>
            <div role="alert" aria-live="assertive" aria-atomic="true">
              {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded">{error}</div>}
            </div>
            <div>
              <label htmlFor="signup-name" className="text-sm text-white/60 mb-1 block">{t.name}</label>
              <input id="signup-name" type="text" value={name} onChange={e => setName(e.target.value)}
                autoComplete="name" required className="w-full bg-white/10 border border-white/20 rounded px-3 py-3 text-white text-sm outline-none focus:border-[#C9A84C] min-h-[44px]"
                placeholder={t.namePh} />
            </div>
            <div>
              <label htmlFor="signup-email" className="text-sm text-white/60 mb-1 block">{t.email}</label>
              <input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email" required className="w-full bg-white/10 border border-white/20 rounded px-3 py-3 text-white text-sm outline-none focus:border-[#C9A84C] min-h-[44px]"
                placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="signup-password" className="text-sm text-white/60 mb-1 block">{t.password}</label>
              <div className="relative">
                <input id="signup-password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} autoComplete="new-password" required minLength={6}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-3 pr-12 text-white text-sm outline-none focus:border-[#C9A84C] min-h-[44px]"
                  placeholder={t.pwPh} />
                <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? t.hidePw : t.showPw}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                  {showPassword
                    ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              <PasswordStrength password={password} labels={t.strength} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#C9A84C] text-black font-bold py-3 rounded hover:bg-[#e8d08a] transition disabled:opacity-50 min-h-[44px]">
              {loading ? t.submitting : t.submit}
            </button>
            <p className="text-center text-white/30 text-xs">
              {t.terms}{' '}
              <Link href="/legal/terms" className="text-[#C9A84C] hover:underline">{t.termsLink}</Link>
              {' '}{t.and}{' '}
              <Link href="/legal/privacy" className="text-[#C9A84C] hover:underline">{t.privacyLink}</Link>
            </p>
          </form>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
                </svg>
              </div>
              <h2 className="text-white font-bold text-lg">{t.checkEmail}</h2>
              <p className="text-white/40 text-sm mt-1">{t.codeSent(email)}</p>
            </div>
            <div role="alert" aria-live="assertive" aria-atomic="true">
              {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg text-center">{error}</div>}
            </div>
            {verifying ? (
              <div className="flex items-center justify-center py-4">
                <svg className="animate-spin w-6 h-6 text-[#C9A84C]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/>
                </svg>
              </div>
            ) : <OtpInput onComplete={handleVerify} />}
            <div className="text-center space-y-3">
              <p className="text-white/30 text-xs">{t.codeHint}</p>
              <button onClick={handleResend} disabled={cooldown > 0}
                className="text-sm text-[#C9A84C] hover:underline disabled:text-white/30 disabled:no-underline transition">
                {cooldown > 0 ? t.resendIn(cooldown) : t.resend}
              </button>
            </div>
            <button onClick={() => { setStep('credentials'); setError('') }}
              className="w-full border border-white/10 text-white/40 hover:text-white hover:border-white/30 text-sm py-2.5 rounded-lg transition">
              {t.back}
            </button>
          </div>
        )}

        {step === 'credentials' && (
          <p className="text-center text-white/40 text-sm mt-4">
            {t.haveAccount}{' '}
            <Link href="/login" className="text-[#C9A84C] hover:underline">{t.signIn}</Link>
          </p>
        )}
      </div>
    </main>
  )
}
