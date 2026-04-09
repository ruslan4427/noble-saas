'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TrialBanner from '@/components/TrialBanner'

interface Org {
  id: string
  name: string
  plan_id: string
}

export default function Analytics() {
  const [org, setOrg] = useState<Org | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: orgData } = await supabase
        .from('organizations').select('*').eq('owner_id', user.id).single()
      if (!orgData) { router.push('/onboarding'); return }
      setOrg(orgData)
      setHasAccess(['pro', 'business'].includes(orgData.plan_id))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <main className="min-h-screen bg-[#0F0A00] flex items-center justify-center">
      <div className="text-[#C9A84C] font-serif text-lg">Loading...</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#0F0A00] text-white">
      <TrialBanner />
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0F0A00]/95 backdrop-blur z-50">
        <div className="flex items-center gap-3">
          <span className="font-serif text-[#C9A84C] text-lg">✂ Noble</span>
          <span className="text-white/20">|</span>
          <span className="text-white/70 text-sm">Analytics</span>
        </div>
        <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition">← Dashboard</Link>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {!hasAccess ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-2xl font-serif font-bold mb-3">Analytics is a Pro feature</h2>
            <p className="text-white/50 mb-8">Upgrade to Pro or Business to access detailed analytics.</p>
            <Link href="/billing" className="bg-[#C9A84C] text-black font-bold px-8 py-3 rounded hover:bg-[#e8d08a] transition">
              Upgrade to Pro →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-2xl font-serif font-bold">Analytics — {org?.name}</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total bookings', value: '142', change: '+12%' },
                { label: 'This month', value: '38', change: '+8%' },
                { label: 'Revenue est.', value: '$2,840', change: '+15%' },
                { label: 'Avg booking value', value: '$74', change: '' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-white/40 text-xs mb-1">{stat.label}</div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  {stat.change && <div className="text-green-400 text-xs mt-1">{stat.change} vs last month</div>}
                </div>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="font-semibold mb-4">Bookings this month</h2>
              <div className="flex items-end gap-1 h-32">
                {[12,18,8,22,15,28,20,14,25,18,30,22,16,24,19,28,21,15,26,18,22,30,25,20,18,24,28,22,16,38].map((val, i) => (
                  <div key={i} className="flex-1 bg-[#C9A84C]/60 rounded-t hover:bg-[#C9A84C] transition-colors"
                    style={{ height: `${(val / 38) * 100}%` }} title={`Day ${i+1}: ${val}`} />
                ))}
              </div>
              <div className="flex justify-between text-white/30 text-xs mt-2">
                <span>Apr 1</span><span>Apr 15</span><span>Apr 30</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}