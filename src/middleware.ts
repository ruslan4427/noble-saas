import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: name => req.cookies.get(name)?.value,
        set: (name, value, options) => res.cookies.set({ name, value, ...options }),
        remove: (name, options) => res.cookies.set({ name, value: '', ...options }),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const url = req.nextUrl

  if (!user) return NextResponse.redirect(new URL('/login', url))
  if (!user.email_confirmed_at) return NextResponse.redirect(new URL('/verify-email', url))

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/billing/:path*', '/analytics/:path*'],
}
