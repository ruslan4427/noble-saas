import Link from 'next/link'

export default function Home() {
  return (
    <main id="main" className="min-h-screen bg-[#0F0A00] text-white">

      {/* Skip to content — WCAG 2.4.1 */}
      <a href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-[#C9A84C] focus:text-black focus:px-4 focus:py-2 focus:rounded text-sm font-bold">
        Skip to content
      </a>

      {/* Nav — mobile responsive + touch targets min 44px */}
      <nav aria-label="Main navigation" className="flex items-center justify-between px-6 py-3 border-b border-white/10 sticky top-0 bg-[#0F0A00]/95 backdrop-blur z-50">
        <Link href="/" className="font-serif text-xl text-[#C9A84C] tracking-wide" aria-label="Noble — home">✂ Noble</Link>
        <div className="flex items-center gap-1">
          <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition px-4 py-3 min-h-[44px] flex items-center">Pricing</Link>
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition px-4 py-3 min-h-[44px] flex items-center">Log in</Link>
          <Link href="/signup" className="bg-[#C9A84C] text-black text-sm font-semibold px-5 py-3 rounded hover:bg-[#e8d08a] transition min-h-[44px] flex items-center">Start free trial →</Link>
        </div>
      </nav>

      <div id="main-content">
        {/* Hero */}
        <section className="text-center px-6 py-20 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-serif font-bold leading-tight mb-6">
            Your barbershop —<br />
            <span className="text-[#C9A84C] italic">online in 5 minutes</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto mb-10">Booking page, staff schedule, client management — all under your own link.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="bg-[#C9A84C] text-black font-bold px-8 py-3 rounded hover:bg-[#e8d08a] transition min-h-[44px] flex items-center w-full sm:w-auto justify-center">Create your salon →</Link>
            <Link href="/pricing" className="border border-white/20 text-white/70 px-8 py-3 rounded hover:text-white transition min-h-[44px] flex items-center w-full sm:w-auto justify-center">See pricing</Link>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-6 pb-20" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-center text-2xl font-serif font-bold text-white mb-12">Online in 3 steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create your salon', desc: 'Sign up, enter your salon name, add staff and services. Takes 5 minutes.' },
              { step: '02', title: 'Share your link', desc: 'Get a unique booking link at noblelink.app/salon/your-name. Share it anywhere.' },
              { step: '03', title: 'Clients book online', desc: 'Clients choose a master, service and time. You get an instant email notification.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="text-4xl font-serif text-[#C9A84C]/30 font-bold mb-3">{item.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="bg-white/5 border-y border-white/10 py-20 px-6" aria-labelledby="features">
          <div className="max-w-5xl mx-auto">
            <h2 id="features" className="text-center text-2xl font-serif font-bold text-white mb-12">Everything your barbershop needs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: '📅', title: 'Online booking', desc: 'Clients book 24/7 without calling you. Pick master, service, and time.' },
                { icon: '✂', title: 'Staff management', desc: 'Add barbers with their own schedule. Clients choose who they want.' },
                { icon: '💈', title: 'Services catalog', desc: 'Set service names, prices and durations. Display them on your booking page.' },
                { icon: '📧', title: 'Email notifications', desc: 'Instant email when someone books. Client gets a confirmation too.' },
                { icon: '⏰', title: 'Reminders', desc: 'Automatic email reminder 2 hours before the appointment. Reduce no-shows.' },
                { icon: '🔗', title: 'Your own link', desc: 'Clean booking URL at noblelink.app/salon/your-name. Share on Instagram, WhatsApp.' },
              ].map(f => (
                <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="text-3xl mb-3" aria-hidden="true">{f.icon}</div>
                  <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="max-w-5xl mx-auto px-6 py-20" aria-labelledby="testimonials">
          <h2 id="testimonials" className="text-center text-2xl font-serif font-bold text-white mb-12">Trusted by barbershops</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Alex Johnson', salon: 'Sharp Cuts Barbershop', text: 'Set up my booking page in 10 minutes. Now clients book online and I get notified instantly.' },
              { name: 'Maria Garcia', salon: 'Style Studio', text: 'My clients love being able to book anytime. No more back-and-forth messages to schedule appointments.' },
              { name: 'David Kim', salon: 'The Fade Factory', text: 'The reminder emails alone are worth it. No-shows dropped by half since I started using Noble.' },
            ].map(t => (
              <figure key={t.name} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <blockquote>
                  <p className="text-white/70 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                </blockquote>
                <figcaption>
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-[#C9A84C] text-xs">{t.salon}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Pricing preview */}
        <section className="bg-white/5 border-y border-white/10 py-20 px-6" aria-labelledby="pricing-preview">
          <div className="max-w-3xl mx-auto text-center">
            <h2 id="pricing-preview" className="text-2xl font-serif font-bold text-white mb-4">Simple pricing</h2>
            <p className="text-white/50 mb-8">14-day free trial, no credit card required. Cancel anytime.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { plan: 'Starter', price: '$19', desc: '1 staff, unlimited bookings' },
                { plan: 'Pro', price: '$39', desc: '5 staff, priority support', highlight: true },
                { plan: 'Business', price: '$79', desc: 'Unlimited staff, custom domain' },
              ].map(p => (
                <div key={p.plan} className={`rounded-xl p-6 border ${p.highlight ? 'border-[#C9A84C] bg-[#C9A84C]/10' : 'border-white/10 bg-white/5'}`}>
                  {p.highlight && <div className="text-xs text-[#C9A84C] font-bold mb-2 uppercase tracking-wide">Most popular</div>}
                  <div className="font-serif text-xl text-white font-bold">{p.plan}</div>
                  <div className="text-3xl font-bold text-[#C9A84C] my-2">{p.price}<span className="text-sm text-white/40">/mo</span></div>
                  <div className="text-white/50 text-sm">{p.desc}</div>
                </div>
              ))}
            </div>
            <Link href="/pricing" className="inline-flex items-center justify-center mt-8 border border-[#C9A84C]/50 text-[#C9A84C] px-6 py-3 rounded hover:bg-[#C9A84C]/10 transition min-h-[44px]">
              See full pricing →
            </Link>
          </div>
        </section>

        {/* CTA footer */}
        <section className="text-center py-20 px-6">
          <h2 className="text-3xl font-serif font-bold text-white mb-4">Ready to go online?</h2>
          <p className="text-white/50 mb-8">Join barbershops already using Noble. Free trial, no credit card.</p>
          <Link href="/signup" className="inline-flex items-center justify-center bg-[#C9A84C] text-black font-bold px-10 py-4 rounded-lg hover:bg-[#e8d08a] transition text-lg min-h-[44px]">
            Start free trial →
          </Link>
        </section>
      </div>
    </main>
  )
}
