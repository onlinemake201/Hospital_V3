import { NextResponse } from 'next/server'
import { databases, QueryHelpers, handleAppwriteError } from '@/lib/appwrite'
import { COLLECTIONS } from '@/lib/appwrite'
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering
export async function POST(request: Request, { params }: { params: { id: string } }) {
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

    const { amount, method, reference, paidAt } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 })
    }

    // Get the invoice to check balance
    const invoice = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.INVOICES,
      id
    )

    if (amount > invoice.balance) {
      return NextResponse.json({ error: 'Payment amount exceeds balance' }, { status: 400 })
    }

    // Create payment record
    const payment = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.PAYMENTS,
      'unique()', // Auto-generate ID
      {
        invoiceId: id,
        amount: amount,
        method: method || 'cash',
        notes: reference || '',
        paymentDate: paidAt || new Date().toISOString().split('T')[0]
      }
    )

    // Update invoice balance
    const newBalance = invoice.balance - amount
    const newStatus = newBalance <= 0 ? 'paid' : (newBalance < invoice.amount ? 'partial' : 'sent')

    console.log('💰 Payment processed:', {
      invoiceId: id,
      paymentAmount: amount,
      oldBalance: invoice.balance,
      newBalance: newBalance,
      oldStatus: invoice.status,
      newStatus: newStatus
    })

    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.INVOICES,
      id,
      {
        balance: newBalance,
        status: newStatus
      }
    )

    return NextResponse.json({ 
      payment,
      invoice: {
        ...invoice,
        balance: newBalance,
        status: newStatus
      }
    })
  } catch (error: any) {
    console.error('Error recording payment:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({
      error: appwriteError.message || 'Failed to record payment'
    }, { status: 500 })
  }
}


