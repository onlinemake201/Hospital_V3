import { NextRequest, NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError, ID } from '@/lib/appwrite'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface SystemSetting {
  id?: string
  key: string
  value: string
  description: string
}

// GET - Fetch all system settings
export async function GET() {
  try {
    // Temporarily disable session check for testing
    // const session = await auth()
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Check admin permission temporarily disabled
    // await requirePermission('admin:full')

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    try {
      const settingsQuery = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.SYSTEM_SETTINGS || 'system_settings',
        [QueryHelpers.limit(100)]
      )

      const settings: SystemSetting[] = settingsQuery.documents.map(doc => ({
        id: doc.$id,
        key: doc.key,
        value: doc.value,
        description: doc.description
      }))

      return NextResponse.json({ settings })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ settings: [] })
    }
  } catch (error) {
    console.error('Error fetching system settings:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ error: appwriteError.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Create or update system setting
export async function POST(request: NextRequest) {
  try {
    // Temporarily disable session check for testing
    // const session = await auth()
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Check admin permission temporarily disabled
    // await requirePermission('admin:full')

    const setting: SystemSetting = await request.json()

    // Validate required fields
    if (!setting.key || !setting.value) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 })
    }

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    try {
      // Check if setting already exists
      const existingQuery = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.SYSTEM_SETTINGS || 'system_settings',
        [QueryHelpers.equal('key', setting.key)]
      )

      let result
      if (existingQuery.documents.length > 0) {
        // Update existing setting
        const existingDoc = existingQuery.documents[0]
        result = await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.SYSTEM_SETTINGS || 'system_settings',
          existingDoc.$id,
          {
            key: setting.key,
            value: setting.value,
            description: setting.description || ''
          }
        )
      } else {
        // Create new setting
        result = await databases.createDocument(
          process.env.APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.SYSTEM_SETTINGS || 'system_settings',
          ID.unique(),
          {
            key: setting.key,
            value: setting.value,
            description: setting.description || ''
          }
        )
      }

      return NextResponse.json({ 
        success: true, 
        message: 'System setting saved successfully',
        data: {
          id: result.$id,
          key: result.key,
          value: result.value,
          description: result.description
        }
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      const appwriteError = handleAppwriteError(dbError)
      return NextResponse.json({ error: appwriteError.message || 'Database error' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error saving system setting:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ error: appwriteError.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update system setting
export async function PUT(request: NextRequest) {
  return POST(request)
}

// DELETE - Delete system setting
export async function DELETE(request: NextRequest) {
  try {
    // Temporarily disable session check for testing
    // const session = await auth()
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Check admin permission temporarily disabled
    // await requirePermission('admin:full')

    const { searchParams } = new URL(request.url)
    const settingId = searchParams.get('id')

    if (!settingId) {
      return NextResponse.json({ error: 'Setting ID is required' }, { status: 400 })
    }

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    try {
      await databases.deleteDocument(
        process.env.APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.SYSTEM_SETTINGS || 'system_settings',
        settingId
      )

      return NextResponse.json({ 
        success: true, 
        message: 'System setting deleted successfully'
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      const appwriteError = handleAppwriteError(dbError)
      return NextResponse.json({ error: appwriteError.message || 'Database error' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error deleting system setting:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ error: appwriteError.message || 'Internal server error' }, { status: 500 })
  }
}