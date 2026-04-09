'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-[#0F0A00] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-2xl text-[#C9A84C]">✂ Noble</Link>
          <p className="text-white/50 mt-2 text-sm">Sign in to your account</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded">{error}</div>}
          <div>
            <label className="text-white/60 text-sm mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C9A84C]"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-white/60 text-sm mb-1 block">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C9A84C]"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#C9A84C] text-black font-semibold py-2 rounded hover:bg-[#e8d08a] transition disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
        </form>
        <p className="text-center text-white/40 text-sm mt-4">
          No account? <Link href="/signup" className="text-[#C9A84C] hover:underline">Start free trial</Link>
        </p>
      </div>
    </main>
  )
}
