import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError } from '@/lib/appwrite'
import { canReadAppointments, canWriteAppointments, canDeleteAppointments } from '@/lib/rbac'
// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { z } from 'zod'
// Force dynamic rendering

const updateAppointmentSchema = z.object({
  patientId: z.string().optional(),
  providerId: z.string().optional(),
  room: z.string().optional(),
  startAt: z.string().transform(str => {
    const date = new Date(str)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid start date format')
    }
    // Always store as UTC to ensure consistency
    return date.toISOString()
  }).optional(),
  endAt: z.string().transform(str => {
    const date = new Date(str)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid end date format')
    }
    // Always store as UTC to ensure consistency
    return date.toISOString()
  }).optional(),
  reason: z.string().optional(),
  status: z.string().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check temporarily disabled for testing
    // if (!await canReadAppointments()) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    const appointment = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.APPOINTMENTS,
      params.id
    )

    // Get patient and provider details in parallel for better performance
    const [patient, provider] = await Promise.allSettled([
      appointment.patientId ? databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PATIENTS,
        appointment.patientId
      ) : Promise.resolve(null),
      appointment.providerId ? databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.USERS,
        appointment.providerId
      ) : Promise.resolve(null)
    ])

    const patientData = patient.status === 'fulfilled' ? patient.value : null
    const providerData = provider.status === 'fulfilled' ? provider.value : null
    
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
      patient: patientData ? {
        id: patientData.$id,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        patientNo: patientData.patientNo
      } : null,
      provider: providerData ? {
        id: providerData.$id,
        name: providerData.name,
        firstName: providerData.firstName,
        lastName: providerData.lastName
      } : {
        id: 'default-provider-id',
        name: 'Standard Provider',
        firstName: 'Standard',
        lastName: 'Provider'
      }
    }
    
    return NextResponse.json({ appointment: appointmentWithDetails })
  } catch (error: any) {
    console.error('Error fetching appointment:', error)
    const appwriteError = handleAppwriteError(error)
    if (appwriteError.error === 'Not Found') {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }
    return NextResponse.json({ 
      error: 'Failed to fetch appointment',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check temporarily disabled for testing
    // if (!await canWriteAppointments()) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    const body = await request.json()
    console.log('Received appointment update data:', body)
    
    const data = updateAppointmentSchema.parse(body)
    console.log('Parsed appointment update data:', data)
    
    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }
    
    // Find or use default provider if needed
    let providerId = data.providerId
    if (providerId === 'default-provider') {
      // Use a simple default provider ID instead of searching for email
      providerId = 'default-provider-id'
      console.log('Using default provider:', providerId)
    }
    
    // Verify patient exists if patientId is being updated
    if (data.patientId) {
      try {
        const patient = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.PATIENTS,
          data.patientId
        )
        console.log('Patient found:', patient.firstName, patient.lastName)
      } catch (error) {
        console.error('Patient not found:', data.patientId)
        return NextResponse.json({ error: 'Patient not found' }, { status: 400 })
      }
    }
    
    const appointmentData = {
      ...data,
      providerId: providerId || undefined
    }
    
    console.log('Updating appointment with data:', appointmentData)
    
    const appointment = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.APPOINTMENTS,
      params.id,
      appointmentData
    )

    // Get patient and provider details in parallel for better performance
    const [patient, provider] = await Promise.allSettled([
      appointment.patientId ? databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PATIENTS,
        appointment.patientId
      ) : Promise.resolve(null),
      appointment.providerId ? databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.USERS,
        appointment.providerId
      ) : Promise.resolve(null)
    ])

    const patientData = patient.status === 'fulfilled' ? patient.value : null
    const providerData = provider.status === 'fulfilled' ? provider.value : null
    
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
      patient: patientData ? {
        id: patientData.$id,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        patientNo: patientData.patientNo
      } : null,
      provider: providerData ? {
        id: providerData.$id,
        name: providerData.name,
        firstName: providerData.firstName,
        lastName: providerData.lastName
      } : {
        id: 'default-provider-id',
        name: 'Standard Provider',
        firstName: 'Standard',
        lastName: 'Provider'
      }
    }
    
    console.log('Appointment updated successfully:', appointment.$id)
    return NextResponse.json({ appointment: appointmentWithDetails })
  } catch (error: any) {
    console.error('Error updating appointment:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: 'Failed to update appointment',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check temporarily disabled for testing
    // if (!await canDeleteAppointments()) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.APPOINTMENTS,
      params.id
    )
    
    console.log('Appointment deleted successfully:', params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting appointment:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: 'Failed to delete appointment',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}