// Company information utility functions
// This file provides system-wide access to company information

import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError } from './appwrite'

interface CompanyInfo {
  id?: string
  name: string
  address: string
  city: string
  postalCode: string
  country: string
  phone: string
  email: string
  website: string
  taxId: string
  registrationNumber: string
  logo?: string
  description: string
}

// Cache for company information
let companyInfoCache: CompanyInfo | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get company information from cache or database
 */
export async function getCompanyInfo(): Promise<CompanyInfo | null> {
  const now = Date.now()
  
  // Return cached data if still valid
  if (companyInfoCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return companyInfoCache
  }

  try {
    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      console.warn('Appwrite not configured, returning null')
      return null
    }

    // Try to get company info from database
    const companyQuery = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.COMPANY_INFO || 'company_info',
      [QueryHelpers.limit(1)]
    )

    if (companyQuery.documents.length > 0) {
      const companyDoc = companyQuery.documents[0]
      const companyInfo: CompanyInfo = {
        id: companyDoc.$id,
        name: companyDoc.name,
        address: companyDoc.address,
        city: companyDoc.city,
        postalCode: companyDoc.postalCode,
        country: companyDoc.country,
        phone: companyDoc.phone,
        email: companyDoc.email,
        website: companyDoc.website,
        taxId: companyDoc.taxId,
        registrationNumber: companyDoc.registrationNumber,
        logo: companyDoc.logo,
        description: companyDoc.description
      }
      
      // Cache the result
      companyInfoCache = companyInfo
      cacheTimestamp = now
      return companyInfo
    } else {
      // Return null if no company info exists
      return null
    }
  } catch (dbError) {
    console.error('Database error:', dbError)
    // Return null if database error (collection might not exist yet)
    return null
  }
}

/**
 * Clear company information cache
 * Call this when company info is updated
 */
export function clearCompanyInfoCache(): void {
  companyInfoCache = null
  cacheTimestamp = 0
}

/**
 * Get company information synchronously from cache
 * Returns null if not cached
 */
export function getCachedCompanyInfo(): CompanyInfo | null {
  return companyInfoCache
}

/**
 * Format company address as a single string
 */
export function formatCompanyAddress(companyInfo: CompanyInfo): string {
  return `${companyInfo.address}, ${companyInfo.postalCode} ${companyInfo.city}, ${companyInfo.country}`
}

/**
 * Format company contact information
 */
export function formatCompanyContact(companyInfo: CompanyInfo): string {
  const parts = []
  if (companyInfo.phone) parts.push(companyInfo.phone)
  if (companyInfo.email) parts.push(companyInfo.email)
  if (companyInfo.website) parts.push(companyInfo.website)
  return parts.join(' • ')
}

/**
 * Get company display name with fallback
 */
export function getCompanyDisplayName(companyInfo: CompanyInfo | null): string {
  return companyInfo?.name || 'Firmenname nicht gesetzt'
}

/**
 * Check if company information is complete
 */
export function isCompanyInfoComplete(companyInfo: CompanyInfo | null): boolean {
  if (!companyInfo) return false
  
  const requiredFields = ['name', 'address', 'city', 'postalCode', 'country', 'email']
  return requiredFields.every(field => companyInfo[field as keyof CompanyInfo])
}

/**
 * Get missing required fields
 */
export function getMissingCompanyFields(companyInfo: CompanyInfo | null): string[] {
  if (!companyInfo) return ['name', 'address', 'city', 'postalCode', 'country', 'email']
  
  const requiredFields = ['name', 'address', 'city', 'postalCode', 'country', 'email']
  return requiredFields.filter(field => !companyInfo[field as keyof CompanyInfo])
}
