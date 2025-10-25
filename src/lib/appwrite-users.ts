// Server-side user management using Appwrite MCP
// This file should only be imported in server-side code (API routes)

import { databases, COLLECTIONS, ID } from './appwrite'

/**
 * Creates a new Appwrite user account and stores profile in database
 * This uses Appwrite's server-side API
 */
export async function createAppwriteUser(
  email: string,
  password: string,
  name: string,
  roleId?: string,
  active: boolean = true
) {
  // For server-side user creation, we'll use the Appwrite REST API directly
  const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
  const projectId = process.env.APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY

  if (!apiKey || !projectId) {
    throw new Error('Appwrite API key or Project ID not configured')
  }

  const userId = ID.unique()

  // Create user via REST API
  const response = await fetch(`${endpoint}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey,
    },
    body: JSON.stringify({
      userId,
      email,
      password,
      name,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create user')
  }

  const user = await response.json()

  // Create user document in database
  await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID || 'hospital_main',
    COLLECTIONS.USERS,
    user.$id,
    {
      name,
      email,
      roleId: roleId || null,
      active,
    }
  )

  return user
}

/**
 * Ensures initial users exist (idempotent)
 */
export async function ensureInitialUsers() {
  const initialUsers = [
    { id: 'admin_user', name: 'System Administrator', email: 'admin@hospital.com', password: 'admin123', roleKey: 'admin_role' },
    { id: 'doctor_user', name: 'Dr. Demo', email: 'doctor@hospital.com', password: 'doctor123', roleKey: 'doctor_role' },
    { id: 'nurse_user', name: 'Nurse Demo', email: 'nurse@hospital.com', password: 'nurse123', roleKey: 'nurse_role' },
  ]

  const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
  const projectId = process.env.APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY

  if (!apiKey || !projectId) {
    console.warn('Appwrite API key or Project ID not configured, skipping user initialization')
    return
  }

  for (const u of initialUsers) {
    try {
      // Check if user document exists
      const exists = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.USERS,
        [`equal("email", "${u.email}")`]
      )
      
      if (exists.total > 0) continue

      // Create user via REST API
      const response = await fetch(`${endpoint}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': projectId,
          'X-Appwrite-Key': apiKey,
        },
        body: JSON.stringify({
          userId: u.id,
          email: u.email,
          password: u.password,
          name: u.name,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.warn(`Failed to create user ${u.email}:`, error)
        continue
      }

      const acc = await response.json()

      // Create user document
      await databases.createDocument(
        process.env.APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.USERS,
        acc.$id,
        {
          name: u.name,
          email: u.email,
          roleId: u.roleKey,
          active: true,
        }
      )

      console.log(`Created user: ${u.email}`)
    } catch (e) {
      console.warn(`Error creating user ${u.email}:`, e)
    }
  }
}

