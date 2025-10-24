import { NextRequest, NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError, ID } from '@/lib/appwrite'
import { canManageRoles } from '@/lib/rbac'
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering

export async function GET() {
  try {
    // Check permissions
    if (!await canManageRoles()) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ roles: [] })
    }

    const roles = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.ROLES,
      [QueryHelpers.orderAsc('name')]
    )

    // Get user count for each role
    const rolesWithCounts = await Promise.all(
      roles.documents.map(async (role) => {
        try {
          const users = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID || 'hospital_main',
            COLLECTIONS.USERS,
            [QueryHelpers.equal('roleId', role.$id)]
          )
          return {
            id: role.$id,
            name: role.name,
            permissions: role.permissions ? JSON.parse(role.permissions) : [],
            createdAt: role.$createdAt,
            updatedAt: role.$updatedAt,
            _count: {
              users: users.total
            }
          }
        } catch (error) {
          console.warn('Could not fetch user count for role:', role.$id)
          return {
            id: role.$id,
            name: role.name,
            permissions: role.permissions ? JSON.parse(role.permissions) : [],
            createdAt: role.$createdAt,
            updatedAt: role.$updatedAt,
            _count: {
              users: 0
            }
          }
        }
      })
    )

    return NextResponse.json({ roles: rolesWithCounts })
  } catch (error: any) {
    console.error('Error fetching roles:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: 'Failed to fetch roles',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permissions
    if (!await canManageRoles()) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { name, permissions } = await request.json()

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    const role = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.ROLES,
      ID.unique(),
      {
        name,
        permissions: JSON.stringify(permissions)
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
    console.error('Error creating role:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: 'Failed to create role',
      details: process.env.NODE_ENV === 'development' ? appwriteError.message : undefined
    }, { status: 500 })
  }
}