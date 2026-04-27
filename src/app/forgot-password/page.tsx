'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
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
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-2xl text-[#C9A84C]">✂ Noble</Link>
          <p className="text-white/50 text-sm mt-2">Reset your password</p>
        </div>

        {sent ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
              </svg>
            </div>
            <h2 className="text-white font-bold text-lg">Check your email</h2>
            <p className="text-white/40 text-sm">
              If an account exists for <span className="text-white font-medium">{email}</span>, we sent a reset link. Check your inbox and spam folder.
            </p>
            <Link href="/login" className="block text-[#C9A84C] hover:underline text-sm">← Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded">{error}</div>}
            <p className="text-white/50 text-sm">Enter your email and we&apos;ll send you a reset link.</p>
            <div>
              <label htmlFor="fp-email" className="text-sm text-white/60 mb-1 block">Email</label>
              <input id="fp-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email" required
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-3 text-white text-sm outline-none focus:border-[#C9A84C] min-h-[44px]"
                placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#C9A84C] text-black font-bold py-3 rounded hover:bg-[#e8d08a] transition disabled:opacity-50 min-h-[44px]">
              {loading ? 'Sending...' : 'Send reset link →'}
            </button>
            <p className="text-center">
              <Link href="/login" className="text-white/40 hover:text-white/70 text-sm transition">← Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
