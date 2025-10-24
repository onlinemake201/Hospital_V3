import { NextResponse } from 'next/server'
import { databases, COLLECTIONS } from '@/lib/appwrite'
import { z } from 'zod'
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering
const createCustomFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  type: z.enum(['text', 'number', 'email', 'phone', 'date', 'select', 'textarea']),
  required: z.boolean().default(false),
  options: z.string().optional(), // Comma-separated options for select fields
  description: z.string().optional(),
  placeholder: z.string().optional()
})

const updateCustomFieldSchema = createCustomFieldSchema.partial()

export async function GET() {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ fields: [] })
    }

    // For now, return mock data since the database might not be ready
    const mockFields = [
      {
        id: '1',
        name: 'Emergency Contact',
        type: 'text',
        required: true,
        description: 'Emergency contact person for the patient',
        placeholder: 'Enter emergency contact name'
      },
      {
        id: '2',
        name: 'Blood Type',
        type: 'select',
        required: false,
        options: 'A+,A-,B+,B-,AB+,AB-,O+,O-',
        description: 'Patient blood type'
      },
      {
        id: '3',
        name: 'Insurance Number',
        type: 'text',
        required: false,
        description: 'Health insurance policy number',
        placeholder: 'Enter insurance number'
      }
    ]

    return NextResponse.json({ fields: mockFields })

    // Uncomment when database is ready:
    // const fields = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID || "hospital_main", COLLECTIONS.USERS)({
    //   orderBy: { name: 'asc' }
    // })
    // return NextResponse.json({ fields })
  } catch (error: any) {
    console.error('Error fetching custom fields:', error)
    return NextResponse.json({
      error: 'Failed to fetch custom fields',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = createCustomFieldSchema.parse(body)

    // Check if database is available
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 })
    }

    const field = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID || "hospital_main", 
      COLLECTIONS.CUSTOM_FIELDS,
      'unique()',
      data
    )

    return NextResponse.json({ field })
  } catch (error: any) {
    console.error('Error creating custom field:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Invalid data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to create custom field',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
