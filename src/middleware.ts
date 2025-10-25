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
  
  // Enhanced debug logging for production troubleshooting
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
    host: request.headers.get('host')
  });
  
  // Check for logout or session cleared cookies - comprehensive cleanup
  const logoutCookie = request.cookies.get('logout')
  const sessionClearedCookie = request.cookies.get('session_cleared')
  
  if (logoutCookie || sessionClearedCookie) {
    console.log('🚪 Logout/session cleared detected, performing comprehensive cleanup')
    const response = NextResponse.redirect(new URL('/login', request.url))
    
    // Clear ALL possible session cookies with multiple strategies
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = 'Path=/; Max-Age=0; HttpOnly; SameSite=Lax'
    const cookieOptionsSecure = 'Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure'
    
    // Primary session cookies (no domain for production compatibility)
    response.headers.append('Set-Cookie', `a_session_${projectId}=; ${cookieOptions}`)
    response.headers.append('Set-Cookie', `a_session_${projectId}_legacy=; ${cookieOptions}`)
    response.headers.append('Set-Cookie', `a_session=; ${cookieOptions}`)
    
    // Secure variants (only for production)
    if (isProduction) {
      response.headers.append('Set-Cookie', `a_session_${projectId}=; ${cookieOptionsSecure}`)
      response.headers.append('Set-Cookie', `a_session_${projectId}_legacy=; ${cookieOptionsSecure}`)
      response.headers.append('Set-Cookie', `a_session=; ${cookieOptionsSecure}`)
    }
    
    // Domain-specific variants (only for localhost development)
    if (!isProduction) {
      response.headers.append('Set-Cookie', `a_session_${projectId}=; Path=/; Domain=localhost; Max-Age=0; HttpOnly; SameSite=Lax`)
      response.headers.append('Set-Cookie', `a_session_${projectId}_legacy=; Path=/; Domain=localhost; Max-Age=0; HttpOnly; SameSite=Lax`)
      response.headers.append('Set-Cookie', `a_session=; Path=/; Domain=localhost; Max-Age=0; HttpOnly; SameSite=Lax`)
    }
    
    // Clear trigger cookies
    response.headers.append('Set-Cookie', `logout=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`)
    response.headers.append('Set-Cookie', `session_cleared=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`)
    
    console.log('✅ Comprehensive session cleanup completed')
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
  
  // If no session cookie and trying to access protected route, redirect to login
  if (!sessionCookie && !isPublicRoute) {
    console.log('🚫 Access denied - no session cookie for protected route:', pathname);
    return NextResponse.redirect(new URL('/login', request.url))
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