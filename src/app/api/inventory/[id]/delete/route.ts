import { NextResponse } from 'next/server'
import { databases, storage, COLLECTIONS, QueryHelpers, handleAppwriteError } from '@/lib/appwrite'
import { canDeleteInventory } from '@/lib/rbac'
// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { reorderMedicationCodes } from '@/lib/inventory-utils'
// Force dynamic rendering

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // RBAC check temporarily disabled for testing
    // if (!await canDeleteInventory()) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    // First, get the medication to check for image
    const medication = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.MEDICATIONS,
      params.id
    )

    // Delete the associated image if it exists
    if (medication.imageUrl && medication.imageUrl.includes('/storage/buckets/')) {
      try {
        // Extract file ID from the image URL
        const urlParts = medication.imageUrl.split('/')
        const fileId = urlParts[urlParts.length - 2] // The file ID is before the 'view' part
        
        await storage.deleteFile(COLLECTIONS.MEDICATION_IMAGES, fileId)
        console.log(`Deleted image file: ${fileId}`)
      } catch (imageError) {
        console.warn('Failed to delete image file:', imageError)
        // Continue with medication deletion even if image deletion fails
      }
    }

    // Delete the medication
    await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.MEDICATIONS,
      params.id
    )
    
    // Reorder remaining medication codes
    await reorderMedicationCodes()
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting medication:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: 'Failed to delete medication',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // RBAC check temporarily disabled for testing
    // if (!await canDeleteInventory()) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    // First, get the medication to check for image
    const medication = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.MEDICATIONS,
      params.id
    )

    // Delete the associated image if it exists
    if (medication.imageUrl && medication.imageUrl.includes('/storage/buckets/')) {
      try {
        // Extract file ID from the image URL
        const urlParts = medication.imageUrl.split('/')
        const fileId = urlParts[urlParts.length - 2] // The file ID is before the 'view' part
        
        await storage.deleteFile(COLLECTIONS.MEDICATION_IMAGES, fileId)
        console.log(`Deleted image file: ${fileId}`)
      } catch (imageError) {
        console.warn('Failed to delete image file:', imageError)
        // Continue with medication deletion even if image deletion fails
      }
    }

    // Delete all stock movements
    const stockMovements = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.STOCK_MOVEMENTS,
      [QueryHelpers.equal('medicationId', params.id)]
    )
    
    for (const movement of stockMovements.documents) {
      await databases.deleteDocument(
        process.env.APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.STOCK_MOVEMENTS,
        movement.$id
      )
    }
    
    // Delete all administrations
    const administrations = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.ADMINISTRATIONS,
      [QueryHelpers.equal('medicationId', params.id)]
    )
    
    for (const administration of administrations.documents) {
      await databases.deleteDocument(
        process.env.APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.ADMINISTRATIONS,
        administration.$id
      )
    }
    
    // Finally delete the medication
    await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.MEDICATIONS,
      params.id
    )
    
    // Reorder remaining medication codes
    await reorderMedicationCodes()
    
    // Redirect to inventory page
    return NextResponse.redirect(new URL('/inventory', request.url))
  } catch (error: any) {
    console.error('Error deleting medication with dependencies:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: 'Failed to delete medication',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}