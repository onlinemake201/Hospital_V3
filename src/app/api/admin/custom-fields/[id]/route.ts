import { NextResponse } from 'next/server'
import { databases, COLLECTIONS } from '@/lib/appwrite'
import { z } from 'zod'
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering
const updateCustomFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required').optional(),
  type: z.enum(['text', 'number', 'email', 'phone', 'date', 'select', 'textarea']).optional(),
  required: z.boolean().optional(),
  options: z.string().optional(),
  description: z.string().optional(),
  placeholder: z.string().optional()
})

export async function PUT(request: Request, { params }: { params: any }) {
  try {
    const body = await request.json()
    const data = updateCustomFieldSchema.parse(body)

    // Check if database is available
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 })
    }

    const field = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || "hospital_main", 
      COLLECTIONS.CUSTOM_FIELDS,
      params.id,
      data
    )

    return NextResponse.json({ field })
  } catch (error: any) {
    console.error('Error updating custom field:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Invalid data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to update custom field',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: any }) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 })
    }

    await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID || "hospital_main", 
      COLLECTIONS.CUSTOM_FIELDS,
      params.id
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting custom field:', error)
    return NextResponse.json({
      error: 'Failed to delete custom field',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
