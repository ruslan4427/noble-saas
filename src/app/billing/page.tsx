'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import LangToggle, { type Lang } from '@/components/LangToggle'

interface Org {
  id: string; name: string; plan_id: string; sub_status: string
  trial_ends_at: string | null; stripe_customer_id: string | null; stripe_subscription_id: string | null
}

const T = {
  en: {
    back: '← Back to dashboard',
    trialExpired: '⚠️ Your free trial has expired. Choose a plan to continue.',
    paymentSuccess: '✓ Payment successful! Your plan is now active.',
    cancelSuccess: 'Your subscription has been cancelled. Access continues until the end of the billing period.',
    currentSub: 'Current subscription',
    stats: ['Plan', 'Status', 'Trial days left', 'Auto-renews'],
    yesNo: ['No', 'Yes'],
    choosePlan: 'Choose a plan',
    currentPlan: '✓ Current plan',
    upgrade: (name: string) => `Start ${name} →`,
    cancelSub: 'Cancel subscription',
    cancelConfirm: 'Are you sure you want to cancel? You will keep access until the end of your current billing period.',
    cancelling: 'Cancelling…',
    loading: 'Loading...',
    footer: 'Payments secured by Stripe. Cancel anytime.',
    planDesc: 'Up to 5 staff',
    features: ['Online booking', 'Up to 5 staff', 'Calendar & reschedule', 'Email notifications', 'SMS reminders'],
  },
  es: {
    back: '← Volver al panel',
    trialExpired: '⚠️ Tu prueba gratuita expiró. Elige un plan para continuar.',
    paymentSuccess: '✓ ¡Pago exitoso! Tu plan ya está activo.',
    cancelSuccess: 'Tu suscripción fue cancelada. El acceso continúa hasta el final del período de facturación.',
    currentSub: 'Suscripción actual',
    stats: ['Plan', 'Estado', 'Días de prueba restantes', 'Renovación automática'],
    yesNo: ['No', 'Sí'],
    choosePlan: 'Elige un plan',
    currentPlan: '✓ Plan actual',
    upgrade: (name: string) => `Activar ${name} →`,
    cancelSub: 'Cancelar suscripción',
    cancelConfirm: '¿Seguro que quieres cancelar? Mantendrás el acceso hasta el final de tu período de facturación.',
    cancelling: 'Cancelando…',
    loading: 'Cargando...',
    footer: 'Pagos protegidos por Stripe. Cancela cuando quieras.',
    planDesc: 'Hasta 5 empleados',
    features: ['Reservas online', 'Hasta 5 empleados', 'Calendario y reagendamiento', 'Notificaciones por email', 'Recordatorios SMS'],
  },
}

function BillingContent({ lang }: { lang: Lang }) {
  const t = T[lang]
  const [org, setOrg] = useState<Org | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const reason = searchParams.get('reason')
  const success = searchParams.get('success')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('organizations').select('*').eq('owner_id', user.id).single()
      setOrg(data); setLoading(false)
    }
    load()
  }, [])

  async function handleCancel() {
    if (!window.confirm(t.cancelConfirm)) return
    setCancelling(true)
    try {
      await fetch('/api/stripe/cancel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: org?.id }),
      })
      setCancelled(true)
      setOrg(prev => prev ? { ...prev, sub_status: 'canceled' } : prev)
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  async function handleCheckout(planId: string) {
    setCheckoutLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: org?.id, plan: planId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else throw new Error(data.error)
    } catch {
      alert('Something went wrong. Please try again.')
      setCheckoutLoading(null)
    }
  }

  function trialDaysLeft() {
    if (!org?.trial_ends_at) return null
    return Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000))
  }

  const days = trialDaysLeft()
  const isCurrent = org?.plan_id === 'starter' && org?.sub_status === 'active'

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-[#C9A84C] font-serif text-lg">{t.loading}</div></div>

  return (
    <div className="max-w-lg mx-auto px-4 md:px-6 py-8 md:py-12">
      {reason === 'trial_expired' && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-8">{t.trialExpired}</div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl mb-8">{t.paymentSuccess}</div>
      )}
      {cancelled && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-xl mb-8">{t.cancelSuccess}</div>
      )}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="font-semibold mb-4">{t.currentSub}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {[
            { label: t.stats[0], value: org?.plan_id },
            { label: t.stats[1], value: org?.sub_status },
            { label: t.stats[2], value: days ?? '—' },
            { label: t.stats[3], value: org?.stripe_subscription_id ? t.yesNo[1] : t.yesNo[0] },
          ].map(s => (
            <div key={s.label}>
              <div className="text-white/40 text-xs mb-1">{s.label}</div>
              <div className="font-semibold capitalize">{String(s.value)}</div>
            </div>
          ))}
        </div>
      </div>
      <h2 className="font-semibold text-xl mb-6">{t.choosePlan}</h2>
      <div className="rounded-xl p-6 border border-[#C9A84C] bg-[#C9A84C]/5 flex flex-col mb-8">
        <div className="text-xl font-bold mb-1">Starter</div>
        <div className="text-white/50 text-sm mb-3">{t.planDesc}</div>
        <div className="text-3xl font-bold mb-4">$15<span className="text-sm font-normal text-white/40">/mo</span></div>
        <ul className="space-y-2 mb-6 flex-1">
          {t.features.map(f => (
            <li key={f} className="flex items-center gap-2 text-sm text-white/70">
              <span className="text-[#C9A84C]">✓</span> {f}
            </li>
          ))}
        </ul>
        {isCurrent ? (
          <div className="w-full text-center py-2 rounded text-sm border border-green-500/30 text-green-400">{t.currentPlan}</div>
        ) : (
          <button onClick={() => handleCheckout('starter')} disabled={!!checkoutLoading}
            className="w-full py-2 rounded font-semibold text-sm bg-[#C9A84C] text-black hover:bg-[#e8d08a] transition disabled:opacity-40">
            {checkoutLoading === 'starter' ? '...' : t.upgrade('Starter')}
          </button>
        )}
      </div>
      {org?.stripe_subscription_id && ['active', 'trialing'].includes(org?.sub_status) && !cancelled && (
        <div className="mt-4 mb-6 text-center">
          <button onClick={handleCancel} disabled={cancelling}
            className="text-sm text-white/30 hover:text-red-400 transition underline underline-offset-2 disabled:opacity-40">
            {cancelling ? t.cancelling : t.cancelSub}
          </button>
        </div>
      )}
      <p className="text-white/30 text-xs text-center">{t.footer}</p>
    </div>
  )
}

export default function Billing() {
  const [lang, setLang] = useState<Lang>('en')
  const t = T[lang]
  return (
    <main className="min-h-screen bg-[#0F0A00] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0F0A00]/95 backdrop-blur z-50">
        <Link href="/dashboard" className="font-serif text-[#C9A84C] text-lg">✂ Noble</Link>
        <div className="flex items-center gap-4">
          <LangToggle lang={lang} onChange={setLang} />
          <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition">{t.back}</Link>
        </div>
      </nav>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-[#C9A84C]">...</div></div>}>
        <BillingContent lang={lang} />
      </Suspense>
    </main>
  )
}
