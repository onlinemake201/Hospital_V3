import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError, ID } from '@/lib/appwrite'
import { canManageRoles } from '@/lib/rbac'
// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { z } from 'zod'
// Force dynamic rendering

const updateRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  permissions: z.array(z.string()).optional()
})

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check permissions
    if (!await canManageRoles()) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateRoleSchema.parse(body)

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    const role = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.ROLES,
      params.id,
      {
        name: data.name,
        permissions: data.permissions ? JSON.stringify(data.permissions) : undefined
      }
    )

    return NextResponse.json({ 
      role: {
        id: role.$id,
        name: role.name,
        permissions: role.permissions ? JSON.parse(role.permissions) : [],
        createdAt: role.$createdAt,
        updatedAt: role.$updatedAt
      }
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error updating role:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: appwriteError.message || 'Failed to update role' 
    }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check permissions
    if (!await canManageRoles()) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    // Check if any users are using this role
    const usersWithRole = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.USERS,
      [QueryHelpers.equal('roleId', params.id)]
    )

    if (usersWithRole.documents.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete role that is assigned to users' 
      }, { status: 400 })
    }

    await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.ROLES,
      params.id
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting role:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: appwriteError.message || 'Failed to delete role' 
    }, { status: 500 })
  }
}