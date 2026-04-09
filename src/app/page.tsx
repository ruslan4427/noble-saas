import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0F0A00] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0F0A00]/95 backdrop-blur z-50">
        <div className="font-serif text-xl text-[#C9A84C] tracking-wide">✂ Noble</div>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition">Pricing</Link>
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition">Log in</Link>
          <Link href="/signup" className="bg-[#C9A84C] text-black text-sm font-semibold px-4 py-2 rounded hover:bg-[#e8d08a] transition">Start free trial →</Link>
        </div>
      </nav>
      <section className="text-center px-6 py-24 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-serif font-bold leading-tight mb-6">
          Your barbershop —<br />
          <span className="text-[#C9A84C] italic">online in 5 minutes</span>
        </h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto mb-10">Booking page, staff schedule, client management — all under your own link.</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup" className="bg-[#C9A84C] text-black font-bold px-8 py-3 rounded hover:bg-[#e8d08a] transition">Create your salon →</Link>
          <Link href="/pricing" className="border border-white/20 text-white/70 px-8 py-3 rounded hover:text-white transition">See pricing</Link>
        </div>
      </section>
    </main>
  )
}
