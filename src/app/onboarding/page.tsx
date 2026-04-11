'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const STEPS = ['Salon name', 'Category', 'Timezone', 'First staff', 'Working hours', 'Preview']
const CATEGORIES = ['Barbershop', 'Hair salon', 'Nail salon', 'Spa & wellness', 'Tattoo studio', 'Other']
const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
]

const TZ_LABELS: Record<string, string> = {
  'America/New_York': 'New York (ET)',
  'America/Chicago': 'Chicago (CT)',
  'America/Denver': 'Denver (MT)',
  'America/Los_Angeles': 'Los Angeles (PT)',
  'America/Phoenix': 'Phoenix (AZ)',
  'America/Anchorage': 'Anchorage (AKT)',
  'Pacific/Honolulu': 'Honolulu (HT)',
}

const APP_URL = 'https://www.noblelink.app'

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [data, setData] = useState({
    name: '',
    slug: '',
    category: '',
    timezone: 'America/New_York',
    staffName: '',
    staffRole: 'barber',
    open: '09:00',
    close: '19:00',
  })

  function update(field: string, value: string) {
    setData(d => ({ ...d, [field]: value }))
    if (field === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 24)
      setData(d => ({ ...d, name: value, slug }))
    }
  }

  async function handleFinish() {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { error: orgError } = await supabase.from('organizations').insert({
        slug: data.slug,
        name: data.name,
        owner_id: user.id,
        timezone: data.timezone,
        business_category: data.category,
      })
      if (orgError) throw orgError

      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', data.slug)
        .single()

      if (org && data.staffName) {
        await supabase.from('staff').insert({
          org_id: org.id,
          name: data.staffName,
          role: data.staffRole,
        })
        await supabase.from('onboarding_progress').update({
          step_salon_name: true,
          step_category: true,
          step_timezone: true,
          step_first_staff: true,
          step_working_hours: true,
          step_preview: true,
          completed_at: new Date().toISOString(),
        }).eq('org_id', org.id)
      }

      router.push('/dashboard')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const canNext = () => {
    if (step === 0) return data.name.length >= 2 && data.slug.length >= 2
    if (step === 1) return data.category !== ''
    if (step === 3) return data.staffName.length >= 2
    return true
  }

  return (
    <main className="min-h-screen bg-[#0F0A00] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-serif text-2xl text-[#C9A84C] mb-2">✂ Noble</div>
          <p className="text-white/50 text-sm">Set up your salon — step {step + 1} of {STEPS.length}</p>
        </div>

        <div className="flex gap-1 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= step ? 'bg-[#C9A84C]' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">{STEPS[step]}</h2>
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded mb-4">{error}</div>}

          {/* Step 0 — Salon name */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Salon name</label>
                <input value={data.name} onChange={e => update('name', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]"
                  placeholder="Noble Barbershop" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Your URL</label>
                <div className="flex items-center bg-white/10 border border-white/20 rounded overflow-hidden">
                  <span className="text-white/40 text-sm px-3 py-2 border-r border-white/20">noblelink.app/salon/</span>
                  <input value={data.slug} onChange={e => update('slug', e.target.value)}
                    className="flex-1 bg-transparent px-3 py-2 text-white text-sm outline-none font-mono"
                    placeholder="my-salon" />
                </div>
              </div>
            </div>
          )}

          {/* Step 1 — Category */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => update('category', cat)}
                  className={`px-3 py-3 rounded text-sm border transition ${data.category === cat ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]' : 'border-white/20 text-white/60 hover:border-white/40'}`}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Step 2 — Timezone */}
          {step === 2 && (
            <div className="space-y-2">
              {TIMEZONES.map(tz => (
                <button key={tz} onClick={() => update('timezone', tz)}
                  className={`w-full text-left px-3 py-3 rounded text-sm border transition ${data.timezone === tz ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]' : 'border-white/20 text-white/60 hover:border-white/40'}`}>
                  {TZ_LABELS[tz] ?? tz}
                </button>
              ))}
            </div>
          )}

          {/* Step 3 — First staff */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Staff name</label>
                <input value={data.staffName} onChange={e => update('staffName', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]"
                  placeholder="John Smith" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Role</label>
                <select value={data.staffRole} onChange={e => update('staffRole', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]">
                  <option value="barber">Barber</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4 — Working hours */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Opens at</label>
                  <input type="time" value={data.open} onChange={e => update('open', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]" />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Closes at</label>
                  <input type="time" value={data.close} onChange={e => update('close', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]" />
                </div>
              </div>
              <p className="text-white/40 text-xs">You can customize days and hours later in settings.</p>
            </div>
          )}

          {/* Step 5 — Preview */}
          {step === 5 && (
            <div className="text-center py-4 space-y-3">
              <div className="text-4xl mb-2">✂</div>
              <div className="text-white font-semibold text-lg">{data.name}</div>
              <div className="text-white/50 text-sm">{data.category} · {TZ_LABELS[data.timezone] ?? data.timezone}</div>
              <div className="text-white/50 text-sm">Hours: {data.open} – {data.close}</div>
              <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded px-3 py-2 text-[#C9A84C] text-sm font-mono">
                noblelink.app/salon/{data.slug}
              </div>
              <p className="text-white/30 text-xs mt-2">Your 14-day free trial starts now.</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 border border-white/20 text-white/60 py-2 rounded hover:border-white/40 transition text-sm">
              ← Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="flex-1 bg-[#C9A84C] text-black font-bold py-2 rounded hover:bg-[#e8d08a] transition disabled:opacity-40 text-sm">
              Continue →
            </button>
          ) : (
            <button onClick={handleFinish} disabled={loading}
              className="flex-1 bg-[#C9A84C] text-black font-bold py-2 rounded hover:bg-[#e8d08a] transition disabled:opacity-40 text-sm">
              {loading ? 'Creating...' : 'Launch my salon →'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
