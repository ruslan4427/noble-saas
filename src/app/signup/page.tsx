'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const checks = [
    password.length >= 6,
    password.length >= 10,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-400', 'bg-green-500']
  return (
    <div className="mt-1.5" role="status" aria-live="polite" aria-label={`Password strength: ${labels[score]}`}>
      <div className="flex gap-1 mb-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= score ? colors[score] : 'bg-white/10'}`} />
        ))}
      </div>
      {score > 0 && <p className="text-xs text-white/40">{labels[score]} password</p>}
    </div>
  )
}

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/onboarding')
  }

  return (
    <main className="min-h-screen bg-[#0F0A00] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-2xl text-[#C9A84C]" aria-label="Noble — go to homepage">✂ Noble</Link>
          <p className="text-white/50 text-sm mt-2">Start your 14-day free trial</p>
          <div className="inline-block bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-xs px-3 py-1 rounded-full mt-2">No credit card required</div>
        </div>

        <form onSubmit={handleSignup} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4" noValidate>

          {/* aria-live error region — WCAG 4.1.3 */}
          <div role="alert" aria-live="assertive" aria-atomic="true">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded">
                {error}
              </div>
            )}
          </div>

          {/* Full name */}
          <div>
            <label htmlFor="signup-name" className="text-sm text-white/60 mb-1 block">Full name</label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
              required
              aria-required="true"
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-3 text-white text-sm outline-none focus:border-[#C9A84C] min-h-[44px]"
              placeholder="John Smith"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="signup-email" className="text-sm text-white/60 mb-1 block">Email</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
              aria-required="true"
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-3 text-white text-sm outline-none focus:border-[#C9A84C] min-h-[44px]"
              placeholder="you@example.com"
            />
          </div>

          {/* Password with toggle */}
          <div>
            <label htmlFor="signup-password" className="text-sm text-white/60 mb-1 block">Password</label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                aria-required="true"
                minLength={6}
                aria-describedby="password-strength"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-3 pr-12 text-white text-sm outline-none focus:border-[#C9A84C] min-h-[44px]"
                placeholder="Min. 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            <div id="password-strength">
              <PasswordStrength password={password} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C9A84C] text-black font-bold py-3 rounded hover:bg-[#e8d08a] transition disabled:opacity-50 min-h-[44px]"
          >
            {loading ? 'Creating account...' : 'Start free trial →'}
          </button>

          <p className="text-center text-white/30 text-xs">
            By signing up you agree to our{' '}
            <Link href="/legal/terms" className="text-[#C9A84C] hover:underline">Terms</Link>
            {' '}and{' '}
            <Link href="/legal/privacy" className="text-[#C9A84C] hover:underline">Privacy Policy</Link>
          </p>
        </form>

        <p className="text-center text-white/40 text-sm mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-[#C9A84C] hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  )
}
