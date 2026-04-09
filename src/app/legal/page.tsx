import Link from 'next/link'

export default function Legal() {
  return (
    <main className="min-h-screen bg-[#0F0A00] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="font-serif text-xl text-[#C9A84C]">✂ Noble</Link>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-serif font-bold mb-8">Legal</h1>
        <div className="space-y-4">
          {[
            { href: '/legal/privacy', title: 'Privacy Policy', desc: 'How we collect and use your data' },
            { href: '/legal/terms', title: 'Terms of Service', desc: 'Rules and conditions of using Noble' },
            { href: '/legal/refund', title: 'Refund Policy', desc: 'Our refund and cancellation policy' },
            { href: '/legal/sms-consent', title: 'SMS Consent Policy', desc: 'TCPA compliance and SMS opt-in' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="block bg-white/5 border border-white/10 rounded-xl p-5 hover:border-[#C9A84C]/30 transition">
              <div className="font-semibold mb-1">{item.title}</div>
              <div className="text-white/50 text-sm">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
