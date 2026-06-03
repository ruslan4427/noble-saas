import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-server'
import SalonClient from './SalonClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('name, slug')
    .eq('slug', slug)
    .single()

  if (!org) return { title: 'Salon not found' }

  const title = `${org.name} — Online Booking`
  const description = `Book an appointment at ${org.name} online. Choose your master, service and time. Instant confirmation.`
  const url = `https://www.noblelink.app/salon/${org.slug}`

  return {
    title,
    description,
    openGraph: { title, description, url, siteName: 'Noble', type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function SalonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!org) notFound()

  const [staffRes, servicesRes, bookingsRes] = await Promise.all([
    supabaseAdmin.from('staff').select('*').eq('org_id', org.id).eq('is_active', true),
    supabaseAdmin.from('services').select('*').eq('org_id', org.id).eq('is_active', true),
    // Fetch bookings for the next 16 days (covers all timezone offsets)
    supabaseAdmin
      .from('bookings')
      .select('master_id, date, time_slot, duration_min')
      .gte('date', (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10) })())
      .lte('date', (() => { const d = new Date(); d.setDate(d.getDate() + 16); return d.toISOString().slice(0, 10) })())
      .in('status', ['confirmed', 'pending']),
  ])

  return (
    <SalonClient
      org={org}
      staff={staffRes.data || []}
      services={servicesRes.data || []}
      initialBookings={bookingsRes.data || []}
    />
  )
}
