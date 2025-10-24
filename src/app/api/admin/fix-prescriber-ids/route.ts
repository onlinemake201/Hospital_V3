import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers } from '@/lib/appwrite'

export async function POST() {
  try {
    console.log('🔧 Starting prescriber ID fix...')
    
    // Get all prescriptions
    const prescriptions = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTIONS,
      [QueryHelpers.limit(100)]
    )

    console.log(`📋 Found ${prescriptions.documents.length} prescriptions`)

    // Get all users to find a valid prescriber
    const users = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.USERS,
      [QueryHelpers.limit(100)]
    )

    console.log(`👥 Found ${users.documents.length} users`)

    if (users.documents.length === 0) {
      return NextResponse.json({ 
        error: 'No users found in database',
        success: false 
      }, { status: 400 })
    }

    // Use the first user as default prescriber
    const defaultPrescriberId = users.documents[0].$id
    const defaultPrescriberName = users.documents[0].name || 'Admin User'
    
    console.log(`👤 Using default prescriber: ${defaultPrescriberName} (${defaultPrescriberId})`)

    let updatedCount = 0
    const errors = []

    for (const prescription of prescriptions.documents) {
      // Check if prescriberId is missing or invalid
      if (!prescription.prescriberId || prescription.prescriberId === 'admin_user') {
        try {
          await databases.updateDocument(
            process.env.APPWRITE_DATABASE_ID || 'hospital_main',
            COLLECTIONS.PRESCRIPTIONS,
            prescription.$id,
            {
              prescriberId: defaultPrescriberId
            }
          )
          
          console.log(`✅ Updated prescription ${prescription.prescriptionNo} with prescriber ${defaultPrescriberName}`)
          updatedCount++
        } catch (error) {
          console.error(`❌ Failed to update prescription ${prescription.prescriptionNo}:`, error.message)
          errors.push(`Failed to update ${prescription.prescriptionNo}: ${error.message}`)
        }
      } else {
        console.log(`ℹ️  Prescription ${prescription.prescriptionNo} already has prescriberId: ${prescription.prescriberId}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedCount} prescriptions`,
      updatedCount,
      defaultPrescriber: {
        id: defaultPrescriberId,
        name: defaultPrescriberName
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('❌ Error fixing prescriber IDs:', error)
    return NextResponse.json({ 
      error: 'Failed to fix prescriber IDs',
      details: error.message,
      success: false 
    }, { status: 500 })
  }
}

