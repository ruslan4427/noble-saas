'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TrialBanner from '@/components/TrialBanner'
import BookingCalendar from '@/components/BookingCalendar'

const APP_URL = 'https://www.noblelink.app'

interface Org {
  id: string
  name: string
  slug: string
  plan_id: string
  sub_status: string
  trial_ends_at: string | null
  timezone?: string
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

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#C9A84C] text-black text-sm font-bold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
      {message}
    </div>
  )
}

interface ChecklistProps {
  hasService: boolean
  hasStaff: boolean
  hasCopiedLink: boolean
  onAddService: () => void
  onAddStaff: () => void
  onCopyLink: () => void
}

function OnboardingChecklist({ hasService, hasStaff, hasCopiedLink, onAddService, onAddStaff, onCopyLink }: ChecklistProps) {
  const steps = [
    { id: 'service', done: hasService, label: 'Add your first service', sub: 'e.g. Haircut · 30 min · $25', action: onAddService, cta: 'Add service' },
    { id: 'staff', done: hasStaff, label: 'Add a staff member', sub: 'Let clients choose their barber', action: onAddStaff, cta: 'Add staff' },
    { id: 'link', done: hasCopiedLink, label: 'Share your booking link', sub: 'Copy and send to your clients', action: onCopyLink, cta: 'Copy link' },
  ]
  const doneCount = steps.filter(s => s.done).length
  const allDone = doneCount === steps.length
  const pct = Math.round((doneCount / steps.length) * 100)
  if (allDone) return null
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6" role="region" aria-label="Getting started checklist">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">Get started</h3>
          <p className="text-white/40 text-xs mt-0.5">{doneCount} of {steps.length} steps completed</p>
        </div>
        <span className="text-[#C9A84C] text-sm font-bold">{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full mb-5 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-[#C9A84C] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={step.id} className={`flex items-center gap-4 rounded-xl px-4 py-3 transition ${step.done ? 'opacity-50' : 'bg-white/5'}`}>
            <div className={`w-7 h-7 rounded-full flex-none flex items-center justify-center border-2 transition ${step.done ? 'bg-[#C9A84C] border-[#C9A84C]' : 'border-white/20'}`} aria-hidden="true">
              {step.done ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : <span className="text-white/30 text-xs font-bold">{i + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? 'line-through text-white/40' : 'text-white'}`}>{step.label}</p>
              {!step.done && <p className="text-white/30 text-xs mt-0.5">{step.sub}</p>}
            </div>
            {!step.done && (
              <button onClick={step.action} className="flex-none text-xs font-bold text-black bg-[#C9A84C] hover:bg-[#e8d08a] transition px-3 py-1.5 rounded-lg whitespace-nowrap">
                {step.cta} →
              </button>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 32)
}

const COPIED_LINK_KEY = 'noble_onboarding_copied_link'
const TABS = ['overview', 'calendar', 'staff', 'services', 'settings'] as const
type Tab = typeof TABS[number]

export default function Dashboard() {
  const [org, setOrg] = useState<Org | null>(null)
  const [staff, setStaff] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [toast, setToast] = useState<string | null>(null)
  const [hasCopiedLink, setHasCopiedLink] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [showAddStaff, setShowAddStaff] = useState(false)
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffRole, setNewStaffRole] = useState('barber')
  const [staffSaving, setStaffSaving] = useState(false)

  const [showAddService, setShowAddService] = useState(false)
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('')
  const [newServiceDuration, setNewServiceDuration] = useState('30')
  const [serviceSaving, setServiceSaving] = useState(false)

  const [settingsName, setSettingsName] = useState('')
  const [settingsSlug, setSettingsSlug] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState('')

  useEffect(() => {
    setHasCopiedLink(!!localStorage.getItem(COPIED_LINK_KEY))
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: orgData } = await supabase.from('organizations').select('*').eq('owner_id', user.id).single()
      if (!orgData) { router.push('/onboarding'); return }
      setOrg(orgData)
      setSettingsName(orgData.name)
      setSettingsSlug(orgData.slug)
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

  const showToast = useCallback((msg: string) => setToast(msg), [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(bookingUrl)
      localStorage.setItem(COPIED_LINK_KEY, '1')
      setHasCopiedLink(true)
      showToast('Link copied!')
    } catch { showToast('Copied!') }
  }

  async function handleAddStaff() {
    if (!newStaffName.trim() || !org) return
    setStaffSaving(true)
    await supabase.from('staff').insert({ org_id: org.id, name: newStaffName.trim(), role: newStaffRole })
    const { data } = await supabase.from('staff').select('*').eq('org_id', org.id).eq('is_active', true)
    setStaff(data || [])
    setNewStaffName(''); setNewStaffRole('barber'); setShowAddStaff(false); setStaffSaving(false)
    showToast('Staff member added!')
  }

  async function handleAddService() {
    if (!newServiceName.trim() || !newServicePrice || !org) return
    setServiceSaving(true)
    const price_cents = Math.round(parseFloat(newServicePrice) * 100)
    await supabase.from('services').insert({ org_id: org.id, name: newServiceName.trim(), price_cents, duration_min: parseInt(newServiceDuration), is_active: true })
    const { data } = await supabase.from('services').select('*').eq('org_id', org.id).eq('is_active', true)
    setServices(data || [])
    setNewServiceName(''); setNewServicePrice(''); setNewServiceDuration('30'); setShowAddService(false); setServiceSaving(false)
    showToast('Service added!')
  }

  async function handleSaveSettings() {
    if (!org || !settingsName.trim() || !settingsSlug.trim()) return
    setSettingsSaving(true); setSettingsError('')
    const slug = generateSlug(settingsSlug)
    const { error } = await supabase.from('organizations').update({ name: settingsName.trim(), slug }).eq('id', org.id)
    if (error) { setSettingsError(error.message.includes('unique') ? 'This URL is already taken. Try another.' : error.message); setSettingsSaving(false); return }
    setOrg(prev => prev ? { ...prev, name: settingsName.trim(), slug } : prev)
    setSettingsSlug(slug); setSettingsSaving(false)
    showToast('Settings saved!')
  }

  async function handleLogout() { await supabase.auth.signOut(); router.push('/') }

  function trialDaysLeft() {
    if (!org?.trial_ends_at) return null
    const diff = new Date(org.trial_ends_at).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / 86400000))
  }

  const days = trialDaysLeft()
  const bookingUrl = `${APP_URL}/salon/${org?.slug}`
  const hasService = services.length > 0
  const hasStaff = staff.length > 0
  const checklistAllDone = hasService && hasStaff && hasCopiedLink

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0F0A00] flex items-center justify-center">
        <div className="text-[#C9A84C] text-lg font-serif">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0F0A00] text-white">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <TrialBanner />

      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0F0A00]/95 backdrop-blur z-40">
        <div className="flex items-center gap-3">
          <span className="font-serif text-[#C9A84C] text-lg">✂ Noble</span>
          <span className="text-white/20">|</span>
          <span className="text-white/70 text-sm font-medium">{org?.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] px-2 py-1 rounded capitalize">{org?.plan_id} plan</span>
          <button onClick={handleLogout} className="text-sm text-white/40 hover:text-white transition">Sign out</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-lg p-1 w-fit overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded text-sm font-medium transition capitalize whitespace-nowrap ${activeTab === tab ? 'bg-[#C9A84C] text-black' : 'text-white/50 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {!checklistAllDone && (
              <OnboardingChecklist
                hasService={hasService} hasStaff={hasStaff} hasCopiedLink={hasCopiedLink}
                onAddService={() => { setActiveTab('services'); setShowAddService(true) }}
                onAddStaff={() => { setActiveTab('staff'); setShowAddStaff(true) }}
                onCopyLink={handleCopy}
              />
            )}
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
              <h3 className="font-semibold mb-1">Your booking page</h3>
              <p className="text-white/40 text-xs mb-3">Share this link with clients so they can book online.</p>
              <div className="flex items-center gap-3">
                <code className="bg-black/30 px-3 py-2 rounded text-[#C9A84C] text-sm flex-1 break-all select-all">{bookingUrl}</code>
                <button onClick={handleCopy} aria-label="Copy booking link" className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition whitespace-nowrap min-h-[36px]">Copy link</button>
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer" aria-label="Open booking page in new tab" className="border border-white/20 text-white/60 px-4 py-2 rounded text-sm hover:border-white/40 hover:text-white transition whitespace-nowrap min-h-[36px] flex items-center">Open ↗</a>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Quick actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: '📅 Calendar', action: () => setActiveTab('calendar') },
                  { label: '+ Add staff', action: () => { setActiveTab('staff'); setShowAddStaff(true) } },
                  { label: '+ Add service', action: () => { setActiveTab('services'); setShowAddService(true) } },
                  { label: '⚙ Settings', action: () => setActiveTab('settings') },
                ].map(a => (
                  <button key={a.label} onClick={a.action} className="border border-white/20 text-white/70 px-4 py-3 rounded text-sm hover:border-white/40 hover:text-white transition">{a.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Calendar ── */}
        {activeTab === 'calendar' && org && (
          <BookingCalendar
            orgId={org.id}
            orgTimezone={org.timezone || 'America/New_York'}
            staff={staff}
          />
        )}

        {/* ── Staff ── */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Staff members</h2>
              <button onClick={() => setShowAddStaff(true)} className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition">+ Add staff</button>
            </div>
            {showAddStaff && (
              <div className="bg-white/5 border border-[#C9A84C]/30 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#C9A84C]">New staff member</h3>
                <input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]" placeholder="Full name" />
                <select value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]">
                  <option value="barber">Barber</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={handleAddStaff} disabled={staffSaving || !newStaffName.trim()} className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition disabled:opacity-40">{staffSaving ? 'Saving...' : 'Add'}</button>
                  <button onClick={() => setShowAddStaff(false)} className="border border-white/20 text-white/60 text-sm px-4 py-2 rounded hover:border-white/40 transition">Cancel</button>
                </div>
              </div>
            )}
            {staff.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-white/40">No staff members yet. Add your first barber!</div>
            ) : (
              <div className="space-y-2">
                {staff.map(s => (
                  <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div><div className="font-medium">{s.name}</div><div className="text-white/40 text-xs capitalize">{s.role}</div></div>
                    <span className="text-xs bg-green-500/10 border border-green-500/30 text-green-400 px-2 py-1 rounded">Active</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Services ── */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Services</h2>
              <button onClick={() => setShowAddService(true)} className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition">+ Add service</button>
            </div>
            {showAddService && (
              <div className="bg-white/5 border border-[#C9A84C]/30 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#C9A84C]">New service</h3>
                <input value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]" placeholder="Service name (e.g. Haircut)" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Price ($)</label>
                    <input value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} type="number" min="0" step="0.01" className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]" placeholder="25" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Duration (min)</label>
                    <select value={newServiceDuration} onChange={e => setNewServiceDuration(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]">
                      {[15, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} min</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddService} disabled={serviceSaving || !newServiceName.trim() || !newServicePrice} className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition disabled:opacity-40">{serviceSaving ? 'Saving...' : 'Add'}</button>
                  <button onClick={() => setShowAddService(false)} className="border border-white/20 text-white/60 text-sm px-4 py-2 rounded hover:border-white/40 transition">Cancel</button>
                </div>
              </div>
            )}
            {services.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-white/40">No services yet. Add your first service so clients can book!</div>
            ) : (
              <div className="space-y-2">
                {services.map(s => (
                  <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div><div className="font-medium">{s.name}</div><div className="text-white/40 text-xs">{s.duration_min} min</div></div>
                    <span className="text-[#C9A84C] font-semibold">${(s.price_cents / 100).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Settings ── */}
        {activeTab === 'settings' && (
          <div className="space-y-4 max-w-md">
            <h2 className="font-semibold text-lg">Salon settings</h2>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div>
                <label htmlFor="settings-name" className="text-sm text-white/60 mb-1 block">Salon name</label>
                <input id="settings-name" value={settingsName} onChange={e => { setSettingsName(e.target.value); setSettingsSlug(generateSlug(e.target.value)) }} className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]" />
              </div>
              <div>
                <label htmlFor="settings-slug" className="text-sm text-white/60 mb-1 block">Booking URL</label>
                <div className="flex items-center bg-white/10 border border-white/20 rounded overflow-hidden focus-within:border-[#C9A84C]">
                  <span className="text-white/30 text-xs px-3 py-2 border-r border-white/10 whitespace-nowrap">noblelink.app/salon/</span>
                  <input id="settings-slug" value={settingsSlug} onChange={e => setSettingsSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))} className="flex-1 bg-transparent px-3 py-2 text-white text-sm outline-none font-mono" />
                </div>
                <p className="text-white/30 text-xs mt-1">Changing this will break existing links shared with clients.</p>
              </div>
              {settingsError && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{settingsError}</div>}
              <button onClick={handleSaveSettings} disabled={settingsSaving || !settingsName.trim() || !settingsSlug.trim()} className="bg-[#C9A84C] text-black font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition text-sm disabled:opacity-50">{settingsSaving ? 'Saving...' : 'Save changes'}</button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-3">Subscription</h3>
              <p className="text-white/50 text-sm mb-4">Current plan: <span className="text-white capitalize">{org?.plan_id}</span> · Status: <span className="text-white capitalize">{org?.sub_status}</span></p>
              <Link href="/billing" className="bg-[#C9A84C] text-black font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition text-sm">Manage billing →</Link>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
