'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import TimePicker from '@/components/TimePicker'
import LangToggle, { type Lang } from '@/components/LangToggle'

const CATEGORIES_EN = ['Barbershop', 'Hair salon', 'Nail salon', 'Spa & wellness', 'Tattoo studio', 'Other']
const CATEGORIES_ES = ['Barbería', 'Salón de cabello', 'Salón de uñas', 'Spa & bienestar', 'Estudio de tatuajes', 'Otro']

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
]
const TZ_LABELS: Record<string, string> = {
  'America/New_York': 'New York (ET)', 'America/Chicago': 'Chicago (CT)',
  'America/Denver': 'Denver (MT)', 'America/Los_Angeles': 'Los Angeles (PT)',
  'America/Phoenix': 'Phoenix (AZ)', 'America/Anchorage': 'Anchorage (AKT)',
  'Pacific/Honolulu': 'Honolulu (HT)',
}

const T = {
  en: {
    stepOf: (s: number, total: number) => `Set up your salon — step ${s} of ${total}`,
    steps: ['Salon name', 'Category', 'Timezone', 'Your profile', 'Working hours', 'Preview'],
    salonName: 'Salon name', salonPh: 'Noble Barbershop',
    bookingUrl: 'Your booking URL',
    category: 'Category',
    timezone: 'Timezone',
    profileNote: 'This is the manager account that controls the dashboard. Barbers are added separately after setup.',
    yourName: 'Your name', namePh: 'John Smith',
    opensAt: 'Opens at', closesAt: 'Closes at',
    hoursNote: 'You can customize per-staff schedules later in the dashboard.',
    trialNote: 'Your 14-day free trial starts now.',
    back: '← Back', next: 'Continue →', finish: 'Launch my salon →', finishing: 'Creating...',
    preview: (name: string, cat: string, tz: string, open: string, close: string) => ({
      name, cat, tz: TZ_LABELS[tz] ?? tz, hours: `${open} – ${close}`, manager: 'Manager',
    }),
  },
  es: {
    stepOf: (s: number, total: number) => `Configura tu salón — paso ${s} de ${total}`,
    steps: ['Nombre del salón', 'Categoría', 'Zona horaria', 'Tu perfil', 'Horario', 'Vista previa'],
    salonName: 'Nombre del salón', salonPh: 'Mi Barbería',
    bookingUrl: 'Tu URL de reservas',
    category: 'Categoría',
    timezone: 'Zona horaria',
    profileNote: 'Esta es la cuenta de manager que controla el panel. Los barberos se agregan después.',
    yourName: 'Tu nombre', namePh: 'Juan García',
    opensAt: 'Abre a las', closesAt: 'Cierra a las',
    hoursNote: 'Puedes personalizar los horarios por empleado más tarde en el panel.',
    trialNote: 'Tu prueba gratuita de 14 días comienza ahora.',
    back: '← Atrás', next: 'Continuar →', finish: 'Lanzar mi salón →', finishing: 'Creando...',
    preview: (name: string, cat: string, tz: string, open: string, close: string) => ({
      name, cat, tz: TZ_LABELS[tz] ?? tz, hours: `${open} – ${close}`, manager: 'Manager',
    }),
  },
}

export default function Onboarding() {
  const [lang, setLang] = useState<Lang>('en')
  const t = T[lang]
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [data, setData] = useState({
    name: '', slug: '', category: '',
    timezone: 'America/New_York',
    ownerName: '', open: '09:00', close: '19:00',
  })

  const categories = lang === 'es' ? CATEGORIES_ES : CATEGORIES_EN

  function update(field: string, value: string) {
    setData(d => ({ ...d, [field]: value }))
    if (field === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 24)
      setData(d => ({ ...d, name: value, slug }))
    }
  }

  async function handleFinish() {
    setLoading(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (!user.email_confirmed_at) { router.push('/verify-email'); return }
      const { error: orgError } = await supabase.from('organizations').insert({
        slug: data.slug, name: data.name, owner_id: user.id,
        timezone: data.timezone, business_category: data.category,
        owner_name: data.ownerName.trim() || null,
        work_start: data.open, work_end: data.close,
      })
      if (orgError) throw orgError
      const { data: org } = await supabase.from('organizations').select('id').eq('slug', data.slug).single()
      if (org) {
        await supabase.from('onboarding_progress').update({
          step_salon_name: true, step_category: true, step_timezone: true,
          step_first_staff: true, step_working_hours: true, step_preview: true,
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
    if (step === 3) return data.ownerName.length >= 2
    return true
  }

  const pv = t.preview(data.name, data.category, data.timezone, data.open, data.close)

  return (
    <main className="min-h-screen bg-[#0F0A00] flex items-center justify-center px-4">
      <LangToggle lang={lang} onChange={setLang} fixed />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-serif text-2xl text-[#C9A84C] mb-2">✂ Noble</div>
          <p className="text-white/50 text-sm">{t.stepOf(step + 1, t.steps.length)}</p>
        </div>

        <div className="flex gap-1 mb-8">
          {t.steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= step ? 'bg-[#C9A84C]' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">{t.steps[step]}</h2>
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded mb-4">{error}</div>}

          {step === 0 && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">{t.salonName}</label>
                <input value={data.name} onChange={e => update('name', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]"
                  placeholder={t.salonPh} />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">{t.bookingUrl}</label>
                <div className="flex items-center bg-white/10 border border-white/20 rounded overflow-hidden">
                  <span className="text-white/40 text-sm px-3 py-2 border-r border-white/20">noblelink.app/salon/</span>
                  <input value={data.slug} onChange={e => update('slug', e.target.value)}
                    className="flex-1 bg-transparent px-3 py-2 text-white text-sm outline-none font-mono"
                    placeholder="my-salon" />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categories.map(cat => (
                <button key={cat} onClick={() => update('category', cat)}
                  className={`px-3 py-3 rounded text-sm border transition ${data.category === cat ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]' : 'border-white/20 text-white/60 hover:border-white/40'}`}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2 mt-4">
              {TIMEZONES.map(tz => (
                <button key={tz} onClick={() => update('timezone', tz)}
                  className={`w-full text-left px-3 py-3 rounded text-sm border transition ${data.timezone === tz ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]' : 'border-white/20 text-white/60 hover:border-white/40'}`}>
                  {TZ_LABELS[tz] ?? tz}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="mt-4">
              <p className="text-white/40 text-sm mb-4">{t.profileNote}</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">{t.yourName}</label>
                  <input value={data.ownerName} onChange={e => update('ownerName', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]"
                    placeholder={t.namePh} autoComplete="name" />
                </div>
                <div className="flex items-center gap-3 bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-[#C9A84C] flex items-center justify-center flex-none">
                    <span className="text-black text-sm font-bold">
                      {data.ownerName.trim() ? data.ownerName.trim().split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{data.ownerName.trim() || t.yourName}</p>
                    <p className="text-[#C9A84C] text-xs">Manager</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t.opensAt}</label>
                  <TimePicker value={data.open} onChange={v => update('open', v)} />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t.closesAt}</label>
                  <TimePicker value={data.close} onChange={v => update('close', v)} />
                </div>
              </div>
              <p className="text-white/40 text-xs">{t.hoursNote}</p>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-4 space-y-3 mt-2">
              <div className="text-4xl mb-2">✂</div>
              <div className="text-white font-semibold text-lg">{pv.name}</div>
              <div className="text-white/50 text-sm">{pv.cat} · {pv.tz}</div>
              <div className="text-white/50 text-sm">{t.opensAt}: {pv.hours}</div>
              <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded px-3 py-2 text-[#C9A84C] text-sm font-mono">
                noblelink.app/salon/{data.slug}
              </div>
              {data.ownerName && (
                <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
                  <div className="w-6 h-6 rounded-full bg-[#C9A84C] flex items-center justify-center">
                    <span className="text-black text-[10px] font-bold">{data.ownerName.trim().split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}</span>
                  </div>
                  <span>{data.ownerName} · {pv.manager}</span>
                </div>
              )}
              <p className="text-white/30 text-xs mt-2">{t.trialNote}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 border border-white/20 text-white/60 py-2 rounded hover:border-white/40 transition text-sm">
              {t.back}
            </button>
          )}
          {step < t.steps.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="flex-1 bg-[#C9A84C] text-black font-bold py-2 rounded hover:bg-[#e8d08a] transition disabled:opacity-40 text-sm">
              {t.next}
            </button>
          ) : (
            <button onClick={handleFinish} disabled={loading}
              className="flex-1 bg-[#C9A84C] text-black font-bold py-2 rounded hover:bg-[#e8d08a] transition disabled:opacity-40 text-sm">
              {loading ? t.finishing : t.finish}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
