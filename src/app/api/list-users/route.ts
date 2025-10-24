import { NextResponse } from 'next/server';
import { authHelpers } from '@/lib/appwrite';

export async function GET() {
  try {
    console.log('🔍 ===== FINDING EXISTING APPWRITE USERS =====');
    
    // Use Appwrite MCP to list all users
    const response = await fetch(`${process.env.APPWRITE_ENDPOINT}/users`, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID || '',
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('📊 Total users found:', data.total);
    console.log('👥 Users list:', data.users);
    
    // Format user data for easier reading
    const formattedUsers = data.users.map((user: any) => ({
      userId: user.$id,
      email: user.email,
      name: user.name,
      registration: user.registration,
      emailVerification: user.emailVerification,
      phoneVerification: user.phoneVerification,
      status: user.status,
      labels: user.labels,
      prefs: user.prefs
    }));

    return NextResponse.json({
      status: 'success',
      message: 'Bestehende Benutzer gefunden',
      total: data.total,
      users: formattedUsers,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error fetching users:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Fehler beim Abrufen der Benutzer',
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
