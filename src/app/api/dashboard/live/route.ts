import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError } from '@/lib/appwrite'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 60 // Cache for 1 minute (live data needs more frequent updates)
// Force dynamic rendering

export async function GET() {
  try {
    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({
        todaysAppointments: 0,
        upcomingAppointments: 0,
        waitingPatients: 0,
        todaysRevenue: 0,
        timestamp: new Date().toISOString()
      })
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    const [
      todaysAppointmentsResult,
      upcomingAppointmentsResult,
      waitingPatientsResult,
      todaysInvoicesResult
    ] = await Promise.all([
      // Today's appointments (live count)
      databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.APPOINTMENTS,
        [
          QueryHelpers.greaterThanEqual('startAt', startOfDay.toISOString()),
          QueryHelpers.lessThanEqual('startAt', endOfDay.toISOString())
        ]
      ),
      
      // Upcoming appointments (next 3 hours)
      databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.APPOINTMENTS,
        [
          QueryHelpers.greaterThanEqual('startAt', now.toISOString()),
          QueryHelpers.lessThanEqual('startAt', new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString())
        ]
      ),
      
      // Waiting patients (appointments that started but not completed)
      databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.APPOINTMENTS,
        [
          QueryHelpers.lessThanEqual('startAt', now.toISOString()),
          QueryHelpers.greaterThanEqual('endAt', now.toISOString()),
          QueryHelpers.contains('status', 'scheduled')
        ]
      ),
      
      // Today's invoices
      databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.INVOICES,
        [
          QueryHelpers.greaterThanEqual('issueDate', startOfDay.toISOString()),
          QueryHelpers.lessThanEqual('issueDate', endOfDay.toISOString()),
          QueryHelpers.equal('status', 'paid')
        ]
      )
    ])

    // Calculate today's revenue
    const todaysRevenue = todaysInvoicesResult.documents.reduce((sum, invoice) => {
      return sum + (invoice.amount || 0)
    }, 0)

    return NextResponse.json({
      todaysAppointments: todaysAppointmentsResult.total,
      upcomingAppointments: upcomingAppointmentsResult.total,
      waitingPatients: waitingPatientsResult.total,
      todaysRevenue,
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error('Error fetching live dashboard data:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch live data',
        details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
      },
      { status: 500 }
    )
  }
}