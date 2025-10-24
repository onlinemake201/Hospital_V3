import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError, ID } from '@/lib/appwrite'
import { canReadPatients, canWritePatients } from '@/lib/rbac'
// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes
import { z } from 'zod'

// Force dynamic rendering

const createPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dob: z.string().min(1, 'Date of birth is required').transform(str => {
    // Handle different date formats
    if (str.includes('.')) {
      // DD.MM.YYYY format
      const [day, month, year] = str.split('.')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    // Already in YYYY-MM-DD format
    return str
  }),
  gender: z.string().min(1, 'Gender is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  insurance: z.string().optional(),
  weight: z.string().transform(str => {
    if (!str || str.trim() === '') return null
    const num = parseFloat(str)
    return isNaN(num) ? null : num
  }).optional(),
  allergies: z.string().optional(),
  dbStatus: z.enum(['active', 'inactive', 'archived', 'pending']).optional(),
  customFields: z.record(z.any()).optional()
})

const updatePatientSchema = createPatientSchema.partial()

export async function GET() {
  try {
    // RBAC check temporarily disabled for testing
    // if (!await canReadPatients()) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ patients: [] })
    }

    const patients = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PATIENTS,
      [
        QueryHelpers.limit(50),
        QueryHelpers.orderDesc('$updatedAt')
      ]
    )
    
    // Transform Appwrite documents to match expected format
    const transformedPatients = patients.documents.map(patient => ({
      id: patient.$id,
      patientNo: patient.patientNo,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dob: patient.dob,
      gender: patient.gender,
      insurance: patient.insurance,
      phone: patient.phone,
      email: patient.email,
      weight: patient.weight,
      allergies: patient.allergies || '',
      address: patient.address,
      dbStatus: patient.dbStatus || 'active', // Default to active if not set (will be null if field doesn't exist)
      createdAt: patient.$createdAt,
      updatedAt: patient.$updatedAt
    }))
    
    return NextResponse.json({ patients: transformedPatients })
  } catch (error: any) {
    console.error('Error fetching patients:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: 'Failed to fetch patients',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = createPatientSchema.parse(body)
    
    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ 
        error: 'Appwrite not configured' 
      }, { status: 503 })
    }
    
    // Check for duplicate email (only if email is provided)
    if (data.email && data.email.trim()) {
      const existingPatients = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PATIENTS,
        [QueryHelpers.equal('email', data.email)]
      )
      if (existingPatients.documents.length > 0) {
        return NextResponse.json({ 
          error: 'Email already exists', 
          field: 'email' 
        }, { status: 400 })
      }
    }
    
    // Generate patient number
    const lastPatients = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PATIENTS,
      [
        QueryHelpers.limit(1),
        QueryHelpers.orderDesc('patientNo')
      ]
    )
    
    const lastPatient = lastPatients.documents[0]
    const nextNumber = lastPatient ? 
      `P${String(parseInt(lastPatient.patientNo.slice(1)) + 1).padStart(3, '0')}` : 
      'P001'
    
    const patientData = {
      ...data,
      patientNo: nextNumber,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      insurance: data.insurance || null,
      weight: data.weight || null,
      allergies: data.allergies || null,
      // dbStatus: data.dbStatus || 'active', // Temporarily disabled until field is added to Appwrite
      customFields: data.customFields ? JSON.stringify(data.customFields) : null
    }

    const patient = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PATIENTS,
      ID.unique(),
      patientData
    )
    
    return NextResponse.json({ patient })
  } catch (error: any) {
    console.error('Error creating patient:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: error.errors 
      }, { status: 400 })
    }
    
    const appwriteError = handleAppwriteError(error)
    
    if (appwriteError.error === 'Conflict') {
      return NextResponse.json({ 
        error: 'Patient number already exists', 
        field: 'patientNo' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to create patient',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}