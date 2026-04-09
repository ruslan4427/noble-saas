'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Org {
  id: string
  name: string
  plan_id: string
  sub_status: string
  trial_ends_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

const PLANS = [
  { id: 'starter', name: 'Starter', price: 19, desc: 'Up to 2 staff', features: ['Online booking', 'Up to 2 staff', 'Email notifications'], highlight: false },
  { id: 'pro', name: 'Pro', price: 39, desc: 'Up to 5 staff', features: ['Everything in Starter', 'SMS reminders', 'Analytics'], highlight: true },
  { id: 'business', name: 'Business', price: 79, desc: 'Unlimited staff', features: ['Everything in Pro', 'Google Calendar', 'Priority support'], highlight: false },
]

function BillingContent() {
  const [org, setOrg] = useState<Org | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
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
      setOrg(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleCheckout(planId: string) {
    setCheckoutLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    const diff = new Date(org.trial_ends_at).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / 86400000))
  }

  const days = trialDaysLeft()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-[#C9A84C] font-serif text-lg">Loading...</div></div>
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {reason === 'trial_expired' && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-8">
          ⚠️ Your free trial has expired. Choose a plan to continue.
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl mb-8">
          ✓ Payment successful! Your plan is now active.
        </div>
      )}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="font-semibold mb-4">Current subscription</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Plan', value: org?.plan_id },
            { label: 'Status', value: org?.sub_status },
            { label: 'Trial days left', value: days ?? '—' },
            { label: 'Auto-renews', value: org?.stripe_subscription_id ? 'Yes' : 'No' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-white/40 text-xs mb-1">{s.label}</div>
              <div className="font-semibold capitalize">{String(s.value)}</div>
            </div>
          ))}
        </div>
      </div>
      <h2 className="font-semibold text-xl mb-6">Choose a plan</h2>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {PLANS.map(plan => {
          const isCurrent = org?.plan_id === plan.id && org?.sub_status === 'active'
          return (
            <div key={plan.id} className={`rounded-xl p-6 border flex flex-col ${plan.highlight ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-white/10 bg-white/5'}`}>
              {plan.highlight && <div className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-3">Most popular</div>}
              <div className="text-xl font-bold mb-1">{plan.name}</div>
              <div className="text-white/50 text-sm mb-3">{plan.desc}</div>
              <div className="text-3xl font-bold mb-4">${plan.price}<span className="text-sm font-normal text-white/40">/mo</span></div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <span className="text-[#C9A84C]">✓</span> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="w-full text-center py-2 rounded text-sm border border-green-500/30 text-green-400">✓ Current plan</div>
              ) : (
                <button onClick={() => handleCheckout(plan.id)} disabled={!!checkoutLoading}
                  className={`w-full py-2 rounded font-semibold text-sm transition ${plan.highlight ? 'bg-[#C9A84C] text-black hover:bg-[#e8d08a]' : 'border border-white/20 text-white hover:border-white/40'} disabled:opacity-40`}>
                  {checkoutLoading === plan.id ? 'Loading...' : `Upgrade to ${plan.name} →`}
                </button>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-white/30 text-xs text-center">Payments secured by Stripe. Cancel anytime.</p>
    </div>
  )
}

export default function Billing() {
  return (
    <main className="min-h-screen bg-[#0F0A00] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0F0A00]/95 backdrop-blur z-50">
        <Link href="/dashboard" className="font-serif text-[#C9A84C] text-lg">✂ Noble</Link>
        <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition">← Back to dashboard</Link>
      </nav>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-[#C9A84C]">Loading...</div></div>}>
        <BillingContent />
      </Suspense>
    </main>
  )
}
