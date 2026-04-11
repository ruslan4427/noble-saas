'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TrialBanner from '@/components/TrialBanner'

const APP_URL = 'https://www.noblelink.app'

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

interface Service {
  id: string
  name: string
  price_cents: number
  duration_min: number
  is_active: boolean
}

export default function Dashboard() {
  const [org, setOrg] = useState<Org | null>(null)
  const [staff, setStaff] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()
  const supabase = createClient()

  // Add staff form
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffRole, setNewStaffRole] = useState('barber')
  const [staffSaving, setStaffSaving] = useState(false)

  // Add service form
  const [showAddService, setShowAddService] = useState(false)
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('')
  const [newServiceDuration, setNewServiceDuration] = useState('30')
  const [serviceSaving, setServiceSaving] = useState(false)

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

      const [{ data: staffData }, { data: servicesData }] = await Promise.all([
        supabase.from('staff').select('*').eq('org_id', orgData.id).eq('is_active', true),
        supabase.from('services').select('*').eq('org_id', orgData.id).eq('is_active', true),
      ])

      setStaff(staffData || [])
      setServices(servicesData || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleAddStaff() {
    if (!newStaffName.trim() || !org) return
    setStaffSaving(true)
    await supabase.from('staff').insert({ org_id: org.id, name: newStaffName.trim(), role: newStaffRole })
    const { data } = await supabase.from('staff').select('*').eq('org_id', org.id).eq('is_active', true)
    setStaff(data || [])
    setNewStaffName('')
    setNewStaffRole('barber')
    setShowAddStaff(false)
    setStaffSaving(false)
  }

  async function handleAddService() {
    if (!newServiceName.trim() || !newServicePrice || !org) return
    setServiceSaving(true)
    const price_cents = Math.round(parseFloat(newServicePrice) * 100)
    await supabase.from('services').insert({
      org_id: org.id,
      name: newServiceName.trim(),
      price_cents,
      duration_min: parseInt(newServiceDuration),
      is_active: true,
    })
    const { data } = await supabase.from('services').select('*').eq('org_id', org.id).eq('is_active', true)
    setServices(data || [])
    setNewServiceName('')
    setNewServicePrice('')
    setNewServiceDuration('30')
    setShowAddService(false)
    setServiceSaving(false)
  }

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
  const bookingUrl = `${APP_URL}/salon/${org?.slug}`

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0F0A00] flex items-center justify-center">
        <div className="text-[#C9A84C] text-lg font-serif">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0F0A00] text-white">
      <TrialBanner />

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
          {['overview', 'staff', 'services', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded text-sm font-medium transition capitalize ${activeTab === tab ? 'bg-[#C9A84C] text-black' : 'text-white/50 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Staff members', value: staff.length },
                { label: 'Services', value: services.length },
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
                <code className="bg-black/30 px-3 py-2 rounded text-[#C9A84C] text-sm flex-1 break-all">
                  {bookingUrl}
                </code>
                <button
                  onClick={() => navigator.clipboard?.writeText(bookingUrl)}
                  className="border border-white/20 text-white/60 px-3 py-2 rounded text-sm hover:border-white/40 transition whitespace-nowrap">
                  Copy
                </button>
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
                  className="border border-white/20 text-white/60 px-3 py-2 rounded text-sm hover:border-white/40 transition whitespace-nowrap">
                  Open ↗
                </a>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Quick actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: '+ Add staff', action: () => { setActiveTab('staff'); setShowAddStaff(true) } },
                  { label: '+ Add service', action: () => { setActiveTab('services'); setShowAddService(true) } },
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

        {/* Staff */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Staff members</h2>
              <button onClick={() => setShowAddStaff(true)}
                className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition">
                + Add staff
              </button>
            </div>

            {showAddStaff && (
              <div className="bg-white/5 border border-[#C9A84C]/30 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#C9A84C]">New staff member</h3>
                <input value={newStaffName} onChange={e => setNewStaffName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]"
                  placeholder="Full name" />
                <select value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]">
                  <option value="barber">Barber</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={handleAddStaff} disabled={staffSaving || !newStaffName.trim()}
                    className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition disabled:opacity-40">
                    {staffSaving ? 'Saving...' : 'Add'}
                  </button>
                  <button onClick={() => setShowAddStaff(false)}
                    className="border border-white/20 text-white/60 text-sm px-4 py-2 rounded hover:border-white/40 transition">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {staff.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-white/40">
                No staff members yet. Add your first barber!
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

        {/* Services */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Services</h2>
              <button onClick={() => setShowAddService(true)}
                className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition">
                + Add service
              </button>
            </div>

            {showAddService && (
              <div className="bg-white/5 border border-[#C9A84C]/30 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#C9A84C]">New service</h3>
                <input value={newServiceName} onChange={e => setNewServiceName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]"
                  placeholder="Service name (e.g. Haircut)" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Price ($)</label>
                    <input value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)}
                      type="number" min="0" step="0.01"
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]"
                      placeholder="25" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Duration (min)</label>
                    <select value={newServiceDuration} onChange={e => setNewServiceDuration(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]">
                      {[15, 30, 45, 60, 90, 120].map(m => (
                        <option key={m} value={m}>{m} min</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddService} disabled={serviceSaving || !newServiceName.trim() || !newServicePrice}
                    className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition disabled:opacity-40">
                    {serviceSaving ? 'Saving...' : 'Add'}
                  </button>
                  <button onClick={() => setShowAddService(false)}
                    className="border border-white/20 text-white/60 text-sm px-4 py-2 rounded hover:border-white/40 transition">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {services.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-white/40">
                No services yet. Add your first service so clients can book!
              </div>
            ) : (
              <div className="space-y-2">
                {services.map(s => (
                  <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-white/40 text-xs">{s.duration_min} min</div>
                    </div>
                    <span className="text-[#C9A84C] font-semibold">${(s.price_cents / 100).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
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
                <label className="text-sm text-white/60 mb-1 block">Booking URL</label>
                <div className="bg-black/30 px-3 py-2 rounded text-[#C9A84C] text-sm font-mono break-all">
                  {bookingUrl}
                </div>
              </div>
              <button className="bg-[#C9A84C] text-black font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition text-sm">
                Save changes
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-3">Subscription</h3>
              <p className="text-white/50 text-sm mb-4">
                Current plan: <span className="text-white capitalize">{org?.plan_id}</span> ·
                Status: <span className="text-white capitalize">{org?.sub_status}</span>
              </p>
              <Link href="/billing" className="bg-[#C9A84C] text-black font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition text-sm">
                Manage billing →
              </Link>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
