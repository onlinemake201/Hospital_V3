import { NextResponse } from 'next/server'
import { databases, COLLECTIONS } from '@/lib/appwrite'
import { updateInvoiceStatus } from '@/app/api/billing/route'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    console.log('🔄 Manual status update requested for invoice:', id)

    // Get the current invoice
    const invoice = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.INVOICES,
      id
    )

    console.log('📊 Current invoice data:', {
      id: invoice.$id,
      status: invoice.status,
      balance: invoice.balance,
      amount: invoice.amount,
      dueDate: invoice.dueDate
    })

    // Update the status
    const newStatus = await updateInvoiceStatus(invoice)

    console.log('✅ Manual status update completed:', newStatus)

    return NextResponse.json({ 
      success: true,
      invoiceId: id,
      oldStatus: invoice.status,
      newStatus: newStatus
    })

  } catch (error: any) {
    console.error('❌ Error in manual status update:', error)
    return NextResponse.json({
      error: 'Failed to update invoice status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
