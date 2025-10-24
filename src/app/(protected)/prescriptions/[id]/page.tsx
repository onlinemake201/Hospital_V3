import { notFound } from 'next/navigation'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError } from '@/lib/appwrite'
import PrescriptionDetailClient from './prescription-detail-client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getPrescription(id: string) {
  try {
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return null
    }

    const prescription = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTIONS,
      id
    )

    // Get patient data
    let patient = null
    try {
      patient = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PATIENTS,
        prescription.patientId
      )
    } catch (error) {
      console.warn('Could not fetch patient for prescription:', id)
    }

    // Get prescriber data
    let prescriber = null
    try {
      prescriber = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.USERS,
        prescription.prescriberId
      )
    } catch (error) {
      console.warn('Could not fetch prescriber for prescription:', id)
      // Fallback prescriber data
      prescriber = {
        $id: prescription.prescriberId,
        name: prescription.prescriberId === 'admin_user' ? 'System Admin' : 
              prescription.prescriberId === 'user_maria_garcia' ? 'Dr. Maria Garcia' :
              prescription.prescriberId === 'user_hassan_abdi' ? 'Dr. Hassan Abdi' :
              prescription.prescriberId === 'user_omar_mwangi' ? 'Dr. Omar Mwangi' :
              prescription.prescriberId === 'user_aisha_hassan' ? 'Dr. Aisha Hassan' :
              'Unknown Doctor'
      }
    }

    // Get prescription items
    let items = []
    try {
      const itemsResult = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PRESCRIPTION_ITEMS,
        [QueryHelpers.equal('prescriptionId', prescription.$id)]
      )
      
      // Get medication details for each item
      items = await Promise.all(
        itemsResult.documents.map(async (item) => {
          let medication = null
          if (item.medicationId) {
            try {
              medication = await databases.getDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
                COLLECTIONS.MEDICATIONS,
                item.medicationId
              )
            } catch (error) {
              console.warn('Could not fetch medication for item:', item.$id)
            }
          }
          
          return {
            ...item,
            medication
          }
        })
      )
    } catch (error) {
      console.warn('Could not fetch prescription items:', id)
    }

    return {
      ...prescription,
      patient,
      prescriber,
      items
    }
  } catch (error) {
    console.error('Error fetching prescription:', error)
    return null
  }
}

export default async function PrescriptionDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const prescription = await getPrescription(params.id)
  
  if (!prescription) {
    notFound()
  }

  return (
    <PrescriptionDetailClient 
      prescription={prescription}
    />
  )
}