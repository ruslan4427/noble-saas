'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LangToggle, { type Lang } from '@/components/LangToggle'

const T = {
  en: {
    sub: 'Sign in to your account',
    email: 'Email', password: 'Password',
    forgot: 'Forgot password?',
    submit: 'Sign in →', loading: 'Signing in...',
    noAccount: 'No account?', trial: 'Start free trial',
  },
  es: {
    sub: 'Inicia sesión en tu cuenta',
    email: 'Correo', password: 'Contraseña',
    forgot: '¿Olvidaste tu contraseña?',
    submit: 'Iniciar sesión →', loading: 'Iniciando sesión...',
    noAccount: '¿Sin cuenta?', trial: 'Prueba gratis',
  },
}

export default function Login() {
  const [lang, setLang] = useState<Lang>('en')
  const t = T[lang]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    if (!data.user?.email_confirmed_at) { router.push('/verify-email'); return }
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-[#0F0A00] flex items-center justify-center px-4">
      <LangToggle lang={lang} onChange={setLang} fixed />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-2xl text-[#C9A84C]">✂ Noble</Link>
          <p className="text-white/50 text-sm mt-2">{t.sub}</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded">{error}</div>}
          <div>
            <label className="text-sm text-white/60 mb-1 block">{t.email}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]"
              placeholder="you@example.com" required />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-white/60">{t.password}</label>
              <Link href="/forgot-password" className="text-xs text-[#C9A84C] hover:underline">{t.forgot}</Link>
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]"
              placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#C9A84C] text-black font-bold py-2 rounded hover:bg-[#e8d08a] transition disabled:opacity-50">
            {loading ? t.loading : t.submit}
          </button>
        </form>
        <p className="text-center text-white/40 text-sm mt-4">
          {t.noAccount} <Link href="/signup" className="text-[#C9A84C] hover:underline">{t.trial}</Link>
        </p>
      </div>
    </main>
  )
}
