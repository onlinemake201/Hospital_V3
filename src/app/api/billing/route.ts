import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError, ID } from '@/lib/appwrite'
import { canReadBilling, canWriteBilling } from '@/lib/rbac'
// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { getCurrency } from '@/lib/system-settings'
// Force dynamic rendering
import { z } from 'zod'

// Funktion zur automatischen Statusaktualisierung
async function updateInvoiceStatus(invoice: any) {
  const balance = Number(invoice.balance)
  const amount = Number(invoice.amount)
  const dueDate = new Date(invoice.dueDate)
  const today = new Date()
  
  let newStatus = invoice.status
  
  // Automatische Statuslogik
  if (balance <= 0) {
    newStatus = 'paid'
  } else if (balance < amount) {
    newStatus = 'partial'
  } else if (today > dueDate) {
    newStatus = 'overdue'
  } else {
    newStatus = 'pending'
  }
  
  console.log('🔄 Status update check:', {
    invoiceId: invoice.$id,
    currentStatus: invoice.status,
    newStatus: newStatus,
    balance: balance,
    amount: amount,
    dueDate: dueDate.toISOString(),
    today: today.toISOString(),
    isOverdue: today > dueDate
  })
  
  // Status nur aktualisieren wenn sich etwas geändert hat
  if (newStatus !== invoice.status) {
    try {
      console.log('📝 Updating invoice status:', invoice.$id, 'from', invoice.status, 'to', newStatus)
      
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.INVOICES,
        invoice.$id,
        { status: newStatus }
      )
      
      console.log('✅ Status updated successfully')
    } catch (error) {
      console.error('❌ Error updating invoice status:', error)
    }
  } else {
    console.log('⏭️ Status unchanged, skipping update')
  }
  
  return newStatus
}

const createInvoiceSchema = z.object({
  patientId: z.string().min(1),
  invoiceNo: z.string().optional(),
  issueDate: z.string().transform(str => new Date(str).toISOString()),
  dueDate: z.string().transform(str => new Date(str).toISOString()),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(0),
    unitPrice: z.number().min(0),
    total: z.number().min(0)
  })),
  subtotal: z.number().min(0),
  taxRate: z.number().min(0).max(100).default(0),
  taxAmount: z.number().min(0).default(0),
  total: z.number().min(0),
  notes: z.string().optional(),
  status: z.enum(['draft', 'pending', 'partial', 'paid', 'overdue', 'cancelled']).default('draft')
})

export async function GET(request: Request) {
  try {
    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ invoices: [] })
    }

    // Parse URL to check for prescriptionId filter
    const url = new URL(request.url)
    const prescriptionId = url.searchParams.get('prescriptionId')

    // Build query array
    const queries = [QueryHelpers.orderDesc('issueDate')]
    if (prescriptionId) {
      queries.push(QueryHelpers.equal('prescriptionId', prescriptionId))
    }

    const invoices = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.INVOICES,
      queries
    )

    // Update status for all invoices and fetch patient data
    const updatedInvoices = await Promise.all(
      invoices.documents.map(async (invoice) => {
        const newStatus = await updateInvoiceStatus(invoice)
        
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
        
        return {
          ...invoice,
          status: newStatus,
          patient: patient,
          payments: payments,
          // Parse items if it's a string
          items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items
        }
      })
    )

    return NextResponse.json({ 
      invoices: updatedInvoices
    })
  } catch (error: any) {
    console.error('Error fetching invoices:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({
      error: appwriteError.message || 'Failed to fetch invoices'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Temporarily disable RBAC check for billing creation
    // TODO: Re-enable after session issues are resolved
    // if (!await canWriteBilling()) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    const body = await request.json()
    const data = createInvoiceSchema.parse(body)
    
    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    // Generate unique invoice number if not provided
    if (!data.invoiceNo) {
      const currency = await getCurrency()
      const year = new Date().getFullYear()
      const month = String(new Date().getMonth() + 1).padStart(2, '0')
      
      // Generate a more unique invoice number using timestamp
      const timestamp = Date.now()
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      data.invoiceNo = `INV-${year}${month}-${timestamp.toString().slice(-6)}-${randomSuffix}`
      
      // Double-check uniqueness (retry if needed)
      let attempts = 0
      while (attempts < 5) {
        try {
          const existingInvoice = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
            COLLECTIONS.INVOICES,
            [QueryHelpers.equal('invoiceNo', data.invoiceNo)]
          )
          
          if (existingInvoice.total === 0) {
            break // Invoice number is unique
          }
          
          // Generate new number if conflict exists
          const newTimestamp = Date.now()
          const newRandomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
          data.invoiceNo = `INV-${year}${month}-${newTimestamp.toString().slice(-6)}-${newRandomSuffix}`
          attempts++
        } catch (error) {
          console.error('Error checking invoice number uniqueness:', error)
          break
        }
      }
    }

    const invoiceData = {
      patientId: data.patientId,
      invoiceNo: data.invoiceNo,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      items: JSON.stringify(data.items),
      amount: data.total,
      balance: data.total,
      currency: await getCurrency(),
      status: data.status
    }

    const invoice = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.INVOICES,
      ID.unique(),
      invoiceData
    )

    return NextResponse.json({ 
      invoice
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error creating invoice:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({
      error: appwriteError.message || 'Failed to create invoice'
    }, { status: 500 })
  }
}