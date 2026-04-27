'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TrialBanner from '@/components/TrialBanner'
import LangToggle, { type Lang } from '@/components/LangToggle'

interface Org { id: string; name: string; plan_id: string }

const T = {
  en: {
    loading: 'Loading...', back: '← Dashboard', title: 'Analytics',
    noAccessTitle: 'Analytics is a Pro feature',
    noAccessSub: 'Upgrade to Pro or Business to access detailed analytics.',
    upgrade: 'Upgrade to Pro →',
    stats: ['Total bookings', 'This month', 'Revenue est.', 'Avg booking value'],
    vsLastMonth: 'vs last month',
    bookingsMonth: 'Bookings this month',
  },
  es: {
    loading: 'Cargando...', back: '← Panel', title: 'Analíticas',
    noAccessTitle: 'Las analíticas son una función Pro',
    noAccessSub: 'Mejora a Pro o Business para acceder a analíticas detalladas.',
    upgrade: 'Mejorar a Pro →',
    stats: ['Total de reservas', 'Este mes', 'Ingresos est.', 'Valor promedio'],
    vsLastMonth: 'vs mes anterior',
    bookingsMonth: 'Reservas este mes',
  },
}

export default function Analytics() {
  const [lang, setLang] = useState<Lang>('en')
  const t = T[lang]
  const [org, setOrg] = useState<Org | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: orgData } = await supabase.from('organizations').select('*').eq('owner_id', user.id).single()
      if (!orgData) { router.push('/onboarding'); return }
      setOrg(orgData)
      setHasAccess(['pro', 'business'].includes(orgData.plan_id))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <main className="min-h-screen bg-[#0F0A00] flex items-center justify-center">
      <div className="text-[#C9A84C] font-serif text-lg">{t.loading}</div>
    </main>
  )

  const statValues = ['142', '38', '$2,840', '$74']
  const statChanges = ['+12%', '+8%', '+15%', '']

  return (
    <main className="min-h-screen bg-[#0F0A00] text-white">
      <TrialBanner />
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0F0A00]/95 backdrop-blur z-50">
        <div className="flex items-center gap-3">
          <span className="font-serif text-[#C9A84C] text-lg">✂ Noble</span>
          <span className="text-white/20">|</span>
          <span className="text-white/70 text-sm">{t.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <LangToggle lang={lang} onChange={setLang} />
          <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition">{t.back}</Link>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {!hasAccess ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-2xl font-serif font-bold mb-3">{t.noAccessTitle}</h2>
            <p className="text-white/50 mb-8">{t.noAccessSub}</p>
            <Link href="/billing" className="bg-[#C9A84C] text-black font-bold px-8 py-3 rounded hover:bg-[#e8d08a] transition">
              {t.upgrade}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-2xl font-serif font-bold">{t.title} — {org?.name}</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {t.stats.map((label, i) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-white/40 text-xs mb-1">{label}</div>
                  <div className="text-2xl font-bold text-white">{statValues[i]}</div>
                  {statChanges[i] && <div className="text-green-400 text-xs mt-1">{statChanges[i]} {t.vsLastMonth}</div>}
                </div>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="font-semibold mb-4">{t.bookingsMonth}</h2>
              <div className="flex items-end gap-1 h-32">
                {[12,18,8,22,15,28,20,14,25,18,30,22,16,24,19,28,21,15,26,18,22,30,25,20,18,24,28,22,16,38].map((val, i) => (
                  <div key={i} className="flex-1 bg-[#C9A84C]/60 rounded-t hover:bg-[#C9A84C] transition-colors"
                    style={{ height: `${(val / 38) * 100}%` }} title={`Day ${i+1}: ${val}`} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
