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
  
  // Enhanced debug logging for troubleshooting
  console.log('🔍 Middleware session check:', {
    pathname,
    projectId,
    environment: process.env.NODE_ENV,
    hasProjectSession: !!request.cookies.get(`a_session_${projectId}`),
    hasLegacySession: !!request.cookies.get(`a_session_${projectId}_legacy`),
    hasGenericSession: !!request.cookies.get('a_session'),
    sessionFound: !!sessionCookie,
    allCookies: request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })),
    userAgent: request.headers.get('user-agent')?.substring(0, 50),
    host: request.headers.get('host'),
    timestamp: new Date().toISOString()
  });
  
  // IMMEDIATE LOGOUT DETECTION - No delays, instant redirect
  const logoutCookie = request.cookies.get('logout')
  const sessionClearedCookie = request.cookies.get('session_cleared')
  
  if (logoutCookie || sessionClearedCookie) {
    console.log('🚪 IMMEDIATE LOGOUT DETECTED - Instant redirect to login')
    
    // IMMEDIATE REDIRECT - No complex cleanup, just redirect to homepage
    const response = NextResponse.redirect(new URL('/', request.url))
    
    // Quick cookie clearing
    response.headers.append('Set-Cookie', `a_session_${projectId}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`)
    response.headers.append('Set-Cookie', `a_session_${projectId}_legacy=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`)
    response.headers.append('Set-Cookie', `a_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`)
    response.headers.append('Set-Cookie', `logout=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`)
    
    console.log('✅ IMMEDIATE LOGOUT COMPLETED')
    return response
  }
  
  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/demo',
    '/not-found'
  ];
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.includes(pathname) || 
                       pathname.startsWith('/demo') ||
                       pathname === '/not-found';
  
  // If no session cookie and trying to access protected route, redirect to homepage
  if (!sessionCookie && !isPublicRoute) {
    console.log('🚫 Access denied - no session cookie for protected route:', pathname);
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If user is on root and has session, redirect to dashboard
  if (pathname === '/' && sessionCookie) {
    console.log('🔄 Redirecting authenticated user from root to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // If user tries to access login page while authenticated, redirect to dashboard
  if (pathname === '/login' && sessionCookie) {
    console.log('🔄 Redirecting authenticated user from login to dashboard');
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