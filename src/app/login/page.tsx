'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authHelpers } from '@/lib/appwrite'
import { Eye, EyeOff, Lock, User, AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  useEffect(() => {
    console.log('🚀 ===== LOGIN PAGE INITIALIZATION =====')
    console.log('🌐 Appwrite Configuration:')
    console.log('📡 Endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    console.log('🆔 Project ID:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68f4f8c8002cda88c2ef')
    console.log('🗄️ Database ID:', process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main')
    console.log('⏰ Page Load Time:', new Date().toISOString())
    console.log('🔗 Current URL:', window.location.href)
    console.log('🌍 User Agent:', navigator.userAgent)
    
    // Check for logout parameter and clear any remaining cookies
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('logout')) {
      console.log('🚪 Logout parameter detected, performing additional cleanup')
      performAdditionalCleanup()
    }
    
    // Check if user is already logged in and redirect
    checkExistingSession()
    
    console.log('🚀 ===== LOGIN PAGE READY =====')
  }, [])
  
  const performAdditionalCleanup = () => {
    try {
      // Clear all possible cookies as additional safety measure
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68f4f8c8002cda88c2ef'
      const cookiesToClear = [
        `a_session_${projectId}`,
        `a_session_${projectId}_legacy`,
        'a_session',
        'logout',
        'session_cleared'
      ]
      
      cookiesToClear.forEach(cookieName => {
        document.cookie = `${cookieName}=; path=/; max-age=0`
        
        // Only add domain-specific cookies for localhost development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          document.cookie = `${cookieName}=; path=/; domain=localhost; max-age=0`
          document.cookie = `${cookieName}=; path=/; domain=.localhost; max-age=0`
        }
        
        // Add secure variant for HTTPS (production)
        if (window.location.protocol === 'https:') {
          document.cookie = `${cookieName}=; path=/; secure; max-age=0`
        }
      })
      
      // Clear local storage
      localStorage.clear()
      sessionStorage.clear()
      
      console.log('✅ Additional cleanup completed')
    } catch (error) {
      console.log('⚠️ Additional cleanup failed:', error)
    }
  }

  const checkExistingSession = async () => {
    try {
      console.log('🔍 Checking for existing session...')
      console.log('🍪 All cookies:', document.cookie)
      
      // Check if we have session cookies - multiple variants
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68f4f8c8002cda88c2ef'
      const sessionCookie = document.cookie.includes(`a_session_${projectId}`) || 
                           document.cookie.includes(`a_session_${projectId}_legacy`) ||
                           document.cookie.includes('a_session=')
      
      console.log('🔍 Session cookie check:', {
        projectId,
        hasProjectSession: document.cookie.includes(`a_session_${projectId}`),
        hasLegacySession: document.cookie.includes(`a_session_${projectId}_legacy`),
        hasGenericSession: document.cookie.includes('a_session='),
        sessionFound: sessionCookie
      })
      
      if (sessionCookie) {
        console.log('✅ Session cookie found - verifying with Appwrite...')
        
        // Double-check with Appwrite API
        try {
          const user = await authHelpers.getCurrentUser()
          if (user) {
            console.log('✅ Appwrite session verified - redirecting to dashboard')
            window.location.replace('/dashboard')
            return
          }
        } catch (error) {
          console.log('❌ Appwrite session verification failed:', error)
          // Continue to login page even if verification fails
        }
      }
      
      console.log('❌ No valid session found - staying on login page')
    } catch (error) {
      console.log('❌ Session check error:', error)
    }
  }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const router = useRouter()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      return 'Email address is required'
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return ''
  }

  const validatePassword = (password: string) => {
    if (!password) {
      return 'Password is required'
    }
    return ''
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    console.log('📧 Email Input Changed:', value)
    setEmail(value)
    const validation = validateEmail(value)
    console.log('📧 Email Validation Result:', validation || 'Valid')
    setEmailError(validation)
    if (error) setError('')
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    console.log('🔑 Password Input Changed:', '*'.repeat(value.length))
    setPassword(value)
    const validation = validatePassword(value)
    console.log('🔑 Password Validation Result:', validation || 'Valid')
    setPasswordError(validation)
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔐 ===== APPWRITE LOGIN PROCESS START =====')
    console.log('📧 Input Email:', email)
    console.log('🔑 Input Password:', '*'.repeat(password.length))
    console.log('⏰ Timestamp:', new Date().toISOString())
    
    // Validate form
    console.log('✅ STEP 1: Form Validation')
    const emailValidation = validateEmail(email)
    const passwordValidation = validatePassword(password)
    
    console.log('📧 Email Validation:', emailValidation || 'Valid')
    console.log('🔑 Password Validation:', passwordValidation || 'Valid')
    
    setEmailError(emailValidation)
    setPasswordError(passwordValidation)
    
    if (emailValidation || passwordValidation) {
      console.log('❌ VALIDATION FAILED - Stopping login process')
      console.log('🔐 ===== APPWRITE LOGIN PROCESS END (VALIDATION FAILED) =====')
      return
    }

    console.log('✅ STEP 2: Starting Appwrite Authentication')
    setIsLoading(true)
    setError('')

    try {
      console.log('🌐 Using server-side login to bypass rate limits...')
      
      // Use server-side login to bypass rate limits
      const response = await fetch('/api/server-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      const session = data.session
      
      console.log('✅ STEP 3: Login Successful!')
      console.log('🎉 Session Details:', {
        userId: session.userId,
        email: session.email,
        name: session.name,
        sessionId: session.$id,
        providerAccessToken: session.providerAccessToken ? 'Present' : 'Not Present',
        providerRefreshToken: session.providerRefreshToken ? 'Present' : 'Not Present',
        providerAccessTokenExpiry: session.providerAccessTokenExpiry,
        ip: session.ip,
        osCode: session.osCode,
        osName: session.osName,
        osVersion: session.osVersion,
        clientType: session.clientType,
        clientCode: session.clientCode,
        clientName: session.clientName,
        clientVersion: session.clientVersion,
        clientEngine: session.clientEngine,
        clientEngineVersion: session.clientEngineVersion,
        deviceName: session.deviceName,
        deviceBrand: session.deviceBrand,
        deviceModel: session.deviceModel,
        countryCode: session.countryCode,
        countryName: session.countryName,
        current: session.current
      })
      
      console.log('🔄 STEP 4: Redirecting to Dashboard...')
      
      // Wait a moment for cookies to be set, then redirect
      setTimeout(() => {
        console.log('🚀 Performing redirect to dashboard...')
        window.location.replace('/dashboard')
      }, 100)
      
      console.log('🔐 ===== APPWRITE LOGIN PROCESS END (SUCCESS) =====')
      
    } catch (error: any) {
      console.log('❌ STEP 3: Login Failed!')
      console.error('🚨 Appwrite Error Details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response,
        stack: error.stack
      })
      
          // Simple error handling - no rate limit messages
          console.log('🔍 Error Analysis:', error.message)
          setError('Invalid credentials. Please check your email and password.')
      
      console.log('🔐 ===== APPWRITE LOGIN PROCESS END (FAILED) =====')
    } finally {
      console.log('🏁 STEP 5: Cleanup - Setting loading to false')
      setIsLoading(false)
    }
  }


  const isFormValid = !emailError && !passwordError && email && password

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Sign In
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Enter your credentials to access the hospital management system
              </p>
        </div>


        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 ${emailError ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    emailError 
                      ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                      placeholder="your@email.com"
                />
              </div>
              {emailError && (
                <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${passwordError ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    passwordError 
                      ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                      placeholder="Your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {passwordError && (
                <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                      Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          {/* Additional Options */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    Contact the administrator
                  </a>
                </p>
              </div>
        </form>

        {/* Footer */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                © 2024 Hospital Management System. All rights reserved.
              </p>
            </div>
      </div>
    </div>
  )
}
