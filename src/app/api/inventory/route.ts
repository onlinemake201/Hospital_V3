import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError, ID } from '@/lib/appwrite'
import { canReadInventory, canWriteInventory } from '@/lib/rbac'
// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes
import { z } from 'zod'

// Force dynamic rendering

const createMedicationSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  form: z.string().optional(),
  strength: z.string().optional(),
  supplierId: z.string().optional(),
  minStock: z.number().int().min(0).default(0),
  currentStock: z.number().int().min(0).default(0),
  barcode: z.string().optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  pricePerUnit: z.number().min(0).default(0)
})

export async function GET() {
  try {
    // RBAC check temporarily disabled for testing
    // if (!await canReadInventory()) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ medications: [] })
    }

    const medications = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.MEDICATIONS,
      [QueryHelpers.orderAsc('name')]
    )

    // Get supplier details for each medication
    const medicationsWithDetails = await Promise.all(
      medications.documents.map(async (medication) => {
        let supplier = null

        try {
          if (medication.supplierId) {
            supplier = await databases.getDocument(
              process.env.APPWRITE_DATABASE_ID || 'hospital_main',
              COLLECTIONS.SUPPLIERS,
              medication.supplierId
            )
          }
        } catch (error) {
          console.warn('Could not fetch supplier for medication:', medication.$id)
        }

        // Simplified stock tracking - use currentStock from database
        const currentStock = medication.currentStock || 0

        return {
          id: medication.$id,
          code: medication.code,
          name: medication.name,
          form: medication.form,
          strength: medication.strength,
          supplierId: medication.supplierId,
          minStock: medication.minStock,
          barcode: medication.barcode,
          imageUrl: medication.imageUrl,
          description: medication.description,
          pricePerUnit: medication.pricePerUnit,
          createdAt: medication.$createdAt,
          updatedAt: medication.$updatedAt,
          currentStock,
          batches: [],
          supplier: supplier ? {
            id: supplier.$id,
            name: supplier.name
          } : null
        }
      })
    )

    return NextResponse.json({ medications: medicationsWithDetails }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('Error fetching medications:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: 'Failed to fetch medications',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // RBAC check temporarily disabled for testing
    // if (!await canWriteInventory()) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    const body = await request.json()
    const data = createMedicationSchema.parse(body)
    
    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ 
        error: 'Appwrite not configured' 
      }, { status: 503 })
    }
    
    const medication = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.MEDICATIONS,
      ID.unique(),
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
        console.warn('Could not fetch supplier for new medication')
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
    
    return NextResponse.json({ medication: medicationWithDetails })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error creating medication:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: 'Failed to create medication',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}