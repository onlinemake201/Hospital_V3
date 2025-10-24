// Helper function to get the correct base URL
export function getBaseUrl() {
  // In production (Appwrite Cloud), use the current origin
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXTAUTH_URL || 'https://hospital-v1.appwrite.network'
  }
  
  // In development, use localhost with correct port
  return process.env.NEXTAUTH_URL || 'http://localhost:3001'
}

// Helper function for API calls
export function getApiUrl(endpoint: string) {
  const baseUrl = getBaseUrl()
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}
