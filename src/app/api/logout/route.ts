import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  console.log('🚪 ===== LOGOUT PROCESS =====');
  
  try {
    // Clear all session cookies
    const projectId = process.env.APPWRITE_PROJECT_ID || '68f4f8c8002cda88c2ef';
    
    // Create response
    const response = NextResponse.json({ 
      status: 'success',
      message: 'Erfolgreich abgemeldet',
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
    // Clear session cookies by setting them to expire immediately
    response.headers.append('Set-Cookie', 
      `a_session_${projectId}=; Path=/; Domain=localhost; Max-Age=0; HttpOnly; SameSite=Lax`
    );
    
    response.headers.append('Set-Cookie', 
      `a_session_${projectId}_legacy=; Path=/; Domain=localhost; Max-Age=0; HttpOnly; SameSite=Lax`
    );
    
    console.log('✅ Logout successful - cookies cleared');
    console.log('🚪 ===== LOGOUT PROCESS END =====');
    
    return response;
    
  } catch (error) {
    console.log('❌ Logout error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Logout fehlgeschlagen',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
