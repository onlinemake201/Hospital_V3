#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Script to fix prescriber IDs in existing prescriptions
const { Client, Databases, Query } = require('appwrite');

// Appwrite configuration
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '';
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'hospital_main';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';

if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  console.error('Missing Appwrite configuration');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

async function fixPrescriberIds() {
  try {
    console.log('🔍 Fetching prescriptions...');
    
    // Get all prescriptions
    const prescriptions = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      'prescriptions',
      [Query.limit(100)]
    );

    console.log(`📋 Found ${prescriptions.documents.length} prescriptions`);

    // Get all users to find a valid prescriber
    const users = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      'users',
      [Query.limit(100)]
    );

    console.log(`👥 Found ${users.documents.length} users`);

    if (users.documents.length === 0) {
      console.error('❌ No users found in database');
      return;
    }

    // Use the first user as default prescriber
    const defaultPrescriberId = users.documents[0].$id;
    const defaultPrescriberName = users.documents[0].name || 'Admin User';
    
    console.log(`👤 Using default prescriber: ${defaultPrescriberName} (${defaultPrescriberId})`);

    let updatedCount = 0;

    for (const prescription of prescriptions.documents) {
      // Check if prescriberId is missing or invalid
      if (!prescription.prescriberId || prescription.prescriberId === 'admin_user') {
        try {
          await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            'prescriptions',
            prescription.$id,
            {
              prescriberId: defaultPrescriberId
            }
          );
          
          console.log(`✅ Updated prescription ${prescription.prescriptionNo} with prescriber ${defaultPrescriberName}`);
          updatedCount++;
        } catch (error) {
          console.error(`❌ Failed to update prescription ${prescription.prescriptionNo}:`, error.message);
        }
      } else {
        console.log(`ℹ️  Prescription ${prescription.prescriptionNo} already has prescriberId: ${prescription.prescriberId}`);
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} prescriptions`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
fixPrescriberIds();
