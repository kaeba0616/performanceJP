import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/types'
import { ADMIN_COOKIE, getAdminPassword } from '@/lib/admin/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /admin/* 게이트 — /admin/login 만 비인증 접근 허용
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const password = getAdminPassword()
    const cookieValue = request.cookies.get(ADMIN_COOKIE)?.value
    if (!password || cookieValue !== password) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)',
  ],
}
