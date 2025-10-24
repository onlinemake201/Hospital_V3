import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError, ID } from '@/lib/appwrite'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const prescriptionId = params.id

    // Get the prescription
    const prescription = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTIONS,
      prescriptionId
    )

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    // Check if prescription is completed
    if (prescription.status !== 'completed') {
      return NextResponse.json({ error: 'Only completed prescriptions can be converted to invoices' }, { status: 400 })
    }

    // Check if this specific prescription has already been converted to an invoice
    // We'll add a prescriptionId field to invoices to track this
    const existingInvoices = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.INVOICES,
      [QueryHelpers.equal('prescriptionId', prescriptionId)]
    )

    if (existingInvoices.documents.length > 0) {
      return NextResponse.json({ 
        error: 'This prescription has already been converted to an invoice',
        invoiceId: existingInvoices.documents[0].$id,
        invoiceNo: existingInvoices.documents[0].invoiceNo
      }, { status: 409 })
    }

    // Get prescription items
    const itemsResult = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTION_ITEMS,
      [QueryHelpers.equal('prescriptionId', prescriptionId)]
    )

    // Create invoice with proper structure matching billing API
    const today = new Date()
    const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    
    const invoiceData = {
      patientId: prescription.patientId,
      prescriptionId: prescriptionId, // Track which prescription this invoice came from
      invoiceNo: `INV-${Date.now()}`,
      issueDate: today.toISOString(),
      dueDate: dueDate.toISOString(),
      items: JSON.stringify([]),
      amount: 0,
      balance: 0,
      currency: 'USD', // Default currency
      status: 'draft'
    }

    const invoice = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.INVOICES,
      ID.unique(),
      invoiceData
    )

    // Update prescription status to completed
    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PRESCRIPTIONS,
      prescriptionId,
      {
        status: 'completed'
      }
    )

    return NextResponse.json({
      success: true,
      message: `Prescription ${prescription.prescriptionNo} successfully converted to invoice ${invoice.invoiceNo}`,
      invoice: {
        id: invoice.$id,
        invoiceNo: invoice.invoiceNo,
        prescriptionNo: prescription.prescriptionNo
      }
    })

  } catch (error: any) {
    console.error('Error converting prescription to invoice:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      response: error.response
    })
    return NextResponse.json({ 
      error: 'Failed to convert prescription to invoice',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}