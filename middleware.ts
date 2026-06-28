import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // getSession() reads from the JWT cookie — no external network call, no timeout risk
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname.startsWith('/auth')

  if (!session && !isAuthRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (session && isAuthRoute && !pathname.startsWith('/auth/reset-password')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  // Only run on routes that need auth protection — skip static assets AND public pages
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/auth/:path*'],
}
