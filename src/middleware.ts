import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Get project ID
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68f4f8c8002cda88c2ef'
  
  // Check for session cookie
  const sessionCookie = request.cookies.get(`a_session_${projectId}`)?.value ||
                       request.cookies.get(`a_session_${projectId}_legacy`)?.value ||
                       request.cookies.get('a_session')?.value
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/demo', '/not-found']
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/demo')
  
  // If no session and trying to access protected route, redirect to login
  if (!sessionCookie && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // If user has session and is on root, redirect to dashboard
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}