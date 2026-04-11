import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import SalonClient from './SalonClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: org } = await supabase
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
    openGraph: {
      title,
      description,
      url,
      siteName: 'Noble',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function SalonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!org) notFound()

  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('org_id', org.id)
    .eq('is_active', true)

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('org_id', org.id)
    .eq('is_active', true)

  return (
    <SalonClient
      org={org}
      staff={staff || []}
      services={services || []}
    />
  )
}
