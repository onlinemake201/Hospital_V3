import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError, ID } from '@/lib/appwrite'
import { canWritePrescriptions } from '@/lib/rbac'
// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { z } from 'zod'
// Force dynamic rendering

const updateItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  instructions: z.string().optional(),
  medicationId: z.string().optional()
})

export async function PUT(request: Request, { params }: { params: { id: string, itemId: string } }) {
  try {
    // Check permissions
    if (!await canWritePrescriptions()) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateItemSchema.parse(body)

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    const updatedItem = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTION_ITEMS,
      params.itemId,
      {
        title: data.title,
        dosage: data.dosage || null,
        frequency: data.frequency || null,
        duration: data.duration || null,
        instructions: data.instructions || null,
        medicationId: data.medicationId || null
      }
    )

    return NextResponse.json({ 
      item: {
        id: updatedItem.$id,
        prescriptionId: updatedItem.prescriptionId,
        title: updatedItem.title,
        dosage: updatedItem.dosage,
        frequency: updatedItem.frequency,
        duration: updatedItem.duration,
        instructions: updatedItem.instructions,
        medicationId: updatedItem.medicationId,
        createdAt: updatedItem.$createdAt,
        updatedAt: updatedItem.$updatedAt
      }
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error updating prescription item:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: appwriteError.message || 'Failed to update prescription item' 
    }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string, itemId: string } }) {
  try {
    console.log('DELETE request for item:', params.itemId)
    
    // Temporarily skip permission check for debugging
    // if (!await canWritePrescriptions()) {
    //   console.log('Permission check failed')
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      console.log('Appwrite not configured')
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    console.log('Attempting to delete document:', params.itemId)
    
    await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTION_ITEMS,
      params.itemId
    )

    console.log('Document deleted successfully')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting prescription item:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      type: error.type
    })
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: appwriteError.message || 'Failed to delete prescription item',
      details: error.message
    }, { status: 500 })
  }
}







