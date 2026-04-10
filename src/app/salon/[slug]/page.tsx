import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import SalonClient from './SalonClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data: org } = await supabase
    .from('organizations')
    .select('name, slug')
    .eq('slug', params.slug)
    .single()

  if (!org) return { title: 'Salon not found' }

  return {
    title: `${org.name} — Online Booking`,
    description: `Book an appointment at ${org.name}`,
  }
}

export default async function SalonPage({ params }: { params: { slug: string } }) {
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', params.slug)
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
