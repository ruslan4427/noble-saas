'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Org {
  id: string
  name: string
  slug: string
  plan_id: string
  sub_status: string
  trial_ends_at: string | null
}

interface Staff {
  id: string
  name: string
  role: string
  is_active: boolean
}

export default function Dashboard() {
  const [org, setOrg] = useState<Org | null>(null)
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (!orgData) { router.push('/onboarding'); return }
      setOrg(orgData)

      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .eq('org_id', orgData.id)
        .eq('is_active', true)

      setStaff(staffData || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function trialDaysLeft() {
    if (!org?.trial_ends_at) return null
    const diff = new Date(org.trial_ends_at).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / 86400000))
  }

  const days = trialDaysLeft()

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0F0A00] flex items-center justify-center">
        <div className="text-[#C9A84C] text-lg font-serif">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0F0A00] text-white">

      {/* Trial banner */}
      {org?.sub_status === 'trialing' && days !== null && (
        <div className="bg-[#C9A84C]/10 border-b border-[#C9A84C]/30 px-6 py-2 flex items-center justify-between">
          <span className="text-[#C9A84C] text-sm">
            ⏳ {days} day{days !== 1 ? 's' : ''} left in your free trial
          </span>
          <Link href="/billing" className="text-xs bg-[#C9A84C] text-black font-bold px-3 py-1 rounded hover:bg-[#e8d08a] transition">
            Upgrade →
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0F0A00]/95 backdrop-blur z-50">
        <div className="flex items-center gap-3">
          <span className="font-serif text-[#C9A84C] text-lg">✂ Noble</span>
          <span className="text-white/20">|</span>
          <span className="text-white/70 text-sm font-medium">{org?.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] px-2 py-1 rounded capitalize">
            {org?.plan_id} plan
          </span>
          <button onClick={handleLogout} className="text-sm text-white/40 hover:text-white transition">
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-lg p-1 w-fit">
          {['overview', 'staff', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded text-sm font-medium transition capitalize ${activeTab === tab ? 'bg-[#C9A84C] text-black' : 'text-white/50 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Staff members', value: staff.length },
                { label: 'Plan', value: org?.plan_id },
                { label: 'Status', value: org?.sub_status },
                { label: 'Trial days left', value: days ?? '—' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-white/40 text-xs mb-1">{stat.label}</div>
                  <div className="text-white font-semibold capitalize">{String(stat.value)}</div>
                </div>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-3">Your booking page</h3>
              <div className="flex items-center gap-3">
                <code className="bg-black/30 px-3 py-2 rounded text-[#C9A84C] text-sm flex-1">
                  noble.app/{org?.slug}
                </code>
                <button
                  onClick={() => navigator.clipboard?.writeText(`https://noble.app/${org?.slug}`)}
                  className="border border-white/20 text-white/60 px-3 py-2 rounded text-sm hover:border-white/40 transition">
                  Copy
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Quick actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: '+ Add staff', action: () => setActiveTab('staff') },
                  { label: '⚙ Settings', action: () => setActiveTab('settings') },
                  { label: '💳 Billing', action: () => router.push('/billing') },
                ].map(a => (
                  <button key={a.label} onClick={a.action}
                    className="border border-white/20 text-white/70 px-4 py-3 rounded text-sm hover:border-white/40 hover:text-white transition">
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Staff tab */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Staff members</h2>
              <button className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition">
                + Add staff
              </button>
            </div>
            {staff.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-white/40">
                No staff members yet. Add your first barber.
              </div>
            ) : (
              <div className="space-y-2">
                {staff.map(s => (
                  <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-white/40 text-xs capitalize">{s.role}</div>
                    </div>
                    <span className="text-xs bg-green-500/10 border border-green-500/30 text-green-400 px-2 py-1 rounded">Active</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4 max-w-md">
            <h2 className="font-semibold text-lg">Salon settings</h2>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Salon name</label>
                <input defaultValue={org?.name}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Slug</label>
                <input defaultValue={org?.slug}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C] font-mono" />
              </div>
              <button className="bg-[#C9A84C] text-black font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition text-sm">
                Save changes
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
