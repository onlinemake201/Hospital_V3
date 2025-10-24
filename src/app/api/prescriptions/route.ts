import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError, ID } from '@/lib/appwrite'
// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes
import { canReadPrescriptions, canWritePrescriptions } from '@/lib/rbac'
import { z } from 'zod'

// Force dynamic rendering

const createPrescriptionSchema = z.object({
  patientId: z.string().min(1),
  prescriptionNo: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).default('draft'),
  notes: z.string().optional(),
  items: z.array(z.object({
    type: z.enum(['medication', 'bloodtest', 'referral', 'info', 'other']).default('medication'),
    medicationId: z.string().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    instructions: z.string().optional(),
    priority: z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
    dueDate: z.string().optional()
  })).min(1),
  attachments: z.array(z.string()).optional()
})

export async function GET() {
  try {
    // RBAC check temporarily disabled for testing
    // if (!await canReadPrescriptions()) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ prescriptions: [] })
    }

    const prescriptions = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTIONS,
      [
        QueryHelpers.limit(50),
        QueryHelpers.orderDesc('$createdAt')
      ]
    )

    // Get patient, prescriber, and items details for each prescription
    const prescriptionsWithDetails = await Promise.all(
      prescriptions.documents.map(async (prescription) => {
        let patient = null
        let prescriber = null
        let items: any[] = []

        try {
          patient = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
            COLLECTIONS.PATIENTS,
            prescription.patientId
          )
        } catch (error) {
          console.warn('Could not fetch patient for prescription:', prescription.$id)
        }

        try {
          prescriber = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
            COLLECTIONS.USERS,
            prescription.prescriberId
          )
        } catch (error) {
          console.warn('Could not fetch prescriber for prescription:', prescription.$id)
          // Fallback: Create a default prescriber object
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
                  console.warn('Could not fetch medication for prescription item:', item.$id)
                }
              }

              return {
                id: item.$id,
                prescriptionId: item.prescriptionId,
                type: item.type,
                medicationId: item.medicationId,
                title: item.title,
                description: item.description,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                instructions: item.instructions,
                priority: item.priority,
                dueDate: item.dueDate,
                createdAt: item.$createdAt,
                updatedAt: item.$updatedAt,
                medication
              }
            })
          )
        } catch (error) {
          console.warn('Could not fetch items for prescription:', prescription.$id)
        }

        // Check if this prescription has already been converted to an invoice
        let isInvoiced = false
        let invoiceNo = null
        try {
          const invoiceQuery = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
            COLLECTIONS.INVOICES,
            [QueryHelpers.equal('prescriptionId', prescription.$id)]
          )
          
          if (invoiceQuery.documents.length > 0) {
            isInvoiced = true
            invoiceNo = invoiceQuery.documents[0].invoiceNo
          }
        } catch (error) {
          console.warn('Could not check invoice status for prescription:', prescription.$id)
        }

        return {
          $id: prescription.$id,
          prescriptionNo: prescription.prescriptionNo,
          patientId: prescription.patientId,
          prescriberId: prescription.prescriberId,
          status: prescription.status,
          notes: prescription.notes,
          attachments: prescription.attachments ? JSON.parse(prescription.attachments) : [],
          createdAt: prescription.$createdAt,
          updatedAt: prescription.$updatedAt,
          isInvoiced,
          invoiceNo,
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
      })
    )

    return NextResponse.json({ prescriptions: prescriptionsWithDetails })
  } catch (error: any) {
    console.error('Error fetching prescriptions:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: 'Failed to fetch prescriptions',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Temporarily disable session check for testing
    // const session = await getServerSession(authOptions)
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // RBAC check temporarily disabled for testing
    // if (!await canWritePrescriptions()) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    const body = await request.json()
    console.log('Received prescription data:', body)
    
    const data = createPrescriptionSchema.parse(body)
    console.log('Parsed prescription data:', data)
    
    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ 
        error: 'Appwrite not configured' 
      }, { status: 503 })
    }
    
    // Generate prescription number if not provided
    let prescriptionNo = data.prescriptionNo
    if (!prescriptionNo) {
      try {
        const lastPrescriptions = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.PRESCRIPTIONS,
          [
            QueryHelpers.limit(1),
            QueryHelpers.orderDesc('prescriptionNo')
          ]
        )
        
        if (lastPrescriptions.documents.length > 0) {
          const lastNo = lastPrescriptions.documents[0].prescriptionNo
          const nextNumber = parseInt(lastNo.slice(2)) + 1
          prescriptionNo = `RX${String(nextNumber).padStart(3, '0')}`
        } else {
          prescriptionNo = 'RX001'
        }
      } catch (error) {
        prescriptionNo = 'RX001'
      }
    }

    // Get the current user as prescriber
    // Temporarily disable session-based prescriber assignment
    // const currentUser = session.user
    let prescriberId = null
    
    // Use provided prescriberId or default to admin_user
    if ((data as any).prescriberId) {
      prescriberId = (data as any).prescriberId
    } else {
      prescriberId = 'admin_user' // Default prescriber
    }
    
    // if (currentUser) {
    //   // Check if user exists in database
    //   try {
    //     const userQuery = await databases.listDocuments(
    //       process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
    //       COLLECTIONS.USERS,
    //       [QueryHelpers.equal('$id', currentUser.id)]
    //     )
    //     
    //     if (userQuery.documents.length > 0) {
    //       prescriberId = currentUser.id
    //     } else {
    //       console.warn('User not found in database:', currentUser.id)
    //     }
    //   } catch (error) {
    //     console.warn('Could not fetch user from database:', error)
    //   }
    // }

    const prescriptionData = {
        prescriptionNo,
        patientId: data.patientId,
        prescriberId: prescriberId, // Use current authenticated user
        status: data.status,
        notes: data.notes,
        attachments: data.attachments ? JSON.stringify(data.attachments) : null
    }

    const prescription = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTIONS,
      ID.unique(),
      prescriptionData
    )

    // Create prescription items
    const items = await Promise.all(
      data.items.map(async (item) => {
        const itemData = {
          prescriptionId: prescription.$id,
          type: item.type,
          medicationId: item.medicationId || null,
          title: item.title,
          description: item.description || null,
          dosage: item.dosage || null,
          frequency: item.frequency || null,
          duration: item.duration || null,
          instructions: item.instructions || null,
          priority: item.priority,
          dueDate: item.dueDate || null
        }

        return await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.PRESCRIPTION_ITEMS,
          ID.unique(),
          itemData
        )
      })
    )

    // Get patient and prescriber details
    let patient = null
    let prescriber = null

    try {
      patient = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PATIENTS,
        data.patientId
      )
    } catch (error) {
      console.warn('Could not fetch patient for new prescription')
    }

    try {
      prescriber = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.USERS,
        prescriberId || 'admin_user'
      )
    } catch (error) {
      console.warn('Could not fetch prescriber for new prescription')
    }

    // Get medication details for items
    const itemsWithMedications = await Promise.all(
      items.map(async (item) => {
        let medication = null
        if (item.medicationId) {
          try {
            medication = await databases.getDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
              COLLECTIONS.MEDICATIONS,
              item.medicationId
            )
          } catch (error) {
            console.warn('Could not fetch medication for prescription item:', item.$id)
          }
        }

        return {
          id: item.$id,
          prescriptionId: item.prescriptionId,
            type: item.type,
          medicationId: item.medicationId,
            title: item.title,
            description: item.description,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions,
            priority: item.priority,
          dueDate: item.dueDate,
          createdAt: item.$createdAt,
          updatedAt: item.$updatedAt,
          medication
        }
      })
    )

    // Auto-create invoice for medication items
    const medicationItems = itemsWithMedications.filter(item => item.type === 'medication' && item.medicationId)
    
    if (medicationItems.length > 0) {
      try {
        // Get system currency
        const currencySettings = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.SYSTEM_SETTINGS,
          [QueryHelpers.equal('key', 'currency')]
        )
        const currency = currencySettings.documents.length > 0 ? currencySettings.documents[0].value : 'CHF'

        // Generate invoice number
        const lastInvoices = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.INVOICES,
          [
            QueryHelpers.limit(1),
            QueryHelpers.orderDesc('invoiceNo')
          ]
        )
        const invoiceNo = lastInvoices.documents.length > 0 ? 
          `INV${String(parseInt(lastInvoices.documents[0].invoiceNo.slice(3)) + 1).padStart(4, '0')}` : 
          'INV0001'

        // Calculate total amount
        let totalAmount = 0
        const invoiceItems = []

        for (const item of medicationItems) {
          if (item.medication) {
            const itemAmount = item.medication.pricePerUnit || 0
            
            // Only include medications with valid prices
            if (itemAmount > 0) {
              totalAmount += itemAmount
              
              invoiceItems.push({
                description: `${item.medication.name} - ${item.title}`,
                quantity: 1,
                unitPrice: itemAmount,
                amount: itemAmount
              })
            }
          }
        }

        // Only create invoice if there are items with valid prices
        if (invoiceItems.length > 0) {
          const invoiceData = {
              invoiceNo,
              patientId: data.patientId,
            issueDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              amount: totalAmount,
              balance: totalAmount,
              status: 'pending',
              currency,
              items: JSON.stringify(invoiceItems),
              // notes: `Auto-generated from prescription ${prescriptionNo}` // Temporarily disabled until field is added to Appwrite
            }

          await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
            COLLECTIONS.INVOICES,
            ID.unique(),
            invoiceData
          )
        }
      } catch (invoiceError) {
        console.error('Error creating auto-invoice:', invoiceError)
        // Don't fail the prescription creation if invoice creation fails
      }
    }

    const prescriptionWithDetails = {
      id: prescription.$id,
      prescriptionNo: prescription.prescriptionNo,
      patientId: prescription.patientId,
      prescriberId: prescription.prescriberId,
      status: prescription.status,
      notes: prescription.notes,
      attachments: prescription.attachments ? JSON.parse(prescription.attachments) : [],
      createdAt: prescription.$createdAt,
      updatedAt: prescription.$updatedAt,
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
      items: itemsWithMedications
    }

    return NextResponse.json({ prescription: prescriptionWithDetails })
  } catch (error: any) {
    console.error('Error creating prescription:', error)
    
    if (error.name === 'ZodError') {
      console.error('Validation error:', error.errors)
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    const appwriteError = handleAppwriteError(error)
    console.error('Appwrite error:', appwriteError)
    
    return NextResponse.json({ 
      error: 'Failed to create prescription',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined,
      originalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}