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
    
    // Step 1: Try to delete Appwrite session server-side with multiple strategies
    try {
      const sessionCookie = cookies().get(`a_session_${projectId}`)?.value;
      const legacyCookie = cookies().get(`a_session_${projectId}_legacy`)?.value;
      const genericCookie = cookies().get('a_session')?.value;
      
      if ((sessionCookie || legacyCookie || genericCookie) && apiKey) {
        console.log('🔄 Attempting server-side Appwrite session deletion...');
        
        // Try with primary session cookie
        if (sessionCookie) {
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
            console.log('✅ Appwrite session deleted successfully with primary cookie');
          } else {
            console.log('⚠️ Primary session deletion failed, trying legacy cookie');
            
            // Try with legacy cookie
            if (legacyCookie) {
              const legacyResponse = await fetch(`${appwriteEndpoint}/account/sessions/current`, {
                method: 'DELETE',
                headers: {
                  'X-Appwrite-Project': projectId,
                  'X-Appwrite-Key': apiKey,
                  'Cookie': `a_session_${projectId}_legacy=${legacyCookie}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (legacyResponse.ok) {
                console.log('✅ Appwrite session deleted successfully with legacy cookie');
              } else {
                console.log('⚠️ Legacy session deletion also failed');
              }
            }
          }
        }
      } else {
        console.log('⚠️ No session cookies or API key found for server-side deletion');
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
    
    // Step 3: Clear ALL possible session cookies with comprehensive browser compatibility
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Multiple cookie clearing strategies for maximum browser compatibility
    const cookieStrategies = [
      // Strategy 1: Basic cookies (no domain)
      `a_session_${projectId}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
      `a_session_${projectId}_legacy=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
      `a_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
      
      // Strategy 2: Expires in past
      `a_session_${projectId}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`,
      `a_session_${projectId}_legacy=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`,
      `a_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`,
      
      // Strategy 3: Secure variants for HTTPS
      `a_session_${projectId}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`,
      `a_session_${projectId}_legacy=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`,
      `a_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`,
    ];
    
    // Add domain-specific strategies for development
    if (!isProduction) {
      cookieStrategies.push(
        `a_session_${projectId}=; Path=/; Domain=localhost; Max-Age=0; HttpOnly; SameSite=Lax`,
        `a_session_${projectId}_legacy=; Path=/; Domain=localhost; Max-Age=0; HttpOnly; SameSite=Lax`,
        `a_session=; Path=/; Domain=localhost; Max-Age=0; HttpOnly; SameSite=Lax`
      );
    }
    
    // Apply all cookie clearing strategies
    cookieStrategies.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie);
    });
    
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
