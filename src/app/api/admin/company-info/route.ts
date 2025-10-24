import { NextRequest, NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError, ID } from '@/lib/appwrite'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface CompanyInfo {
  id?: string
  name: string
  address: string
  city: string
  postalCode: string
  country: string
  phone: string
  email: string
  website: string
  taxId: string
  registrationNumber: string
  logo?: string
  description: string
}

// GET - Fetch company information
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
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    try {
      // Try to get company info from database
      const companyQuery = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.COMPANY_INFO || 'company_info',
        [QueryHelpers.limit(1)]
      )

      if (companyQuery.documents.length > 0) {
        const companyDoc = companyQuery.documents[0]
        const companyInfo: CompanyInfo = {
          id: companyDoc.$id,
          name: companyDoc.name,
          address: companyDoc.address,
          city: companyDoc.city,
          postalCode: companyDoc.postalCode,
          country: companyDoc.country,
          phone: companyDoc.phone,
          email: companyDoc.email,
          website: companyDoc.website,
          taxId: companyDoc.taxId,
          registrationNumber: companyDoc.registrationNumber,
          logo: companyDoc.logo,
          description: companyDoc.description
        }
        return NextResponse.json(companyInfo)
      } else {
        // Return null if no company info exists
        return NextResponse.json(null)
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Return null if database error (collection might not exist yet)
      return NextResponse.json(null)
    }
  } catch (error) {
    console.error('Error fetching company info:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ error: appwriteError.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Save company information
export async function POST(request: NextRequest) {
  try {
    // Temporarily disable session check for testing
    // const session = await auth()
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Check admin permission temporarily disabled
    // await requirePermission('admin:full')

    const companyInfo: CompanyInfo = await request.json()

    // Validate required fields
    if (!companyInfo.name || !companyInfo.email || !companyInfo.address || !companyInfo.city || !companyInfo.postalCode || !companyInfo.country) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    try {
      // Check if company info already exists
      const existingQuery = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.COMPANY_INFO || 'company_info',
        [QueryHelpers.limit(1)]
      )

      let result
      if (existingQuery.documents.length > 0) {
        // Update existing document
        const existingDoc = existingQuery.documents[0]
        result = await databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.COMPANY_INFO || 'company_info',
          existingDoc.$id,
          {
            name: companyInfo.name,
            address: companyInfo.address,
            city: companyInfo.city,
            postalCode: companyInfo.postalCode,
            country: companyInfo.country,
            phone: companyInfo.phone,
            email: companyInfo.email,
            website: companyInfo.website,
            taxId: companyInfo.taxId,
            registrationNumber: companyInfo.registrationNumber,
            logo: companyInfo.logo || '',
            description: companyInfo.description
          }
        )
      } else {
        // Create new document
        result = await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.COMPANY_INFO || 'company_info',
          ID.unique(),
          {
            name: companyInfo.name,
            address: companyInfo.address,
            city: companyInfo.city,
            postalCode: companyInfo.postalCode,
            country: companyInfo.country,
            phone: companyInfo.phone,
            email: companyInfo.email,
            website: companyInfo.website,
            taxId: companyInfo.taxId,
            registrationNumber: companyInfo.registrationNumber,
            logo: companyInfo.logo || '',
            description: companyInfo.description
          }
        )
      }

      // Also update system settings for immediate navigation updates
      try {
        // Update companyName in system settings
        const settingsQuery = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.SYSTEM_SETTINGS || 'system_settings',
          [QueryHelpers.equal('key', 'companyName')]
        )

        if (settingsQuery.documents.length > 0) {
          // Update existing setting
          await databases.updateDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
            COLLECTIONS.SYSTEM_SETTINGS || 'system_settings',
            settingsQuery.documents[0].$id,
            { value: companyInfo.name }
          )
        } else {
          // Create new setting
          await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
            COLLECTIONS.SYSTEM_SETTINGS || 'system_settings',
            ID.unique(),
            { key: 'companyName', value: companyInfo.name }
          )
        }
      } catch (settingsError) {
        console.warn('Could not update system settings:', settingsError)
        // Continue anyway - company info is still saved
      }

      // Clear system settings cache to ensure immediate updates
      const { clearSettingsCache } = await import('@/lib/system-settings')
      clearSettingsCache()

      return NextResponse.json({ 
        success: true, 
        message: 'Company information saved successfully',
        data: {
          id: result.$id,
          name: result.name,
          address: result.address,
          city: result.city,
          postalCode: result.postalCode,
          country: result.country,
          phone: result.phone,
          email: result.email,
          website: result.website,
          taxId: result.taxId,
          registrationNumber: result.registrationNumber,
          logo: result.logo,
          description: result.description
        }
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      const appwriteError = handleAppwriteError(dbError)
      return NextResponse.json({ error: appwriteError.message || 'Database error' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error saving company info:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ error: appwriteError.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update company information (same as POST for now)
export async function PUT(request: NextRequest) {
  return POST(request)
}
