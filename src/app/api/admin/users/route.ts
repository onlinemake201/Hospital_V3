import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError, ID } from '@/lib/appwrite'
import { createAppwriteUser, ensureInitialUsers } from '@/lib/appwrite-users'
// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { canManageUsers } from '@/lib/rbac'
// Force dynamic rendering
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleId: z.string().optional(),
  active: z.boolean().default(true)
})

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  roleId: z.string().optional(),
  active: z.boolean().optional()
})

export async function GET() {
  try {
    await ensureInitialUsers()
    // Check permissions
    if (!await canManageUsers()) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ users: [] })
    }

    const users = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.USERS,
      [QueryHelpers.orderDesc('$createdAt')]
    )

    // Get roles for each user
    const usersWithRoles = await Promise.all(
      users.documents.map(async (user) => {
        let role = null
        if (user.roleId) {
          try {
            role = await databases.getDocument(
              process.env.APPWRITE_DATABASE_ID || 'hospital_main',
              COLLECTIONS.ROLES,
              user.roleId
            )
          } catch (error) {
            console.warn('Could not fetch role for user:', user.$id)
          }
        }

        return {
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
            permissions: role.permissions
          } : null
        }
      })
    )

    return NextResponse.json({ users: usersWithRoles })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: appwriteError.message || 'Failed to fetch users' 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Check permissions
    if (!await canManageUsers()) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const data = createUserSchema.parse(body)

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ 
        error: 'Appwrite not configured' 
      }, { status: 503 })
    }

    // Check if user already exists
    const existingUsers = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.USERS,
      [QueryHelpers.equal('email', data.email)]
    )

    if (existingUsers.documents.length > 0) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Create Appwrite account and user document
    const newAccount = await createAppwriteUser(
      data.email,
      data.password,
      data.name,
      data.roleId,
      data.active
    )

    // Fetch the created user document
    const user = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.USERS,
      newAccount.$id
    )

    // Get role details if roleId is provided
    let role = null
    if (user.roleId) {
      try {
        role = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.ROLES,
          user.roleId
        )
      } catch (error) {
        console.warn('Could not fetch role for new user:', user.$id)
      }
    }

    const userWithRole = {
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
        permissions: role.permissions
      } : null
    }

    return NextResponse.json({ user: userWithRole })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error creating user:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: appwriteError.message || 'Failed to create user' 
    }, { status: 500 })
  }
}