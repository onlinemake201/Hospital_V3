import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers } from '@/lib/appwrite'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes

export async function GET() {
  try {
    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({
        totalPatients: 0,
        todayAppointments: 0,
        waitingPatients: 0,
        activePrescriptions: 0,
        recentPrescriptions: []
      })
    }

    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Get total patients
    const patients = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PATIENTS,
      [QueryHelpers.limit(1)]
    )

    // Get today's appointments
    const appointments = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.APPOINTMENTS,
      [
        QueryHelpers.greaterThanEqual('startAt', startOfDay.toISOString()),
        QueryHelpers.lessThan('startAt', endOfDay.toISOString())
      ]
    )

    // Get active prescriptions
    const prescriptions = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTIONS,
      [
        QueryHelpers.equal('status', 'active'),
        QueryHelpers.limit(5),
        QueryHelpers.orderDesc('$createdAt')
      ]
    )

    return NextResponse.json({
      totalPatients: patients.total,
      todayAppointments: appointments.total,
      waitingPatients: appointments.documents.filter(apt => apt.status === 'waiting').length,
      activePrescriptions: prescriptions.total,
      recentPrescriptions: prescriptions.documents
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({
      totalPatients: 0,
      todayAppointments: 0,
      waitingPatients: 0,
      activePrescriptions: 0,
      recentPrescriptions: []
    })
  }
}
