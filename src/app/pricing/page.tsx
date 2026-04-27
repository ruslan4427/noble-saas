'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import LangToggle, { type Lang } from '@/components/LangToggle'

const T = {
  en: {
    title: 'Simple, transparent pricing',
    sub: 'Start with a 14-day free trial. No credit card required.',
    monthly: 'Monthly', yearly: 'Yearly',
    everythingIncluded: 'Everything included',
    planName: 'Starter', planDesc: 'Perfect for small salons',
    cta: 'Start free trial →',
    staffNote: '5 staff · Unlimited bookings',
    fine: '14-day free trial · No credit card required · Cancel anytime',
    features: ['Online booking page', 'Up to 5 staff members', 'Calendar & reschedule', 'Email notifications', 'SMS reminders', 'Custom subdomain'],
    faq: [
      { q: 'Do I need a credit card to start?', a: 'No. Your 14-day free trial starts immediately with no payment required.' },
      { q: 'What happens after the trial?', a: "You'll be charged $15/month. Your data is never deleted if you cancel." },
      { q: 'Is there a contract?', a: 'No contracts. Cancel anytime from your billing dashboard.' },
    ],
    login: 'Log in',
  },
  es: {
    title: 'Precios simples y transparentes',
    sub: 'Comienza con una prueba gratuita de 14 días. Sin tarjeta de crédito.',
    monthly: 'Mensual', yearly: 'Anual',
    everythingIncluded: 'Todo incluido',
    planName: 'Starter', planDesc: 'Perfecto para salones pequeños',
    cta: 'Prueba gratis →',
    staffNote: '5 empleados · Reservas ilimitadas',
    fine: 'Prueba de 14 días · Sin tarjeta de crédito · Cancela cuando quieras',
    features: ['Página de reservas online', 'Hasta 5 empleados', 'Calendario y reagendamiento', 'Notificaciones por email', 'Recordatorios SMS', 'Subdominio personalizado'],
    faq: [
      { q: '¿Necesito tarjeta de crédito para empezar?', a: 'No. Tu prueba gratuita de 14 días comienza de inmediato sin pago.' },
      { q: '¿Qué pasa después de la prueba?', a: 'Se te cobrará $15/mes. Tus datos nunca se eliminan si cancelas.' },
      { q: '¿Hay contrato?', a: 'Sin contratos. Cancela cuando quieras desde tu panel de facturación.' },
    ],
    login: 'Iniciar sesión',
  },
}

export default function Pricing() {
  const [lang, setLang] = useState<Lang>('en')
  const t = T[lang]
  const [yearly, setYearly] = useState(false)

  return (
    <main className="min-h-screen bg-[#0F0A00] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="font-serif text-xl text-[#C9A84C]">✂ Noble</Link>
        <div className="flex items-center gap-4">
          <LangToggle lang={lang} onChange={setLang} />
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition">{t.login}</Link>
          <Link href="/signup" className="bg-[#C9A84C] text-black text-sm font-semibold px-4 py-2 rounded hover:bg-[#e8d08a] transition">
            {t.cta}
          </Link>
        </div>
      </nav>

      <section className="text-center px-6 py-16">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{t.title}</h1>
        <p className="text-white/50 text-lg mb-8">{t.sub}</p>
        <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2">
          <span className={`text-sm ${!yearly ? 'text-white' : 'text-white/40'}`}>{t.monthly}</span>
          <button onClick={() => setYearly(y => !y)} className={`relative w-10 h-5 rounded-full transition-colors ${yearly ? 'bg-[#C9A84C]' : 'bg-white/20'}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${yearly ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm ${yearly ? 'text-white' : 'text-white/40'}`}>
            {t.yearly} <span className="text-[#C9A84C] text-xs font-semibold">−17%</span>
          </span>
        </div>
      </section>

      <section className="px-6 pb-20 max-w-sm mx-auto">
        <div className="rounded-xl p-8 border border-[#C9A84C] bg-[#C9A84C]/5 flex flex-col">
          <div className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-4">{t.everythingIncluded}</div>
          <div className="mb-2">
            <div className="text-2xl font-bold mb-1">{t.planName}</div>
            <div className="text-white/50 text-sm mb-4">{t.planDesc}</div>
            <div className="flex items-end gap-1">
              <span className="text-5xl font-bold">${yearly ? 12 : 15}</span>
              <span className="text-white/40 text-sm mb-1">/mo</span>
            </div>
            {yearly && <div className="text-[#C9A84C] text-xs mt-1">Billed $150/year</div>}
          </div>
          <Link href="/signup" className="w-full text-center bg-[#C9A84C] text-black font-bold py-3 rounded-xl mt-6 mb-8 hover:bg-[#e8d08a] transition shadow-lg shadow-[#C9A84C]/20">
            {t.cta}
          </Link>
          <div className="text-xs text-white/40 uppercase tracking-wider mb-4">{t.staffNote}</div>
          <ul className="space-y-3 flex-1">
            {t.features.map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-white/80">
                <span className="text-[#C9A84C] font-bold">✓</span> {f}
              </li>
            ))}
          </ul>
          <p className="text-white/20 text-xs text-center mt-8">{t.fine}</p>
        </div>

        <div className="mt-12 space-y-4">
          {t.faq.map(item => (
            <div key={item.q} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="font-semibold text-white text-sm mb-2">{item.q}</div>
              <div className="text-white/50 text-sm leading-relaxed">{item.a}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
