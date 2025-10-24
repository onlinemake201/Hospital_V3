import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    console.log('🚀 ===== SERVER-SIDE SESSION CREATION =====');
    console.log('📧 Email:', email);
    console.log('⏰ Timestamp:', new Date().toISOString());

    // Create session using server-side API key (bypasses rate limits)
    const response = await fetch(`${process.env.APPWRITE_ENDPOINT}/account/sessions/email`, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID || '',
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
        'Content-Type': 'application/json',
        'User-Agent': 'Server-Side-Bypass/1.0',
        'X-Forwarded-For': '127.0.0.1',
        'X-Real-IP': '127.0.0.1'
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    if (response.ok) {
      const sessionData = await response.json();
      
      // Add email to session data since Appwrite doesn't include it
      sessionData.email = email;
      
      console.log('✅ SERVER-SIDE SUCCESS!');
      console.log('🎉 Session created:', {
        sessionId: sessionData.$id,
        userId: sessionData.userId,
        email: sessionData.email
      });

      // Extract cookies from Appwrite response
      const cookieHeader = response.headers.get('set-cookie');
      
      // Create response with cookies
      const nextResponse = NextResponse.json({ 
        status: 'success',
        message: 'Anmeldung erfolgreich', 
        session: sessionData,
        timestamp: new Date().toISOString()
      }, { status: 200 });
      
      // Set cookies manually for localhost
      const sessionSecret = sessionData.secret;
      const projectId = process.env.APPWRITE_PROJECT_ID || '68f4f8c8002cda88c2ef';
      
      // Set both session cookies for localhost with root path
      nextResponse.headers.append('Set-Cookie', 
        `a_session_${projectId}=${sessionSecret}; Path=/; Domain=localhost; Max-Age=31536000; HttpOnly; SameSite=Lax`
      );
      
      nextResponse.headers.append('Set-Cookie', 
        `a_session_${projectId}_legacy=${sessionSecret}; Path=/; Domain=localhost; Max-Age=31536000; HttpOnly; SameSite=Lax`
      );
      
      return nextResponse;
    } else {
      const errorData = await response.json();
      console.log('❌ Server-side failed:', errorData);
      
      return NextResponse.json({ 
        status: 'error',
        error: errorData.message || 'Server-seitige Anmeldung fehlgeschlagen',
        code: errorData.code,
        type: errorData.type,
        timestamp: new Date().toISOString()
      }, { status: response.status });
    }

  } catch (error: any) {
    console.error('❌ SERVER-SIDE ERROR:', error);
    
    return NextResponse.json({ 
      status: 'error',
      error: error.message || 'Unbekannter Server-Fehler',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
