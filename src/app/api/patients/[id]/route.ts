import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError } from '@/lib/appwrite'
import { z } from 'zod'
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering
const updatePatientSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dob: z.string().optional().transform(str => {
    if (!str) return str
    // Handle different date formats
    if (str.includes('.')) {
      // DD.MM.YYYY format
      const [day, month, year] = str.split('.')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    // Already in YYYY-MM-DD format
    return str
  }),
  gender: z.string().optional(),
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
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    const patient = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PATIENTS,
      params.id
    )

    // Get related data
    let encounters: any[] = []
    let appointments: any[] = []
    let prescriptions: any[] = []
    let invoices: any[] = []

    // Skip encounters for now - collection may not exist
    // try {
    //   const encountersResult = await databases.listDocuments(
    //     process.env.APPWRITE_DATABASE_ID || 'hospital_main',
    //     COLLECTIONS.ENCOUNTERS,
    //     [
    //       QueryHelpers.equal('patientId', params.id),
    //       QueryHelpers.orderDesc('startAt')
    //     ]
    //   )
    //   encounters = encountersResult.documents
    // } catch (error) {
    //   console.warn('Could not fetch encounters for patient:', params.id)
    // }

    try {
      const appointmentsResult = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.APPOINTMENTS,
        [
          QueryHelpers.equal('patientId', params.id),
          QueryHelpers.orderDesc('startAt')
        ]
      )
      
      // Get provider details for each appointment
      appointments = await Promise.all(
        appointmentsResult.documents.map(async (appointment) => {
          let provider = null
          if (appointment.providerId) {
            try {
              provider = await databases.getDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
                COLLECTIONS.USERS,
                appointment.providerId
              )
            } catch (error) {
              console.warn('Could not fetch provider for appointment:', appointment.$id)
            }
          }

          return {
            id: appointment.$id,
            patientId: appointment.patientId,
            providerId: appointment.providerId,
            room: appointment.room,
            startAt: appointment.startAt,
            endAt: appointment.endAt,
            reason: appointment.reason,
            status: appointment.status,
            createdAt: appointment.$createdAt,
            updatedAt: appointment.$updatedAt,
            provider: provider ? {
              name: provider.name,
              firstName: provider.firstName,
              lastName: provider.lastName
            } : null
          }
        })
      )
    } catch (error) {
      console.warn('Could not fetch appointments for patient:', params.id)
    }

    try {
      const prescriptionsResult = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PRESCRIPTIONS,
        [
          QueryHelpers.equal('patientId', params.id),
          QueryHelpers.orderDesc('$createdAt')
        ]
      )
      
      // Get prescriber details for each prescription
      prescriptions = await Promise.all(
        prescriptionsResult.documents.map(async (prescription) => {
          let prescriber = null
          if (prescription.prescriberId) {
            try {
              prescriber = await databases.getDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
                COLLECTIONS.USERS,
                prescription.prescriberId
              )
            } catch (error) {
              console.warn('Could not fetch prescriber for prescription:', prescription.$id)
              // Continue without prescriber data
            }
          }

          return {
            id: prescription.$id,
            prescriptionNo: prescription.prescriptionNo,
            patientId: prescription.patientId,
            prescriberId: prescription.prescriberId,
            status: prescription.status,
            notes: prescription.notes,
            attachments: prescription.attachments || [],
            createdAt: prescription.$createdAt,
            updatedAt: prescription.$updatedAt,
            prescriber: prescriber ? {
              name: prescriber.name
            } : null
          }
        })
      )
    } catch (error) {
      console.warn('Could not fetch prescriptions for patient:', params.id)
    }

    try {
      const invoicesResult = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.INVOICES,
        [
          QueryHelpers.equal('patientId', params.id),
          QueryHelpers.orderDesc('issueDate')
        ]
      )
      invoices = invoicesResult.documents
    } catch (error) {
      console.warn('Could not fetch invoices for patient:', params.id)
    }
    
    const patientWithDetails = {
      id: patient.$id,
      patientNo: patient.patientNo,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dob: patient.dob,
      gender: patient.gender,
      address: patient.address,
      phone: patient.phone,
      email: patient.email,
      insurance: patient.insurance,
      weight: patient.weight,
      allergies: patient.allergies || '',
      dbStatus: patient.dbStatus || 'active', // Default to active if not set
      createdAt: patient.$createdAt,
      updatedAt: patient.$updatedAt,
      encounters,
      appointments,
      prescriptions,
      invoices
    }
    
    return NextResponse.json({ patient: patientWithDetails })
  } catch (error: any) {
    console.error('Error fetching patient:', error)
    const appwriteError = handleAppwriteError(error)
    if (appwriteError.error === 'Not Found') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }
    return NextResponse.json({ 
      error: 'Failed to fetch patient',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updatePatientSchema.parse(body)
    
    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }
    
    // Check for duplicate email (excluding current patient)
    if (data.email) {
      const existingPatients = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PATIENTS,
        [
          QueryHelpers.equal('email', data.email),
          QueryHelpers.notEqual('$id', params.id)
        ]
      )
      if (existingPatients.documents.length > 0) {
        return NextResponse.json({ 
          error: 'Email already exists', 
          field: 'email' 
        }, { status: 400 })
      }
    }

    const updateData = {
      ...data,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      insurance: data.insurance || null,
      weight: data.weight || null,
      allergies: data.allergies || null,
      // Only include dbStatus if it's provided, don't force it
      ...(data.dbStatus && { dbStatus: data.dbStatus }),
      customFields: (data as any).customFields ? JSON.stringify((data as any).customFields) : null
    }

    const patient = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PATIENTS,
      params.id,
      updateData
    )
    
    return NextResponse.json({ patient })
  } catch (error: any) {
    console.error('Error updating patient:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: error.errors 
      }, { status: 400 })
    }
    
    const appwriteError = handleAppwriteError(error)
    
    if (appwriteError.error === 'Not Found') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to update patient',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    // Check if patient has any related data and delete them first
    const [appointments, prescriptions, invoices] = await Promise.all([
      databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.APPOINTMENTS,
        [QueryHelpers.equal('patientId', params.id)]
      ),
      databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PRESCRIPTIONS,
        [QueryHelpers.equal('patientId', params.id)]
      ),
      databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.INVOICES,
        [QueryHelpers.equal('patientId', params.id)]
      )
    ])

    // Delete related appointments
    for (const appointment of appointments.documents) {
      try {
        await databases.deleteDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.APPOINTMENTS,
          appointment.$id
        )
      } catch (error) {
        console.warn('Could not delete appointment:', appointment.$id)
      }
    }

    // Delete related prescriptions
    for (const prescription of prescriptions.documents) {
      try {
        await databases.deleteDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.PRESCRIPTIONS,
          prescription.$id
        )
      } catch (error) {
        console.warn('Could not delete prescription:', prescription.$id)
      }
    }

    // Delete related invoices
    for (const invoice of invoices.documents) {
      try {
        await databases.deleteDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.INVOICES,
          invoice.$id
        )
      } catch (error) {
        console.warn('Could not delete invoice:', invoice.$id)
      }
    }

    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PATIENTS,
      params.id
    )
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting patient:', error)
    const appwriteError = handleAppwriteError(error)
    
    if (appwriteError.error === 'Not Found') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to delete patient',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}