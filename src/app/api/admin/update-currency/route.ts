import { NextResponse } from 'next/server'
import { databases, COLLECTIONS } from '@/lib/appwrite'
import { getCurrency } from '@/lib/system-settings'
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering
export async function POST() {
  try {
    // Get current system currency
    const systemCurrency = await getCurrency()
    
    // Update all existing invoices to use the system currency
    const invoices = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || "hospital_main", 
      COLLECTIONS.INVOICES
    )
    
    let updatedCount = 0
    for (const invoice of invoices.documents) {
      if (invoice.currency !== systemCurrency) {
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID || "hospital_main", 
          COLLECTIONS.INVOICES,
          invoice.$id,
          { currency: systemCurrency }
        )
        updatedCount++
      }
    }
    
    return NextResponse.json({ 
      message: `Updated ${updatedCount} invoices to use ${systemCurrency}`,
      updatedCount: updatedCount,
      currency: systemCurrency
    })
  } catch (error: any) {
    console.error('Error updating currency:', error)
    return NextResponse.json({ error: 'Failed to update currency' }, { status: 500 })
  }
}
