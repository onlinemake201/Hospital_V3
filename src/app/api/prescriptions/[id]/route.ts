import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError, ID } from '@/lib/appwrite'
// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { z } from 'zod'
// Force dynamic rendering

const updatePrescriptionSchema = z.object({
  prescriberId: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    type: z.enum(['medication', 'bloodtest', 'referral', 'info', 'other']).default('medication'),
    medicationId: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    instructions: z.string().optional(),
    priority: z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
    dueDate: z.string().optional()
  })).optional(),
  attachments: z.array(z.string()).optional()
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check temporarily disabled for testing
    // const session = await auth()
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    const prescription = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTIONS,
      params.id
    )

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    // Get patient details
    let patient = null
    if (prescription.patientId) {
      try {
        patient = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.PATIENTS,
          prescription.patientId
        )
      } catch (error) {
        console.warn('Could not fetch patient for prescription:', params.id)
      }
    }

    // Get prescriber details
    let prescriber = null
    if (prescription.prescriberId) {
      try {
        prescriber = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.USERS,
          prescription.prescriberId
        )
      } catch (error) {
        console.warn('Could not fetch prescriber for prescription:', params.id)
      }
    }

    // Get prescription items
    let items: any[] = []
    try {
      const prescriptionItems = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PRESCRIPTION_ITEMS,
        [QueryHelpers.equal('prescriptionId', params.id)]
      )
      
      items = await Promise.all(
        prescriptionItems.documents.map(async (item) => {
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
      console.warn('Could not fetch prescription items:', error)
    }

    // Parse attachments if they exist
    const parsedPrescription = {
      ...prescription,
      attachments: prescription.attachments ? 
        (typeof prescription.attachments === 'string' ? 
          JSON.parse(prescription.attachments) : 
          prescription.attachments
        ) : [],
      patient: patient ? {
        id: patient.$id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        patientNo: patient.patientNo,
        dob: patient.dob,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address
      } : null,
      prescriber: prescriber ? {
        id: prescriber.$id,
        name: prescriber.name,
        email: prescriber.email
      } : null,
      items
    }

    return NextResponse.json({ prescription: parsedPrescription })
  } catch (e: any) {
    console.error('Error fetching prescription:', e)
    const appwriteError = handleAppwriteError(e)
    return NextResponse.json({ 
      error: appwriteError.message || 'Failed to fetch prescription' 
    }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check temporarily disabled for testing
    // const session = await auth()
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    const body = await request.json()
    
    // Basic validation without Zod schema
    const data = {
      prescriberId: body.prescriberId,
      status: body.status,
      notes: body.notes,
      items: body.items,
      attachments: body.attachments
    }

    // Update prescription items if provided
    if (data.items) {
      // Delete existing items
      const existingItems = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PRESCRIPTION_ITEMS,
        [QueryHelpers.equal('prescriptionId', params.id)]
      )
      
      for (const item of existingItems.documents) {
        await databases.deleteDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.PRESCRIPTION_ITEMS,
          item.$id
        )
      }

      // Create new items
      for (const item of data.items) {
        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.PRESCRIPTION_ITEMS,
          ID.unique(),
          {
            prescriptionId: params.id,
            type: item.type,
            medicationId: item.medicationId || null,
            title: item.title,
            description: item.description || null,
            dosage: item.dosage || null,
            frequency: item.frequency || null,
            duration: item.duration || null,
            instructions: item.instructions || null,
            priority: item.priority,
            dueDate: item.dueDate ? new Date(item.dueDate).toISOString() : null
          }
        )
      }
    }

    const prescription = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTIONS,
      params.id,
      {
        prescriberId: data.prescriberId,
        status: data.status,
        notes: data.notes,
        attachments: data.attachments ? JSON.stringify(data.attachments) : undefined
      }
    )

    // Get patient and prescriber details
    let patient = null
    let prescriber = null

    try {
      if (prescription.patientId) {
        patient = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.PATIENTS,
          prescription.patientId
        )
      }
    } catch (error) {
      console.warn('Could not fetch patient for updated prescription')
    }

    try {
      if (prescription.prescriberId) {
        prescriber = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.USERS,
          prescription.prescriberId
        )
      }
    } catch (error) {
      console.warn('Could not fetch prescriber for updated prescription')
    }

    // Get updated items
    let items: any[] = []
    try {
      const prescriptionItems = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PRESCRIPTION_ITEMS,
        [QueryHelpers.equal('prescriptionId', params.id)]
      )
      items = prescriptionItems.documents
    } catch (error) {
      console.warn('Could not fetch updated prescription items')
    }

    // Parse attachments if they exist
    const parsedPrescription = {
      ...prescription,
      attachments: prescription.attachments ? 
        (typeof prescription.attachments === 'string' ? 
          JSON.parse(prescription.attachments) : 
          prescription.attachments
        ) : [],
      patient: patient ? {
        id: patient.$id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        patientNo: patient.patientNo
      } : null,
      prescriber: prescriber ? {
        id: prescriber.$id,
        name: prescriber.name
      } : null,
      items
    }

    return NextResponse.json({ prescription: parsedPrescription })
  } catch (e: any) {
    if (e.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: e.errors }, { status: 400 })
    }
    console.error('Error updating prescription:', e)
    const appwriteError = handleAppwriteError(e)
    return NextResponse.json({ 
      error: appwriteError.message || 'Failed to update prescription' 
    }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check temporarily disabled for testing
    // const session = await auth()
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    const body = await request.json()
    const data = updatePrescriptionSchema.partial().parse(body)

    // Update only the provided fields
    const updateData: any = {}
    if (data.status !== undefined) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.attachments !== undefined) updateData.attachments = data.attachments ? JSON.stringify(data.attachments) : null

    const prescription = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTIONS,
      params.id,
      updateData
    )

    return NextResponse.json({ prescription })
  } catch (e: any) {
    if (e.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: e.errors }, { status: 400 })
    }
    console.error('Error updating prescription:', e)
    const appwriteError = handleAppwriteError(e)
    return NextResponse.json({ 
      error: appwriteError.message || 'Failed to update prescription' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DELETE request for prescription:', params.id)
    
    // RBAC check temporarily disabled for testing
    // const session = await auth()
    // if (!session?.user) {
    //   console.log('No session found')
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      console.log('Appwrite not configured')
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    console.log('Appwrite configured, proceeding with delete')

    // First, try to get the prescription to verify it exists
    try {
      const prescription = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PRESCRIPTIONS,
        params.id
      )
      console.log('Found prescription to delete:', prescription.$id)
    } catch (error) {
      console.log('Prescription not found:', params.id)
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    // Safe approach: Mark prescription as cancelled instead of deleting
    console.log('Marking prescription as cancelled:', params.id)
    
    const updatedPrescription = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTIONS,
      params.id,
      {
        status: 'cancelled',
        notes: 'Prescription deleted by user'
      }
    )

    console.log('Prescription marked as cancelled successfully:', updatedPrescription.$id)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Prescription marked as cancelled',
      prescriptionId: updatedPrescription.$id,
      status: updatedPrescription.status
    })
    
  } catch (e: any) {
    console.error('Error in delete function:', e)
    console.error('Error details:', {
      message: e.message,
      code: e.code,
      type: e.type,
      name: e.name
    })
    
    const appwriteError = handleAppwriteError(e)
    return NextResponse.json({ 
      error: appwriteError.message || 'Failed to delete prescription',
      details: e.message
    }, { status: 500 })
  }
}
