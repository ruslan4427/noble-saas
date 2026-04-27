'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 15,
    yearly: 150,
    desc: 'Perfect for small salons',
    max_staff: '5 staff',
    features: [
      'Online booking page',
      'Up to 5 staff members',
      'Calendar & reschedule',
      'Email notifications',
      'Custom subdomain',
    ],
    notIncluded: ['SMS reminders', 'Analytics', 'Google Calendar'],
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 39,
    yearly: 390,
    desc: 'For growing shops with a team',
    max_staff: '5 staff',
    features: [
      'Everything in Starter',
      'Up to 5 staff members',
      'SMS reminders (Twilio)',
      'Booking analytics',
      'Priority support',
    ],
    notIncluded: ['Google Calendar'],
    highlight: true,
  },
  {
    id: 'business',
    name: 'Business',
    monthly: 79,
    yearly: 790,
    desc: 'For multi-chair salons',
    max_staff: 'Unlimited staff',
    features: [
      'Everything in Pro',
      'Unlimited staff members',
      'Advanced analytics',
      'Google Calendar sync',
      'Dedicated support',
    ],
    notIncluded: [],
    highlight: false,
  },
]

export default function Pricing() {
  const [yearly, setYearly] = useState(false)

  return (
    <main className="min-h-screen bg-[#0F0A00] text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="font-serif text-xl text-[#C9A84C]">✂ Noble</Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition">Log in</Link>
          <Link href="/signup" className="bg-[#C9A84C] text-black text-sm font-semibold px-4 py-2 rounded hover:bg-[#e8d08a] transition">
            Start free trial →
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="text-center px-6 py-16">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Simple, transparent pricing</h1>
        <p className="text-white/50 text-lg mb-8">Start with a 14-day free trial. No credit card required.</p>

        {/* Toggle */}
        <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2">
          <span className={`text-sm ${!yearly ? 'text-white' : 'text-white/40'}`}>Monthly</span>
          <button
            onClick={() => setYearly(y => !y)}
            className={`relative w-10 h-5 rounded-full transition-colors ${yearly ? 'bg-[#C9A84C]' : 'bg-white/20'}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${yearly ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm ${yearly ? 'text-white' : 'text-white/40'}`}>
            Yearly <span className="text-[#C9A84C] text-xs font-semibold">−17%</span>
          </span>
        </div>
      </section>

      {/* Plans */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div key={plan.id} className={`rounded-xl p-6 border flex flex-col ${plan.highlight ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-white/10 bg-white/5'}`}>
              {plan.highlight && (
                <div className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-3">⭐ Most popular</div>
              )}
              <div className="mb-4">
                <div className="text-xl font-bold mb-1">{plan.name}</div>
                <div className="text-white/50 text-sm mb-3">{plan.desc}</div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">${yearly ? Math.round(plan.yearly / 12) : plan.monthly}</span>
                  <span className="text-white/40 text-sm mb-1">/mo</span>
                </div>
                {yearly && <div className="text-[#C9A84C] text-xs mt-1">Billed ${plan.yearly}/year</div>}
              </div>

              <Link href="/signup"
                className={`w-full text-center py-2 rounded font-semibold text-sm mb-6 transition ${plan.highlight ? 'bg-[#C9A84C] text-black hover:bg-[#e8d08a]' : 'border border-white/20 text-white hover:border-white/40'}`}>
                Start free trial →
              </Link>

              <div className="text-xs text-white/40 uppercase tracking-wider mb-3">{plan.max_staff}</div>

              <ul className="space-y-2 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="text-[#C9A84C] mt-0.5">✓</span> {f}
                  </li>
                ))}
                {plan.notIncluded.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/25">
                    <span className="mt-0.5">✕</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-serif font-bold mb-8">Frequently asked questions</h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            {[
              { q: 'Do I need a credit card to start?', a: 'No. Your 14-day free trial starts immediately with no payment required.' },
              { q: 'Can I change plans later?', a: 'Yes, upgrade or downgrade at any time. Changes take effect immediately.' },
              { q: 'What happens after the trial?', a: 'You\'ll be prompted to choose a plan. Your data is never deleted.' },
              { q: 'Is there a contract?', a: 'No contracts. Cancel anytime from your billing dashboard.' },
            ].map(item => (
              <div key={item.q} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="font-semibold text-white mb-2">{item.q}</div>
                <div className="text-white/50 text-sm leading-relaxed">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
