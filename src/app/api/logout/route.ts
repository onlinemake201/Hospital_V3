import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  console.log('🚪 ===== ROBUST LOGOUT PROCESS =====');
  
  try {
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68f4f8c8002cda88c2ef';
    const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
    const apiKey = process.env.APPWRITE_API_KEY || '';
    
    console.log('🔧 Logout configuration:', {
      projectId,
      endpoint: appwriteEndpoint,
      hasApiKey: !!apiKey
    });
    
    // Step 1: Try to delete Appwrite session server-side
    try {
      const sessionCookie = cookies().get(`a_session_${projectId}`)?.value;
      if (sessionCookie && apiKey) {
        console.log('🔄 Attempting server-side Appwrite session deletion...');
        
        const deleteResponse = await fetch(`${appwriteEndpoint}/account/sessions/current`, {
          method: 'DELETE',
          headers: {
            'X-Appwrite-Project': projectId,
            'X-Appwrite-Key': apiKey,
            'Cookie': `a_session_${projectId}=${sessionCookie}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (deleteResponse.ok) {
          console.log('✅ Appwrite session deleted successfully');
        } else {
          console.log('⚠️ Appwrite session deletion failed, continuing with cookie cleanup');
        }
      }
    } catch (error) {
      console.log('⚠️ Server-side session deletion failed:', error);
    }
    
    // Step 2: Create response with comprehensive cookie cleanup
    const response = NextResponse.json({ 
      status: 'success',
      message: 'Erfolgreich abgemeldet',
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
    // Step 3: Clear ALL possible session cookies with multiple strategies
    const cookieOptions = 'Path=/; Max-Age=0; HttpOnly; SameSite=Lax';
    const cookieOptionsSecure = 'Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure';
    
    // Primary session cookies
    response.headers.append('Set-Cookie', `a_session_${projectId}=; ${cookieOptions}`);
    response.headers.append('Set-Cookie', `a_session_${projectId}_legacy=; ${cookieOptions}`);
    response.headers.append('Set-Cookie', `a_session=; ${cookieOptions}`);
    
    // Secure variants for HTTPS
    response.headers.append('Set-Cookie', `a_session_${projectId}=; ${cookieOptionsSecure}`);
    response.headers.append('Set-Cookie', `a_session_${projectId}_legacy=; ${cookieOptionsSecure}`);
    response.headers.append('Set-Cookie', `a_session=; ${cookieOptionsSecure}`);
    
    // Domain-specific variants (for production)
    response.headers.append('Set-Cookie', `a_session_${projectId}=; Path=/; Domain=localhost; Max-Age=0; HttpOnly; SameSite=Lax`);
    response.headers.append('Set-Cookie', `a_session_${projectId}_legacy=; Path=/; Domain=localhost; Max-Age=0; HttpOnly; SameSite=Lax`);
    response.headers.append('Set-Cookie', `a_session=; Path=/; Domain=localhost; Max-Age=0; HttpOnly; SameSite=Lax`);
    
    // Step 4: Set logout trigger cookie
    response.headers.append('Set-Cookie', `logout=true; Path=/; Max-Age=1; HttpOnly; SameSite=Lax`);
    
    // Step 5: Set additional cleanup cookies
    response.headers.append('Set-Cookie', `session_cleared=true; Path=/; Max-Age=1; HttpOnly; SameSite=Lax`);
    
    console.log('✅ Comprehensive logout completed - all cookies cleared');
    console.log('🚪 ===== ROBUST LOGOUT PROCESS END =====');
    
    return response;
    
  } catch (error) {
    console.log('❌ Logout error:', error);
    
    // Fallback response with basic cookie cleanup
    const fallbackResponse = NextResponse.json({
      status: 'error',
      message: 'Logout fehlgeschlagen, aber Cookies wurden gelöscht',
      timestamp: new Date().toISOString()
    }, { status: 500 });
    
    // Basic cookie cleanup as fallback
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68f4f8c8002cda88c2ef';
    fallbackResponse.headers.append('Set-Cookie', `a_session_${projectId}=; Path=/; Max-Age=0`);
    fallbackResponse.headers.append('Set-Cookie', `logout=true; Path=/; Max-Age=1`);
    
    return fallbackResponse;
  }
}
