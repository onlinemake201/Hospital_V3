import { NextRequest, NextResponse } from 'next/server'
import { storage, COLLECTIONS } from '@/lib/appwrite'
import { ID } from 'appwrite'
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering
export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    // Upload to Appwrite Storage
    const result = await storage.createFile(
      COLLECTIONS.MEDICATION_IMAGES, // We'll need to create this bucket
      ID.unique(),
      file
    )

    // Get the file URL
    const fileUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${COLLECTIONS.MEDICATION_IMAGES}/files/${result.$id}/view?project=${process.env.APPWRITE_PROJECT_ID}`
    
    return NextResponse.json({ 
      imageUrl: fileUrl,
      fileName: file.name,
      size: file.size,
      type: file.type,
      fileId: result.$id
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}