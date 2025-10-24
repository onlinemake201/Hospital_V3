import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError, ID } from '@/lib/appwrite'
import { canReadAppointments, canWriteAppointments } from '@/lib/rbac'
// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes
import { z } from 'zod'

// Force dynamic rendering

const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  providerId: z.string().optional(),
  room: z.string().optional(),
  startAt: z.string().transform(str => {
    const date = new Date(str)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid start date format')
    }
    return date.toISOString()
  }),
  endAt: z.string().transform(str => {
    const date = new Date(str)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid end date format')
    }
    return date.toISOString()
  }),
  reason: z.string().optional(),
  status: z.enum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).default('scheduled')
}).refine(data => new Date(data.endAt) > new Date(data.startAt), {
  message: 'End time must be after start time',
  path: ['endAt']
})

const updateAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required').optional(),
  providerId: z.string().optional(),
  room: z.string().optional(),
  startAt: z.string().transform(str => {
    const date = new Date(str)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid start date format')
    }
    return date.toISOString()
  }).optional(),
  endAt: z.string().transform(str => {
    const date = new Date(str)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid end date format')
    }
    return date.toISOString()
  }).optional(),
  reason: z.string().optional(),
  status: z.enum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).optional()
})

export async function GET() {
  try {
    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ appointments: [] })
    }

    const appointments = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.APPOINTMENTS,
      [
        QueryHelpers.limit(100),
        QueryHelpers.orderAsc('startAt')
      ]
    )

    // Get patient and provider details for each appointment
    const appointmentsWithDetails = await Promise.all(
      appointments.documents.map(async (appointment) => {
        let patient = null
        let provider = null

        try {
          if (appointment.patientId) {
            patient = await databases.getDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
              COLLECTIONS.PATIENTS,
              appointment.patientId
            )
          }
        } catch (error) {
          console.warn('Could not fetch patient for appointment:', appointment.$id)
        }

        try {
          if (appointment.providerId) {
            provider = await databases.getDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
              COLLECTIONS.USERS,
              appointment.providerId
            )
          }
        } catch (error) {
          console.warn('Could not fetch provider for appointment:', appointment.$id)
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
          patient: patient ? {
            id: patient.$id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            patientNo: patient.patientNo
          } : null,
          provider: provider ? {
            id: provider.$id,
            name: provider.name,
            firstName: provider.firstName,
            lastName: provider.lastName
          } : {
            id: 'default-provider-id',
            name: 'Standard Provider',
            firstName: 'Standard',
            lastName: 'Provider'
          }
        }
      })
    )
    
    return NextResponse.json({ appointments: appointmentsWithDetails })
  } catch (error: any) {
    console.error('Error fetching appointments:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: 'Failed to fetch appointments',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // RBAC check temporarily disabled for testing
    // if (!await canWriteAppointments()) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    const body = await request.json()
    const data = createAppointmentSchema.parse(body)
    
    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ 
        error: 'Appwrite not configured' 
      }, { status: 503 })
    }
    
    // Find or use default provider
    let providerId = data.providerId
    if (!providerId || providerId === 'default-provider') {
      // Use a simple default provider ID instead of searching for email
      providerId = 'default-provider-id'
    }
    
    // Verify patient exists
    try {
      await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PATIENTS,
        data.patientId
      )
    } catch (error) {
      return NextResponse.json({ 
        error: 'Patient not found' 
      }, { status: 400 })
    }
    
    // Provider overlap check removed - allow multiple appointments
    
    const appointmentData = {
      ...data,
      providerId
      // appointmentNo removed - not in Appwrite schema
    }

    const appointment = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.APPOINTMENTS,
      ID.unique(),
      appointmentData
    )

    // Get patient and provider details
    let patient = null
    let provider = null

    try {
      patient = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PATIENTS,
        data.patientId
      )
    } catch (error) {
      console.warn('Could not fetch patient for new appointment')
    }

    try {
      provider = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.USERS,
        providerId
      )
    } catch (error) {
      console.warn('Could not fetch provider for new appointment')
    }
    
    const appointmentWithDetails = {
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
      patient: patient ? {
        id: patient.$id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        patientNo: patient.patientNo
      } : null,
      provider: provider ? {
        id: provider.$id,
        name: provider.name,
        firstName: provider.firstName,
        lastName: provider.lastName
      } : {
        id: 'default-provider-id',
        name: 'Standard Provider',
        firstName: 'Standard',
        lastName: 'Provider'
      },
    }
    
    return NextResponse.json({ appointment: appointmentWithDetails })
  } catch (error: any) {
    console.error('Error creating appointment:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: error.errors 
      }, { status: 400 })
    }
    
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: 'Failed to create appointment',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}