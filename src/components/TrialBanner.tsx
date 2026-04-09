'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function TrialBanner() {
  const [days, setDays] = useState<number | null>(null)
  const [status, setStatus] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase
        .from('organizations')
        .select('sub_status, trial_ends_at')
        .eq('owner_id', user.id)
        .single()
      if (!org) return
      setStatus(org.sub_status)
      if (org.sub_status === 'trialing' && org.trial_ends_at) {
        const diff = new Date(org.trial_ends_at).getTime() - Date.now()
        setDays(Math.max(0, Math.ceil(diff / 86400000)))
      }
    }
    load()
  }, [])

  if (status !== 'trialing' || days === null) return null
  const isUrgent = days <= 3

  return (
    <div className={`w-full px-4 py-2 flex items-center justify-between text-sm ${isUrgent ? 'bg-red-500/10 border-b border-red-500/30' : 'bg-[#C9A84C]/10 border-b border-[#C9A84C]/20'}`}>
      <div className="flex items-center gap-2">
        <span className={isUrgent ? 'text-red-400' : 'text-[#C9A84C]'}>{isUrgent ? '🔴' : '⏳'}</span>
        <span className={isUrgent ? 'text-red-300' : 'text-[#C9A84C]'}>
          {days === 0 ? 'Your free trial expires today!' : `${days} day${days !== 1 ? 's' : ''} left in your free trial`}
        </span>
      </div>
      <Link href="/billing"
        className={`text-xs font-bold px-3 py-1 rounded transition ${isUrgent ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-[#C9A84C] text-black hover:bg-[#e8d08a]'}`}>
        Upgrade now →
      </Link>
    </div>
  )
}
