import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError, ID } from '@/lib/appwrite'
import { canManageUsers } from '@/lib/rbac'
// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { z } from 'zod'
// Force dynamic rendering

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  roleId: z.string().optional(),
  active: z.boolean().optional()
})

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check permissions
    if (!await canManageUsers()) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    const user = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.USERS,
      params.id
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get role details
    let role = null
    if (user.roleId) {
      try {
        role = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.ROLES,
          user.roleId
        )
      } catch (error) {
        console.warn('Could not fetch role for user:', params.id)
      }
    }

    return NextResponse.json({ 
      user: {
        id: user.$id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        active: user.active,
        createdAt: user.$createdAt,
        updatedAt: user.$updatedAt,
        role: role ? {
          id: role.$id,
          name: role.name,
          permissions: role.permissions ? JSON.parse(role.permissions) : []
        } : null
      }
    })
  } catch (error: any) {
    console.error('Error fetching user:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: appwriteError.message || 'Failed to fetch user' 
    }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check permissions
    if (!await canManageUsers()) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateUserSchema.parse(body)

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    // Check if email is being changed and if it already exists
    if (data.email) {
      const existingUsers = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.USERS,
        [QueryHelpers.equal('email', data.email)]
      )
      
      const existingUser = existingUsers.documents.find(user => user.$id !== params.id)
      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.email) updateData.email = data.email
    if (data.roleId !== undefined) updateData.roleId = data.roleId
    if (data.active !== undefined) updateData.active = data.active
    
    // Note: Password updates are handled separately via Appwrite's user management API
    // We don't store passwords in our custom users collection

    const user = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.USERS,
      params.id,
      updateData
    )

    // Get role details
    let role = null
    if (user.roleId) {
      try {
        role = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.ROLES,
          user.roleId
        )
      } catch (error) {
        console.warn('Could not fetch role for updated user')
      }
    }

    return NextResponse.json({ 
      user: {
        id: user.$id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        active: user.active,
        createdAt: user.$createdAt,
        updatedAt: user.$updatedAt,
        role: role ? {
          id: role.$id,
          name: role.name,
          permissions: role.permissions ? JSON.parse(role.permissions) : []
        } : null
      }
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error updating user:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: appwriteError.message || 'Failed to update user' 
    }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check permissions
    if (!await canManageUsers()) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    // Check if this is the last admin user
    const adminUsers = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.USERS,
      [QueryHelpers.equal('roleId', 'admin')]
    )

    if (adminUsers.documents.length <= 1) {
      return NextResponse.json({ 
        error: 'Cannot delete the last admin user' 
      }, { status: 400 })
    }

    // Check if user has admin role
    const user = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.USERS,
      params.id
    )

    if (user.roleId === 'admin') {
      const role = await databases.getDocument(
        process.env.APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.ROLES,
        user.roleId
      )
      
      if (role.name === 'Admin') {
        return NextResponse.json({ 
          error: 'Cannot delete admin user' 
        }, { status: 400 })
      }
    }

    await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.USERS,
      params.id
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: appwriteError.message || 'Failed to delete user' 
    }, { status: 500 })
  }
}