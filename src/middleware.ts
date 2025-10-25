import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Öffentliche Routen
  const publicRoutes = ['/', '/login', '/demo', '/not-found']
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/demo')
  
  // Session-Cookie prüfen
  const sessionCookie = request.cookies.get('appwrite_session')?.value
  
  // Wenn keine Session und geschützte Route -> Login
  if (!sessionCookie && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Wenn Session vorhanden und auf Homepage -> Dashboard
  if (pathname === '/' && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}