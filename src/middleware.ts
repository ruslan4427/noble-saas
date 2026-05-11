import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const url = req.nextUrl
  const path = url.pathname

  if (!user) return NextResponse.redirect(new URL('/login', url))
  if (!user.email_confirmed_at) return NextResponse.redirect(new URL('/verify-email', url))

  // Allow billing + onboarding regardless of subscription status
  if (path.startsWith('/billing') || path.startsWith('/onboarding')) return res

  // Dev/test account — always allow full access
  if (user.email === 'rusgrekovua@gmail.com') return res

  // Check subscription — block dashboard/analytics if trial expired or payment failed
  const { data: org } = await supabase
    .from('organizations')
    .select('sub_status, trial_ends_at')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (org) {
    const { sub_status, trial_ends_at } = org
    const trialActive = sub_status === 'trialing' &&
      trial_ends_at != null &&
      new Date(trial_ends_at) > new Date()
    const paidActive = sub_status === 'active'
    // Canceled but still within paid period (cancel_at_period_end)
    const canceledButPaid = sub_status === 'canceled' &&
      trial_ends_at != null &&
      new Date(trial_ends_at) > new Date()

    if (!paidActive && !trialActive && !canceledButPaid) {
      return NextResponse.redirect(new URL('/billing?reason=trial_expired', url))
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/billing/:path*', '/analytics/:path*'],
}
