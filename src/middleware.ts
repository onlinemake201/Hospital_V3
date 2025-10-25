import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for API routes, static files, and public pages
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/demo') ||
    pathname === '/login'
  ) {
    return NextResponse.next()
  }

  // Check if user is authenticated by looking for session cookie
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68f4f8c8002cda88c2ef';
  const sessionCookie = request.cookies.get(`a_session_${projectId}`) || 
                       request.cookies.get(`a_session_${projectId}_legacy`) ||
                       request.cookies.get('a_session')
  
  // If no session cookie and trying to access protected route, redirect to login
  if (!sessionCookie && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is on root and has session, redirect to dashboard
  if (pathname === '/' && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}