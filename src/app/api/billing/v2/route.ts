import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers } from '@/lib/appwrite'
import { getCurrency } from '@/lib/system-settings'

export const dynamic = 'force-dynamic'

// DISABLED: Automatic status update function to prevent manual status override
async function updateInvoiceStatus(invoice: any) {
  // FIXED: Disable automatic status updates to prevent manual status override
  // Manual status changes should be preserved and not overridden
  console.log('⏭️ Status update disabled to preserve manual changes:', invoice.$id, 'status:', invoice.status)
  return invoice
}

export async function GET() {
  try {
    console.log('🔄 Fetching invoices...')
    
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    // Fetch invoices with patient data
    const invoicesResponse = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.INVOICES,
      [
        QueryHelpers.orderDesc('$createdAt'),
        QueryHelpers.limit(1000)
      ]
    )

    console.log('📊 Found invoices:', invoicesResponse.documents.length)

    // Process invoices and apply status updates
    const processedInvoices = await Promise.all(
      invoicesResponse.documents.map(async (invoice) => {
        // Fix inconsistent paid invoices with non-zero balance
        if (invoice.status === 'paid' && Number(invoice.balance) > 0) {
          console.log('🔧 Fixing inconsistent paid invoice:', invoice.$id, 'balance:', invoice.balance)
          try {
            await databases.updateDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
              COLLECTIONS.INVOICES,
              invoice.$id,
              { balance: 0 }
            )
            invoice.balance = 0
            console.log('✅ Fixed balance for paid invoice:', invoice.$id)
          } catch (error) {
            console.error('❌ Failed to fix balance for invoice:', invoice.$id, error)
          }
        }
        
        // Apply status update logic
        const updatedInvoice = await updateInvoiceStatus(invoice)
        
        // Fetch patient data
        let patient = null
        if (invoice.patientId) {
          try {
            const patientResponse = await databases.getDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
              COLLECTIONS.PATIENTS,
              invoice.patientId
            )
            patient = {
              id: patientResponse.$id,
              firstName: patientResponse.firstName,
              lastName: patientResponse.lastName,
              patientNo: patientResponse.patientNo
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch patient for invoice:', invoice.$id)
            patient = {
              id: invoice.patientId,
              firstName: 'Unknown',
              lastName: 'Patient',
              patientNo: 'N/A'
            }
          }
        }

        return {
          $id: updatedInvoice.$id,
          invoiceNo: updatedInvoice.invoiceNo,
          issueDate: updatedInvoice.issueDate,
          dueDate: updatedInvoice.dueDate,
          amount: Number(updatedInvoice.amount),
          balance: Number(updatedInvoice.balance),
          status: updatedInvoice.status,
          currency: updatedInvoice.currency,
          items: updatedInvoice.items,
          patientId: updatedInvoice.patientId,
          patient: patient,
          payments: updatedInvoice.payments || [],
          $createdAt: updatedInvoice.$createdAt,
          $updatedAt: updatedInvoice.$updatedAt
        }
      })
    )

    console.log('✅ Processed invoices:', processedInvoices.length)

    return NextResponse.json({
      invoices: processedInvoices,
      total: processedInvoices.length,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Error fetching invoices:', error)
    return NextResponse.json({
      error: 'Failed to fetch invoices',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { patientId, amount, dueDate, items, currency } = body

    if (!patientId || !amount || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate invoice number
    const invoiceNo = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-6)}`

    const invoiceData = {
      invoiceNo,
      patientId,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate,
      amount: Number(amount),
      balance: Number(amount),
      status: 'draft',
      currency: currency || 'CHF',
      items: JSON.stringify(items || []),
      payments: []
    }

    const invoice = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.INVOICES,
      'unique()',
      invoiceData
    )

    console.log('✅ Invoice created:', invoice.$id)

    return NextResponse.json({
      success: true,
      invoice: {
        $id: invoice.$id,
        invoiceNo: invoice.invoiceNo,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        amount: Number(invoice.amount),
        balance: Number(invoice.balance),
        status: invoice.status,
        currency: invoice.currency,
        items: invoice.items,
        patientId: invoice.patientId,
        payments: invoice.payments || []
      }
    })

  } catch (error: any) {
    console.error('❌ Error creating invoice:', error)
    return NextResponse.json({
      error: 'Failed to create invoice',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
