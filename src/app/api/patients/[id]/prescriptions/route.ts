import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError } from '@/lib/appwrite'
import { canReadPrescriptions } from '@/lib/rbac'
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check permissions
    if (!await canReadPrescriptions()) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ prescriptions: [] })
    }

    const prescriptions = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTIONS,
      [
        QueryHelpers.equal('patientId', params.id),
        QueryHelpers.orderDesc('$createdAt')
      ]
    )

    // Get prescription items for each prescription
    const prescriptionsWithItems = await Promise.all(
      prescriptions.documents.map(async (prescription) => {
        let items: any[] = []
        try {
          const itemsResult = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
            COLLECTIONS.PRESCRIPTION_ITEMS,
            [QueryHelpers.equal('prescriptionId', prescription.$id)]
          )
          items = itemsResult.documents
        } catch (error) {
          console.warn('Could not fetch items for prescription:', prescription.$id)
        }

        return {
          id: prescription.$id,
          prescriptionNo: prescription.prescriptionNo,
          status: prescription.status,
          notes: prescription.notes,
          createdAt: prescription.$createdAt,
          updatedAt: prescription.$updatedAt,
          items
        }
      })
    )

    return NextResponse.json({ prescriptions: prescriptionsWithItems })
  } catch (error: any) {
    console.error('Error fetching patient prescriptions:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: appwriteError.message || 'Failed to fetch prescriptions' 
    }, { status: 500 })
  }
}