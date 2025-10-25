import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🚪 DIRECT LOGOUT ENDPOINT CALLED');
  
  try {
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68f4f8c8002cda88c2ef';
    
    // Create response with immediate redirect to homepage
    const response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    
    // Clear ALL possible session cookies immediately
    const cookieStrategies = [
      // Strategy 1: Basic cookies
      `a_session_${projectId}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
      `a_session_${projectId}_legacy=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
      `a_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
      
      // Strategy 2: Expires in past
      `a_session_${projectId}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`,
      `a_session_${projectId}_legacy=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`,
      `a_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`,
      
      // Strategy 3: Secure variants
      `a_session_${projectId}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`,
      `a_session_${projectId}_legacy=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`,
      `a_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`,
    ];
    
    // Apply all cookie clearing strategies
    cookieStrategies.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie);
    });
    
    // Clear trigger cookies
    response.headers.append('Set-Cookie', `logout=true; Path=/; Max-Age=1; HttpOnly; SameSite=Lax`);
    response.headers.append('Set-Cookie', `session_cleared=true; Path=/; Max-Age=1; HttpOnly; SameSite=Lax`);
    
    console.log('✅ DIRECT LOGOUT COMPLETED - Redirecting to homepage');
    
    return response;
    
  } catch (error) {
    console.log('❌ Direct logout error:', error);
    
    // Fallback: redirect to homepage even if cookie clearing fails
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  }
}
