import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError, ID } from '@/lib/appwrite'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    const prescriptionId = params.id

    // Get the prescription to find the patient
    const prescription = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTIONS,
      prescriptionId
    )

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    // Get all active prescriptions for this patient
    const prescriptionsResult = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTIONS,
      [
        QueryHelpers.equal('patientId', prescription.patientId),
        QueryHelpers.equal('status', 'active')
      ]
    )

    if (prescriptionsResult.documents.length === 0) {
      return NextResponse.json({ error: 'No active prescriptions found for this patient' }, { status: 400 })
    }

    // Get patient data
    let patient = null
    try {
      patient = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PATIENTS,
        prescription.patientId
      )
    } catch (error) {
      console.warn('Could not fetch patient for prescription:', prescriptionId)
    }

    // Create invoice
    const invoiceData = {
      invoiceNo: `INV-${Date.now()}`,
      patientId: prescription.patientId,
      prescriberId: prescription.prescriberId,
      status: 'draft',
      totalAmount: 0, // Will be calculated from items
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      notes: `Invoice created from ${prescriptionsResult.documents.length} prescriptions`,
      prescriptionIds: prescriptionsResult.documents.map(p => p.$id)
    }

    const invoice = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.INVOICES,
      ID.unique(),
      invoiceData
    )

    // Create invoice items from all prescription items
    let totalAmount = 0
    const invoiceItems = []
    const prescriptionIds = []

    for (const prescriptionDoc of prescriptionsResult.documents) {
      prescriptionIds.push(prescriptionDoc.$id)

      // Get prescription items
      const itemsResult = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PRESCRIPTION_ITEMS,
        [QueryHelpers.equal('prescriptionId', prescriptionDoc.$id)]
      )

      for (const item of itemsResult.documents) {
        // Get medication details for pricing
        let medication = null
        let price = 0
        
        if (item.medicationId) {
          try {
            medication = await databases.getDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
              COLLECTIONS.MEDICATIONS,
              item.medicationId
            )
            price = medication.price || 0
          } catch (error) {
            console.warn('Could not fetch medication for item:', item.$id)
          }
        }

        const itemTotal = price * (item.quantity || 1)
        totalAmount += itemTotal

        const invoiceItem = await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.INVOICE_ITEMS,
          ID.unique(),
          {
            invoiceId: invoice.$id,
            medicationId: item.medicationId || null,
            title: item.title,
            description: item.description || '',
            quantity: item.quantity || 1,
            unitPrice: price,
            totalPrice: itemTotal,
            type: 'medication',
            prescriptionId: prescriptionDoc.$id
          }
        )

        invoiceItems.push(invoiceItem)
      }
    }

    // Update invoice with total amount
    const updatedInvoice = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.INVOICES,
      invoice.$id,
      {
        totalAmount: totalAmount
      }
    )

    // Update all prescriptions status to completed
    for (const prescriptionDoc of prescriptionsResult.documents) {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PRESCRIPTIONS,
        prescriptionDoc.$id,
        {
          status: 'completed'
        }
      )
    }

    return NextResponse.json({
      success: true,
      invoice: {
        ...updatedInvoice,
        patient,
        items: invoiceItems
      },
      prescriptionsUpdated: prescriptionIds.length
    })

  } catch (error) {
    console.error('Error converting all prescriptions to invoice:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: appwriteError.message || 'Internal server error' 
    }, { status: 500 })
  }
}