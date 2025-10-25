'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authHelpers } from '@/lib/appwrite'
import { Eye, EyeOff, Lock, User, AlertTriangle, Shield, Heart, Zap } from 'lucide-react'

export default function LoginPage() {
  useEffect(() => {
    console.log('🚀 ===== MODERN LOGIN PAGE INITIALIZATION =====')
    
    // IMMEDIATE CLEANUP: Always clear any existing session data
    performImmediateCleanup()
    
    // DON'T check existing session - let middleware handle redirects
    // checkExistingSession()
    
    console.log('🚀 ===== MODERN LOGIN PAGE READY =====')
  }, [])
  
  const performImmediateCleanup = () => {
    try {
      console.log('🧹 IMMEDIATE CLEANUP - Clearing all session data')
      
      // IMMEDIATE CLEANUP - No delays
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68f4f8c8002cda88c2ef'
      const cookiesToClear = [
        `a_session_${projectId}`,
        `a_session_${projectId}_legacy`,
        'a_session',
        'logout',
        'session_cleared'
      ]
      
      // Immediate cookie clearing
      cookiesToClear.forEach(cookieName => {
        document.cookie = `${cookieName}=; path=/; max-age=0`
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        if (window.location.hostname === 'localhost') {
          document.cookie = `${cookieName}=; path=/; domain=localhost; max-age=0`
        }
        if (window.location.protocol === 'https:') {
          document.cookie = `${cookieName}=; path=/; secure; max-age=0`
        }
      })
      
      // Immediate storage clearing
      localStorage.clear()
      sessionStorage.clear()
      
      console.log('✅ IMMEDIATE CLEANUP COMPLETED')
    } catch (error) {
      console.log('⚠️ Immediate cleanup failed:', error)
    }
  }

  const checkExistingSession = async () => {
    try {
      console.log('🔍 Checking for existing session...')
      
      // Check if we have session cookies
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68f4f8c8002cda88c2ef'
      const sessionCookie = document.cookie.includes(`a_session_${projectId}`) || 
                           document.cookie.includes(`a_session_${projectId}_legacy`) ||
                           document.cookie.includes('a_session=')
      
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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setError('')
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setError('')
  }

  const isFormValid = email.trim() !== '' && password.trim() !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔐 ===== APPWRITE LOGIN PROCESS START =====')
    console.log('📧 Email:', email)
    console.log('🔑 Password length:', password.length)
    
    setIsLoading(true)
    setError('')

    try {
      console.log('🌐 Using server-side login for real-time authentication...')
      
      // Use server-side login for real-time authentication
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
      console.log('🎉 Session created:', {
        sessionId: session.$id,
        userId: session.userId,
        email: session.email
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
      
      // Simple error handling
      console.log('🔍 Error Analysis:', error.message)
      setError('Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.')
      
      console.log('🔐 ===== APPWRITE LOGIN PROCESS END (FAILED) =====')
    } finally {
      console.log('🏁 STEP 5: Cleanup - Setting loading to false')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Hospital Management
            </h1>
            <p className="text-gray-300 text-lg">Sichere Anmeldung erforderlich</p>
            <div className="flex items-center justify-center mt-4 space-x-2">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-400">Powered by Appwrite</span>
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-3">
                E-Mail-Adresse
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className="block w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm"
                  placeholder="ihre@email.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-3">
                Passwort
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  className="block w-full pl-12 pr-14 py-4 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm"
                  placeholder="Ihr Passwort"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-blue-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 px-6 rounded-2xl font-semibold hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Authentifizierung läuft...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Sicher Anmelden
                </div>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-2 text-blue-300 text-sm">
              <Shield className="w-4 h-4" />
              <span>Echtzeit-Authentifizierung • Keine Cache-Speicherung</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              © 2024 Hospital Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}