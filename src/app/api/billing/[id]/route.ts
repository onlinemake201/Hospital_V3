import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError } from '@/lib/appwrite'
import { canReadBilling } from '@/lib/rbac'
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    // Get the invoice
    let invoice
    try {
      invoice = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.INVOICES,
        id
      )
    } catch (error: any) {
      console.error('Error fetching invoice:', error)
      if (error.code === 404) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }
      throw error
    }

    // DISABLED: Status update to preserve manual changes
    console.log('⏭️ Status update disabled for invoice detail view:', invoice.$id, 'status:', invoice.status)

    // Fetch patient data
    let patient = null
    if (invoice.patientId) {
      try {
        // First try to find by patientNo if it looks like a patient number
        if (invoice.patientId.startsWith('P')) {
          const patientsQuery = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
            COLLECTIONS.PATIENTS,
            [QueryHelpers.equal('patientNo', invoice.patientId)]
          )
          
          if (patientsQuery.documents.length > 0) {
            const patientDoc = patientsQuery.documents[0]
            patient = {
              id: patientDoc.$id,
              firstName: patientDoc.firstName,
              lastName: patientDoc.lastName,
              patientNo: patientDoc.patientNo,
              address: patientDoc.address || ''
            }
          }
        } else {
          // Try to get by ID
          const patientDoc = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
            COLLECTIONS.PATIENTS,
            invoice.patientId
          )
          patient = {
            id: patientDoc.$id,
            firstName: patientDoc.firstName,
            lastName: patientDoc.lastName,
            patientNo: patientDoc.patientNo,
            address: patientDoc.address || ''
          }
        }
      } catch (error) {
        console.error('Error fetching patient for invoice:', invoice.$id, error)
        // Create a fallback patient object
        patient = {
          id: invoice.patientId || invoice.$id,
          firstName: 'Unknown',
          lastName: 'Patient',
          patientNo: invoice.patientId?.startsWith('P') ? invoice.patientId : `INV-${invoice.invoiceNo}`,
          address: ''
        }
      }
    }

    // Ensure every invoice has a patient object
    if (!patient) {
      patient = {
        id: invoice.patientId || invoice.$id,
        firstName: 'Unknown',
        lastName: 'Patient',
        patientNo: invoice.patientId?.startsWith('P') ? invoice.patientId : `INV-${invoice.invoiceNo}`,
        address: ''
      }
    }

    // Fetch payments for this invoice
    let payments: any[] = []
    try {
      const paymentsQuery = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PAYMENTS,
        [QueryHelpers.equal('invoiceId', invoice.$id)]
      )
      payments = paymentsQuery.documents.map(payment => ({
        id: payment.$id,
        amount: payment.amount,
        method: payment.method,
        paidAt: payment.paymentDate,
        reference: payment.notes || ''
      }))
    } catch (error) {
      console.error('Error fetching payments for invoice:', invoice.$id, error)
      // Continue without payments
    }

    console.log('📊 Returning invoice with updated status:', {
      id: invoice.$id,
      status: invoice.status,
      balance: invoice.balance,
      amount: invoice.amount,
      dueDate: invoice.dueDate
    })

    return NextResponse.json({
      invoice: {
        ...invoice,
        patient: patient,
        payments: payments,
        // Parse items if it's a string
        items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items
      }
    })
  } catch (error: any) {
    console.error('Error fetching invoice:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({
      error: appwriteError.message || 'Failed to fetch invoice'
    }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()

    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    console.log('📝 Updating invoice:', id, 'with data:', body)

    const updatedInvoice = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.INVOICES,
      id,
      body
    )

    console.log('✅ Invoice updated successfully:', updatedInvoice)

    // DISABLED: Status update to preserve manual changes
    console.log('⏭️ Status update disabled after invoice edit:', updatedInvoice.$id, 'status:', updatedInvoice.status)

    return NextResponse.json({ 
      invoice: updatedInvoice,
      statusUpdated: false // Status update disabled to preserve manual changes
    })
  } catch (error: any) {
    console.error('Error updating invoice:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({
      error: appwriteError.message || 'Failed to update invoice'
    }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.INVOICES,
      id
    )

    console.log('✅ Invoice deleted successfully:', id)
    return NextResponse.json({ 
      success: true,
      message: 'Invoice deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting invoice:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({
      error: appwriteError.message || 'Failed to delete invoice'
    }, { status: 500 })
  }
}
