import { databases, COLLECTIONS, QueryHelpers } from './appwrite'

let settingsCache: Record<string, string> | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getSystemSettings(): Promise<Record<string, string>> {
  const now = Date.now()
  
  // Return cached settings if still valid
  if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return settingsCache
  }

  try {
    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      console.warn('APPWRITE_PROJECT_ID not found, returning default settings')
      return getDefaultSettings()
    }

    const settings = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.SYSTEM_SETTINGS
    )
    
    // Convert array to object
    const settingsObj = settings.documents.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    // Cache the settings
    settingsCache = settingsObj
    cacheTimestamp = now

    return settingsObj
  } catch (error) {
    console.error('Error fetching system settings:', error)
    // Return default settings instead of empty object
    return getDefaultSettings()
  }
}

// Default settings when database is not available
function getDefaultSettings(): Record<string, string> {
  return {
    companyName: 'Hospital Management System',
    companyLogo: '',
    currency: 'CHF',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
    favicon: '/favicon.ico'
  }
}

export function clearSettingsCache() {
  settingsCache = null
  cacheTimestamp = 0
}

// Function to update cache after settings change
export function updateSettingsCache(key: string, value: string) {
  if (settingsCache) {
    settingsCache[key] = value
  }
}

// Helper function to get specific setting with default
export async function getSetting(key: string, defaultValue: string = ''): Promise<string> {
  const settings = await getSystemSettings()
  return settings[key] || defaultValue
}

// Helper function to get company name
export async function getCompanyName(): Promise<string> {
  return await getSetting('companyName', 'Hospital Management System')
}

// Helper function to get company logo
export async function getCompanyLogo(): Promise<string> {
  return await getSetting('companyLogo', '')
}

// Helper function to get currency
export async function getCurrency(): Promise<string> {
  return await getSetting('currency', 'CHF')
}

// Helper function to get company address
export async function getCompanyAddress(): Promise<string> {
  return await getSetting('address', '')
}

// Helper function to get company phone
export async function getCompanyPhone(): Promise<string> {
  return await getSetting('phone', '')
}

// Helper function to get company email
export async function getCompanyEmail(): Promise<string> {
  return await getSetting('email', '')
}

// Helper function to get company website
export async function getCompanyWebsite(): Promise<string> {
  return await getSetting('website', '')
}

// Helper function to get tax ID
export async function getTaxId(): Promise<string> {
  return await getSetting('taxId', '')
}

// Helper function to get favicon
export async function getFavicon(): Promise<string> {
  return await getSetting('favicon', '/favicon.ico')
}