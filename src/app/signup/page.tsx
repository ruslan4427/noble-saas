'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
          <Link href="/" className="font-serif text-2xl text-[#C9A84C]">✂ Noble</Link>
          <p className="text-white/50 text-sm mt-2">Start your 14-day free trial</p>
          <div className="inline-block bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-xs px-3 py-1 rounded-full mt-2">No credit card required</div>
        </div>
        <form onSubmit={handleSignup} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded">{error}</div>}
          <div>
            <label className="text-sm text-white/60 mb-1 block">Full name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]"
              placeholder="John Smith" required />
          </div>
          <div>
            <label className="text-sm text-white/60 mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]"
              placeholder="you@example.com" required />
          </div>
          <div>
            <label className="text-sm text-white/60 mb-1 block">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]"
              placeholder="Min. 6 characters" required minLength={6} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#C9A84C] text-black font-bold py-2 rounded hover:bg-[#e8d08a] transition disabled:opacity-50">
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
