import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers } from '@/lib/appwrite'

export async function GET() {
  try {
    console.log('Testing Appwrite connection...')
    
    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({
        success: false,
        error: 'APPWRITE_PROJECT_ID is not configured',
        details: {
          endpoint: process.env.APPWRITE_ENDPOINT,
          projectId: process.env.APPWRITE_PROJECT_ID,
          databaseId: process.env.APPWRITE_DATABASE_ID
        }
      })
    }

    // Test database connection
    const testQuery = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.USERS,
      [QueryHelpers.limit(1)]
    )

    return NextResponse.json({
      success: true,
      message: 'Appwrite connection successful',
      details: {
        endpoint: process.env.APPWRITE_ENDPOINT,
        projectId: process.env.APPWRITE_PROJECT_ID,
        databaseId: process.env.APPWRITE_DATABASE_ID,
        usersCount: testQuery.total
      }
    })

  } catch (error) {
    console.error('Appwrite connection test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        endpoint: process.env.APPWRITE_ENDPOINT,
        projectId: process.env.APPWRITE_PROJECT_ID,
        databaseId: process.env.APPWRITE_DATABASE_ID,
        errorCode: error.code,
        errorType: error.type
      }
    })
  }
}
