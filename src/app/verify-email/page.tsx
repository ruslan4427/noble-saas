'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmail() {
  const [email, setEmail] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // On mount: get session, redirect if already verified or not logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      if (user.email_confirmed_at) { router.replace('/dashboard'); return }
      setEmail(user.email || '')
      setChecking(false)
    })
  }, [])

  // Poll every 3s — redirect immediately when verified
  useEffect(() => {
    if (checking) return
    const id = setInterval(async () => {
      await supabase.auth.refreshSession()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email_confirmed_at) router.replace('/dashboard')
    }, 3000)
    return () => clearInterval(id)
  }, [checking])

  // Cooldown countdown
  useEffect(() => {
    if (!cooldown) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function handleResend() {
    if (!email || cooldown > 0) return
    setError('')
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) { setError(error.message); return }
    setSent(true)
    setCooldown(60)
  }

  async function handleBack() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (checking) return (
    <main className="min-h-screen bg-[#0F0A00] flex items-center justify-center">
      <svg className="animate-spin w-6 h-6 text-[#C9A84C]" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/>
      </svg>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#0F0A00] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-2xl text-[#C9A84C]">✂ Noble</Link>
        </div>

        <div className="text-center mb-6">
          {/* Envelope icon */}
          <div className="w-16 h-16 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m2 7 10 7 10-7"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          {email && (
            <p className="text-white/50 text-sm">
              We sent a verification link to{' '}
              <span className="text-white font-medium">{email}</span>
            </p>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          {sent && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Verification email sent!
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <p className="text-white/40 text-sm text-center">
            Click the link in the email to verify your account. Check your spam folder if you don&apos;t see it.
          </p>

          <button
            onClick={handleResend}
            disabled={cooldown > 0 || !email}
            className="w-full bg-[#C9A84C] text-black font-bold py-3 rounded-lg hover:bg-[#e8d08a] transition disabled:opacity-50 min-h-[44px] text-sm">
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
          </button>

          <div className="flex items-center gap-3 text-white/20 text-xs">
            <div className="flex-1 h-px bg-white/10"/>
            <span>or</span>
            <div className="flex-1 h-px bg-white/10"/>
          </div>

          <button
            onClick={handleBack}
            className="w-full border border-white/10 text-white/40 hover:text-white hover:border-white/30 text-sm py-2.5 rounded-lg transition min-h-[44px]">
            Back to login
          </button>
        </div>

        <p className="text-white/20 text-xs text-center mt-4">
          This page checks automatically — no need to refresh
        </p>
      </div>
    </main>
  )
}
