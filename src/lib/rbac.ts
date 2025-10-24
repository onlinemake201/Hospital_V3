import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError } from './appwrite'

// Since authentication is disabled, we'll return default values
export async function getUserRole(): Promise<string | null> {
  // Return 'Admin' as default since auth is disabled
  return 'Admin'
}

export async function getUserPermissions(): Promise<Record<string, string[]> | null> {
  // Return full permissions since auth is disabled
  return {
    patients: ['read', 'write', 'delete'],
    appointments: ['read', 'write', 'delete'],
    medications: ['read', 'write', 'delete'],
    prescriptions: ['read', 'write', 'delete'],
    invoices: ['read', 'write', 'delete'],
    users: ['read', 'write', 'delete'],
    roles: ['read', 'write', 'delete'],
    settings: ['read', 'write', 'delete'],
    billing: ['read', 'write', 'delete'],
    inventory: ['read', 'write', 'delete']
  }
}

export async function requireRole(allowedRoles: string[]): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function requirePermission(resource: string, action: string): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function requireAdmin(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

// Admin has access to everything - override all permission checks
export async function isAdmin(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

// Universal admin check for any resource/action
export async function hasAdminAccess(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function requireDoctorOrAdmin(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function requireNurseOrAbove(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function requirePharmacyOrAbove(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function requireBillingOrAbove(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

// Permission checking helpers - Admin has access to everything
export async function canReadPatients(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canWritePatients(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canDeletePatients(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canReadAppointments(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canWriteAppointments(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canDeleteAppointments(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canReadMedications(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canWriteMedications(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canDeleteMedications(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canReadPrescriptions(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canWritePrescriptions(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canDeletePrescriptions(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canReadInvoices(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canWriteInvoices(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canDeleteInvoices(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canManageUsers(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canManageRoles(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canManageSettings(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canReadBilling(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canWriteBilling(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canDeleteBilling(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canReadInventory(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canWriteInventory(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}

export async function canDeleteInventory(): Promise<boolean> {
  // Always return true since auth is disabled
  return true
}
