import { NextResponse } from 'next/server'
import { serverDatabases, COLLECTIONS, QueryHelpers } from '@/lib/appwrite'

export async function GET() {
  try {
    console.log('Testing Appwrite server connection...')
    
    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({
        success: false,
        error: 'APPWRITE_PROJECT_ID is not configured',
        details: {
          endpoint: process.env.APPWRITE_ENDPOINT,
          projectId: process.env.APPWRITE_PROJECT_ID,
          databaseId: process.env.APPWRITE_DATABASE_ID,
          hasApiKey: !!process.env.APPWRITE_API_KEY
        }
      })
    }

    // Test database connection with serverDatabases (with API key)
    const testQuery = await serverDatabases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.USERS,
      [QueryHelpers.limit(1)]
    )

    return NextResponse.json({
      success: true,
      message: 'Appwrite server connection successful',
      details: {
        endpoint: process.env.APPWRITE_ENDPOINT,
        projectId: process.env.APPWRITE_PROJECT_ID,
        databaseId: process.env.APPWRITE_DATABASE_ID,
        hasApiKey: !!process.env.APPWRITE_API_KEY,
        usersCount: testQuery.total,
        apiKeyLength: process.env.APPWRITE_API_KEY?.length || 0
      }
    })

  } catch (error) {
    console.error('Appwrite server connection test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        endpoint: process.env.APPWRITE_ENDPOINT,
        projectId: process.env.APPWRITE_PROJECT_ID,
        databaseId: process.env.APPWRITE_DATABASE_ID,
        hasApiKey: !!process.env.APPWRITE_API_KEY,
        errorCode: error.code,
        errorType: error.type,
        errorMessage: error.message
      }
    })
  }
}
