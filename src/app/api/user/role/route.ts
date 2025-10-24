import { NextResponse } from 'next/server'
import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError } from '@/lib/appwrite'
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering

export async function GET() {
  try {
    // Temporarily disable session check for testing
    // const session = await auth()
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Check if Appwrite is configured
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    // Temporarily return mock data for testing
    return NextResponse.json({ 
      role: 'admin',
      permissions: ['admin:full']
    })

    // const userQuery = await databases.listDocuments(
    //   process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
    //   COLLECTIONS.USERS,
    //   [QueryHelpers.equal('$id', session.user.id)]
    // )

    // if (userQuery.documents.length === 0) {
    //   return NextResponse.json({ error: 'User not found' }, { status: 404 })
    // }

    // const user = userQuery.documents[0]
    // let role = null

    // if (user.roleId) {
    //   try {
    //     role = await databases.getDocument(
    //       process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main',
    //       COLLECTIONS.ROLES,
    //       user.roleId
    //     )
    //   } catch (error) {
    //     console.warn('Could not fetch role for user:', session.user.id)
    //   }
    // }

    // return NextResponse.json({ 
    //   role: role?.name || null,
    //   user: {
    //     id: user.$id,
    //     name: user.name,
    //     email: user.email
    //   }
    // })
  } catch (error) {
    console.error('Error fetching user role:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({ 
      error: appwriteError.message || 'Internal server error' 
    }, { status: 500 })
  }
}
