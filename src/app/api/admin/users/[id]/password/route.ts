import { NextResponse } from 'next/server'
import { canManageUsers } from '@/lib/rbac'
import { databases, COLLECTIONS, handleAppwriteError } from '@/lib/appwrite'
// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { z } from 'zod'
// Force dynamic rendering
import bcrypt from 'bcryptjs'

const updatePasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters")
})

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check permissions
    if (!await canManageUsers()) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const data = updatePasswordSchema.parse(body)

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    // Hash the password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(data.password, saltRounds)

    // Update password hash in database
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.USERS,
      params.id,
      {
        passwordHash: passwordHash
      }
    )

    return NextResponse.json({ 
      message: 'Password updated successfully' 
    })

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error updating password:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: appwriteError.message || 'Failed to update password' 
    }, { status: 500 })
  }
}
