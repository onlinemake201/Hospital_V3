import { NextResponse } from 'next/server'
import { databases, COLLECTIONS } from '@/lib/appwrite'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { status } = body

    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Validate status values
    const validStatuses = ['paid', 'partial', 'sent', 'overdue', 'pending']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      }, { status: 400 })
    }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    console.log('📝 Updating invoice status:', {
      invoiceId: id,
      newStatus: status
    })

    // Get current invoice to preserve other data
    const currentInvoice = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.INVOICES,
      id
    )

    console.log('📊 Current invoice data:', {
      id: currentInvoice.$id,
      currentStatus: currentInvoice.status,
      balance: currentInvoice.balance,
      amount: currentInvoice.amount
    })

    // Update only the status field
    const updatedInvoice = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.INVOICES,
      id,
      { status: status }
    )

    console.log('✅ Status updated successfully:', {
      invoiceId: id,
      oldStatus: currentInvoice.status,
      newStatus: status,
      updatedInvoice: updatedInvoice
    })

    return NextResponse.json({ 
      success: true,
      invoice: updatedInvoice,
      oldStatus: currentInvoice.status,
      newStatus: status
    })

  } catch (error: any) {
    console.error('❌ Error updating invoice status:', error)
    return NextResponse.json({
      error: 'Failed to update invoice status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
