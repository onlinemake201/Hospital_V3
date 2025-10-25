'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authHelpers } from '@/lib/appwrite'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // IMMEDIATE CHECK: Look for logout cookie first
        if (document.cookie.includes('logout=true')) {
          console.log('🚪 Logout cookie detected - immediate redirect to homepage')
          setIsAuthenticated(false)
          setIsLoading(false)
          router.push('/')
          return
        }
        
        const user = await authHelpers.getCurrentUser()
        setIsAuthenticated(!!user)
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Authentifizierung wird überprüft...</p>
        </div>
      </div>
    )
  }

  // Redirect to homepage if not authenticated
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push('/')
    }
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Weiterleitung zur Startseite...</p>
        </div>
      </div>
    )
  }

  // Render protected content
  return <>{children}</>
}
