import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError } from '@/lib/appwrite'
import { canReadInventory, canWriteInventory } from '@/lib/rbac'
// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { z } from 'zod'
// Force dynamic rendering

const updateMedicationSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  form: z.string().optional(),
  strength: z.string().optional(),
  minStock: z.number().int().min(0),
  currentStock: z.number().int().min(0),
  barcode: z.string().optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  pricePerUnit: z.number().min(0).default(0)
})

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // RBAC check temporarily disabled for testing
    // if (!await canReadInventory()) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    const medication = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.MEDICATIONS,
      params.id
    )

    // Get supplier
    let supplier = null
    if (medication.supplierId) {
      try {
        supplier = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.SUPPLIERS,
          medication.supplierId
        )
      } catch (error) {
        console.warn('Could not fetch supplier for medication:', params.id)
      }
    }

    const medicationWithDetails = {
      id: medication.$id,
      code: medication.code,
      name: medication.name,
      form: medication.form,
      strength: medication.strength,
      supplierId: medication.supplierId,
      minStock: medication.minStock,
      currentStock: medication.currentStock || 0,
      barcode: medication.barcode,
      imageUrl: medication.imageUrl,
      description: medication.description,
      pricePerUnit: medication.pricePerUnit,
      createdAt: medication.$createdAt,
      updatedAt: medication.$updatedAt,
      batches: [],
      supplier: supplier ? {
        id: supplier.$id,
        name: supplier.name
      } : null
    }

    return NextResponse.json({ medication: medicationWithDetails }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('Error fetching medication:', error)
    const appwriteError = handleAppwriteError(error)
    if (appwriteError.error === 'Not Found') {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 })
    }
    return NextResponse.json({ 
      error: 'Failed to fetch medication',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // RBAC check temporarily disabled for testing
    // if (!await canWriteInventory()) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    const body = await request.json()
    const data = updateMedicationSchema.parse(body)
    
    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }
    
    const medication = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.MEDICATIONS,
      params.id,
      data
    )

    // Get supplier details
    let supplier = null
    if (medication.supplierId) {
      try {
        supplier = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.SUPPLIERS,
          medication.supplierId
        )
      } catch (error) {
        console.warn('Could not fetch supplier for updated medication')
      }
    }
    
    const medicationWithDetails = {
      id: medication.$id,
      code: medication.code,
      name: medication.name,
      form: medication.form,
      strength: medication.strength,
      supplierId: medication.supplierId,
      minStock: medication.minStock,
      currentStock: medication.currentStock || 0,
      barcode: medication.barcode,
      imageUrl: medication.imageUrl,
      description: medication.description,
      pricePerUnit: medication.pricePerUnit,
      createdAt: medication.$createdAt,
      updatedAt: medication.$updatedAt,
      supplier: supplier ? {
        id: supplier.$id,
        name: supplier.name
      } : null
    }
    
    return NextResponse.json({ medication: medicationWithDetails }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error updating medication:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: 'Failed to update medication',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}