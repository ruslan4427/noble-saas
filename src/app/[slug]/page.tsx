import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Reserved paths that should NOT be treated as salon slugs
const RESERVED = new Set([
  'dashboard', 'onboarding', 'signup', 'login', 'billing',
  'pricing', 'legal', 'salon', 'api', 'analytics',
])

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (RESERVED.has(slug)) redirect('/')

  const { data: org } = await supabase
    .from('organizations')
    .select('slug')
    .eq('slug', slug)
    .single()

  if (!org) redirect('/')

  redirect(`/salon/${slug}`)
}
