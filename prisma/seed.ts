import { databases, COLLECTIONS, ID } from '../src/lib/appwrite'

// Seed data for the hospital management system
const seedData = {
  roles: [
    {
      name: 'Admin',
      description: 'Full system access',
      permissions: JSON.stringify({
        users: ['create', 'read', 'update', 'delete'],
        patients: ['create', 'read', 'update', 'delete'],
        appointments: ['create', 'read', 'update', 'delete'],
        medications: ['create', 'read', 'update', 'delete'],
        prescriptions: ['create', 'read', 'update', 'delete'],
        billing: ['create', 'read', 'update', 'delete'],
        inventory: ['create', 'read', 'update', 'delete'],
        reports: ['read'],
        settings: ['create', 'read', 'update', 'delete']
      }),
      isActive: true
    },
    {
      name: 'Doctor',
      description: 'Medical staff with patient and prescription access',
      permissions: JSON.stringify({
        patients: ['create', 'read', 'update'],
        appointments: ['create', 'read', 'update'],
        prescriptions: ['create', 'read', 'update'],
        medications: ['read'],
        reports: ['read']
      }),
      isActive: true
    },
    {
      name: 'Nurse',
      description: 'Nursing staff with limited patient access',
      permissions: JSON.stringify({
        patients: ['read', 'update'],
        appointments: ['read', 'update'],
        medications: ['read'],
        prescriptions: ['read']
      }),
      isActive: true
    },
    {
      name: 'Receptionist',
      description: 'Front desk staff with appointment and patient management',
      permissions: JSON.stringify({
        patients: ['create', 'read', 'update'],
        appointments: ['create', 'read', 'update'],
        billing: ['read']
      }),
      isActive: true
    }
  ],
  systemSettings: [
    { key: 'companyName', value: 'Hospital Management System' },
    { key: 'currency', value: 'CHF' },
    { key: 'address', value: 'Musterstrasse 123, 8001 Zürich' },
    { key: 'phone', value: '+41 44 123 45 67' },
    { key: 'email', value: 'info@hospital.ch' },
    { key: 'website', value: 'https://hospital.ch' },
    { key: 'taxId', value: 'CHE-123.456.789' },
    { key: 'favicon', value: '/favicon.ico' }
  ],
  users: [
    {
      name: 'Admin User',
      email: 'admin@hospital.ch',
      passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      roleId: '', // Will be set after roles are created
      isActive: true,
      lastLogin: null
    }
  ]
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      console.error('❌ APPWRITE_PROJECT_ID not found in environment variables')
      return
    }

    const databaseId = process.env.APPWRITE_DATABASE_ID || 'hospital_main'

    // 1. Seed roles
    console.log('📋 Creating roles...')
    const createdRoles = []
    for (const role of seedData.roles) {
      try {
        const roleDoc = await databases.createDocument(
          databaseId,
          COLLECTIONS.ROLES,
          ID.unique(),
          role
        )
        createdRoles.push(roleDoc)
        console.log(`✅ Created role: ${role.name}`)
      } catch (error) {
        console.log(`⚠️  Role ${role.name} might already exist`)
      }
    }

    // 2. Seed system settings
    console.log('⚙️  Creating system settings...')
    for (const setting of seedData.systemSettings) {
      try {
        await databases.createDocument(
          databaseId,
          COLLECTIONS.SYSTEM_SETTINGS,
          ID.unique(),
          setting
        )
        console.log(`✅ Created setting: ${setting.key}`)
      } catch (error) {
        console.log(`⚠️  Setting ${setting.key} might already exist`)
      }
    }

    // 3. Seed users (with admin role)
    console.log('👤 Creating admin user...')
    const adminRole = createdRoles.find(role => role.name === 'Admin')
    if (adminRole) {
      const adminUser = {
        ...seedData.users[0],
        roleId: adminRole.$id
      }
      
      try {
        await databases.createDocument(
          databaseId,
          COLLECTIONS.USERS,
          ID.unique(),
          adminUser
        )
        console.log('✅ Created admin user: admin@hospital.ch (password: password)')
      } catch (error) {
        console.log('⚠️  Admin user might already exist')
      }
    }

    console.log('🎉 Database seeding completed successfully!')
    console.log('📝 Login credentials:')
    console.log('   Email: admin@hospital.ch')
    console.log('   Password: password')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase()
}

export default seedDatabase
