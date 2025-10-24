import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, handleAppwriteError } from '@/lib/appwrite'
import { z } from 'zod'
// Force dynamic rendering
export const dynamic = 'force-dynamic'
// import { canWriteInventory } from '@/lib/rbac' // Temporarily disabled for testing
// Force dynamic rendering

const updateStockSchema = z.object({
  change: z.number().int(), // Positive for 'in', negative for 'out'
  reason: z.string().optional()
})

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // RBAC check temporarily disabled for testing
    // if (!await canWriteInventory()) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { change, reason } = updateStockSchema.parse(body)

    const medication = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.MEDICATIONS,
      params.id
    )

    let currentStock = medication.currentStock || 0
    currentStock += change

    // Ensure stock doesn't go below zero
    currentStock = Math.max(0, currentStock)

    const updatedMedication = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.MEDICATIONS,
      params.id,
      { currentStock }
    )

    // Optionally record stock movement
    // await recordStockMovement(params.id, change > 0 ? 'in' : 'out', Math.abs(change), reason, null, 'manual_adjustment')

    return NextResponse.json({ medication: updatedMedication })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error updating stock:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({
      error: 'Failed to update stock',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}

const directUpdateStockSchema = z.object({
  currentStock: z.number().int().min(0),
  reason: z.string().optional()
})

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // RBAC check temporarily disabled for testing
    // if (!await canWriteInventory()) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    const body = await request.json()
    const data = directUpdateStockSchema.parse(body)
    
    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }
    
    // Update the medication's current stock
    const medication = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.MEDICATIONS,
      params.id,
      { currentStock: data.currentStock }
    )
    
    return NextResponse.json({ 
      success: true,
      medication: {
        id: medication.$id,
        currentStock: medication.currentStock
      }
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error updating stock:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: 'Failed to update stock',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}