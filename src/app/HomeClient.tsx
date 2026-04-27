'use client'
import Link from 'next/link'
import { useState } from 'react'

type Lang = 'en' | 'es'

const T = {
  en: {
    nav: { pricing: 'Pricing', login: 'Log in', trial: 'Start free trial →' },
    hero: {
      h1a: 'Your barbershop —',
      h1b: 'online in 5 minutes',
      sub: 'Booking page, staff schedule, client management — all under your own link.',
      cta: 'Create your salon →',
      pricing: 'See pricing',
    },
    steps: {
      title: 'Online in 3 steps',
      items: [
        { step: '01', title: 'Create your salon', desc: 'Sign up, enter your salon name, add staff and services. Takes 5 minutes.' },
        { step: '02', title: 'Share your link', desc: 'Get a unique booking link at noblelink.app/salon/your-name. Share it anywhere.' },
        { step: '03', title: 'Clients book online', desc: 'Clients choose a master, service and time. You get an instant email notification.' },
      ],
    },
    features: {
      title: 'Everything your barbershop needs',
      items: [
        { icon: '📅', title: 'Online booking', desc: 'Clients book 24/7 without calling you. Pick master, service, and time.' },
        { icon: '✂', title: 'Staff management', desc: 'Add barbers with their own schedule. Clients choose who they want.' },
        { icon: '💈', title: 'Services catalog', desc: 'Set service names, prices and durations. Display them on your booking page.' },
        { icon: '📧', title: 'Email notifications', desc: 'Instant email when someone books. Client gets a confirmation too.' },
        { icon: '⏰', title: 'Reminders', desc: 'Automatic email reminder 2 hours before the appointment. Reduce no-shows.' },
        { icon: '🔗', title: 'Your own link', desc: 'Clean booking URL at noblelink.app/salon/your-name. Share on Instagram, WhatsApp.' },
      ],
    },
    testimonials: {
      title: 'Trusted by barbershops',
      items: [
        { name: 'Alex Johnson', salon: 'Sharp Cuts Barbershop', text: 'Set up my booking page in 10 minutes. Now clients book online and I get notified instantly.' },
        { name: 'Maria Garcia', salon: 'Style Studio', text: 'My clients love being able to book anytime. No more back-and-forth messages to schedule appointments.' },
        { name: 'David Kim', salon: 'The Fade Factory', text: 'The reminder emails alone are worth it. No-shows dropped by half since I started using Noble.' },
      ],
    },
    pricing: {
      title: 'Simple pricing',
      sub: '14-day free trial, no credit card required. Cancel anytime.',
      popular: 'Most popular',
      plans: [
        { plan: 'Starter', price: '$19', desc: '1 staff, unlimited bookings' },
        { plan: 'Pro', price: '$39', desc: '5 staff, priority support', highlight: true },
        { plan: 'Business', price: '$79', desc: 'Unlimited staff, custom domain' },
      ],
      cta: 'See full pricing →',
      mo: '/mo',
    },
    cta: {
      title: 'Ready to go online?',
      sub: 'Join barbershops already using Noble. Free trial, no credit card.',
      btn: 'Start free trial →',
    },
    footer: { privacy: 'Privacy Policy', terms: 'Terms & Conditions', legal: 'Legal', copy: `© ${new Date().getFullYear()} Noble. All rights reserved.` },
  },
  es: {
    nav: { pricing: 'Precios', login: 'Iniciar sesión', trial: 'Prueba gratis →' },
    hero: {
      h1a: 'Tu barbería —',
      h1b: 'en línea en 5 minutos',
      sub: 'Página de reservas, horario del personal, gestión de clientes — todo bajo tu propio enlace.',
      cta: 'Crea tu salón →',
      pricing: 'Ver precios',
    },
    steps: {
      title: 'En línea en 3 pasos',
      items: [
        { step: '01', title: 'Crea tu salón', desc: 'Regístrate, ingresa el nombre de tu salón, agrega personal y servicios. Tarda 5 minutos.' },
        { step: '02', title: 'Comparte tu enlace', desc: 'Obtén un enlace único en noblelink.app/salon/tu-nombre. Compártelo en cualquier lugar.' },
        { step: '03', title: 'Clientes reservan en línea', desc: 'Los clientes eligen especialista, servicio y horario. Recibes una notificación instantánea.' },
      ],
    },
    features: {
      title: 'Todo lo que tu barbería necesita',
      items: [
        { icon: '📅', title: 'Reservas en línea', desc: 'Los clientes reservan 24/7 sin llamarte. Eligen especialista, servicio y hora.' },
        { icon: '✂', title: 'Gestión de personal', desc: 'Agrega barberos con su propio horario. Los clientes eligen con quién quieren.' },
        { icon: '💈', title: 'Catálogo de servicios', desc: 'Establece nombres, precios y duraciones. Muéstralos en tu página de reservas.' },
        { icon: '📧', title: 'Notificaciones por email', desc: 'Email instantáneo cuando alguien reserva. El cliente también recibe confirmación.' },
        { icon: '⏰', title: 'Recordatorios', desc: 'Recordatorio automático 2 horas antes de la cita. Reduce las ausencias.' },
        { icon: '🔗', title: 'Tu propio enlace', desc: 'URL de reservas en noblelink.app/salon/tu-nombre. Comparte en Instagram, WhatsApp.' },
      ],
    },
    testimonials: {
      title: 'Barbershops que confían en nosotros',
      items: [
        { name: 'Alex Johnson', salon: 'Sharp Cuts Barbershop', text: 'Configuré mi página de reservas en 10 minutos. Ahora los clientes reservan en línea y recibo notificaciones al instante.' },
        { name: 'Maria Garcia', salon: 'Style Studio', text: 'Mis clientes adoran poder reservar en cualquier momento. Sin más mensajes de ida y vuelta para programar citas.' },
        { name: 'David Kim', salon: 'The Fade Factory', text: 'Solo los recordatorios por email ya valen la pena. Las ausencias se redujeron a la mitad desde que uso Noble.' },
      ],
    },
    pricing: {
      title: 'Precios simples',
      sub: 'Prueba de 14 días, sin tarjeta de crédito. Cancela cuando quieras.',
      popular: 'Más popular',
      plans: [
        { plan: 'Starter', price: '$19', desc: '1 empleado, reservas ilimitadas' },
        { plan: 'Pro', price: '$39', desc: '5 empleados, soporte prioritario', highlight: true },
        { plan: 'Business', price: '$79', desc: 'Empleados ilimitados, dominio personalizado' },
      ],
      cta: 'Ver precios completos →',
      mo: '/mes',
    },
    cta: {
      title: '¿Listo para estar en línea?',
      sub: 'Únete a las barberías que ya usan Noble. Prueba gratis, sin tarjeta de crédito.',
      btn: 'Comenzar prueba gratis →',
    },
    footer: { privacy: 'Política de privacidad', terms: 'Términos y condiciones', legal: 'Legal', copy: `© ${new Date().getFullYear()} Noble. Todos los derechos reservados.` },
  },
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: 3, gap: 2 }}>
      {(['en', 'es'] as Lang[]).map(l => (
        <button
          key={l}
          onClick={() => onChange(l)}
          style={{
            padding: '5px 12px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            border: 'none',
            cursor: 'pointer',
            minHeight: 30,
            background: lang === l ? '#C9A84C' : 'transparent',
            color: lang === l ? '#000' : 'rgba(255,255,255,0.5)',
          }}>
          {l}
        </button>
      ))}
    </div>
  )
}

export default function HomeClient() {
  const [lang, setLang] = useState<Lang>('en')
  const t = T[lang]

  return (
    <main id="main" className="min-h-screen bg-[#0F0A00] text-white">
      <a href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-[#C9A84C] focus:text-black focus:px-4 focus:py-2 focus:rounded text-sm font-bold">
        Skip to content
      </a>

      <nav aria-label="Main navigation" className="flex items-center justify-between px-6 py-3 border-b border-white/10 sticky top-0 bg-[#0F0A00]/95 backdrop-blur z-50">
        <Link href="/" className="font-serif text-xl text-[#C9A84C] tracking-wide" aria-label="Noble — home">✂ Noble</Link>
        <div className="flex items-center gap-1">
          <LangToggle lang={lang} onChange={setLang} />
          <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition px-4 py-3 min-h-[44px] flex items-center">{t.nav.pricing}</Link>
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition px-4 py-3 min-h-[44px] flex items-center">{t.nav.login}</Link>
          <Link href="/signup" className="bg-[#C9A84C] text-black text-sm font-semibold px-5 py-3 rounded hover:bg-[#e8d08a] transition min-h-[44px] flex items-center">{t.nav.trial}</Link>
        </div>
      </nav>

      <div id="main-content">
        <section className="text-center px-6 py-20 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-serif font-bold leading-tight mb-6">
            {t.hero.h1a}<br />
            <span className="text-[#C9A84C] italic">{t.hero.h1b}</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto mb-10">{t.hero.sub}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="bg-[#C9A84C] text-black font-bold px-8 py-3 rounded hover:bg-[#e8d08a] transition min-h-[44px] flex items-center w-full sm:w-auto justify-center">{t.hero.cta}</Link>
            <Link href="/pricing" className="border border-white/20 text-white/70 px-8 py-3 rounded hover:text-white transition min-h-[44px] flex items-center w-full sm:w-auto justify-center">{t.hero.pricing}</Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-20" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-center text-2xl font-serif font-bold text-white mb-12">{t.steps.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.steps.items.map(item => (
              <div key={item.step} className="text-center">
                <div className="text-4xl font-serif text-[#C9A84C]/30 font-bold mb-3">{item.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white/5 border-y border-white/10 py-20 px-6" aria-labelledby="features">
          <div className="max-w-5xl mx-auto">
            <h2 id="features" className="text-center text-2xl font-serif font-bold text-white mb-12">{t.features.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {t.features.items.map(f => (
                <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="text-3xl mb-3" aria-hidden="true">{f.icon}</div>
                  <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-20" aria-labelledby="testimonials">
          <h2 id="testimonials" className="text-center text-2xl font-serif font-bold text-white mb-12">{t.testimonials.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.testimonials.items.map(item => (
              <figure key={item.name} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <blockquote>
                  <p className="text-white/70 text-sm leading-relaxed mb-4">&ldquo;{item.text}&rdquo;</p>
                </blockquote>
                <figcaption>
                  <div className="font-semibold text-white text-sm">{item.name}</div>
                  <div className="text-[#C9A84C] text-xs">{item.salon}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="bg-white/5 border-y border-white/10 py-20 px-6" aria-labelledby="pricing-preview">
          <div className="max-w-3xl mx-auto text-center">
            <h2 id="pricing-preview" className="text-2xl font-serif font-bold text-white mb-4">{t.pricing.title}</h2>
            <p className="text-white/50 mb-8">{t.pricing.sub}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {t.pricing.plans.map(p => (
                <div key={p.plan} className={`rounded-xl p-6 border ${'highlight' in p && p.highlight ? 'border-[#C9A84C] bg-[#C9A84C]/10' : 'border-white/10 bg-white/5'}`}>
                  {'highlight' in p && p.highlight && <div className="text-xs text-[#C9A84C] font-bold mb-2 uppercase tracking-wide">{t.pricing.popular}</div>}
                  <div className="font-serif text-xl text-white font-bold">{p.plan}</div>
                  <div className="text-3xl font-bold text-[#C9A84C] my-2">{p.price}<span className="text-sm text-white/40">{t.pricing.mo}</span></div>
                  <div className="text-white/50 text-sm">{p.desc}</div>
                </div>
              ))}
            </div>
            <Link href="/pricing" className="inline-flex items-center justify-center mt-8 border border-[#C9A84C]/50 text-[#C9A84C] px-6 py-3 rounded hover:bg-[#C9A84C]/10 transition min-h-[44px]">
              {t.pricing.cta}
            </Link>
          </div>
        </section>

        <section className="text-center py-20 px-6">
          <h2 className="text-3xl font-serif font-bold text-white mb-4">{t.cta.title}</h2>
          <p className="text-white/50 mb-8">{t.cta.sub}</p>
          <Link href="/signup" className="inline-flex items-center justify-center bg-[#C9A84C] text-black font-bold px-10 py-4 rounded-lg hover:bg-[#e8d08a] transition text-lg min-h-[44px]">
            {t.cta.btn}
          </Link>
        </section>
      </div>

      <footer className="border-t border-white/10 px-6 py-6 text-center space-y-2">
        <div className="flex items-center justify-center gap-4">
          <Link href="/legal/privacy" className="text-white/30 hover:text-white/60 text-xs transition">{t.footer.privacy}</Link>
          <span className="text-white/20 text-xs">·</span>
          <Link href="/legal/terms" className="text-white/30 hover:text-white/60 text-xs transition">{t.footer.terms}</Link>
          <span className="text-white/20 text-xs">·</span>
          <Link href="/legal" className="text-white/30 hover:text-white/60 text-xs transition">{t.footer.legal}</Link>
        </div>
        <p className="text-white/20 text-xs">{t.footer.copy}</p>
      </footer>
    </main>
  )
}
