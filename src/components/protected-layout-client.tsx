'use client'

import { useState, useEffect } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobileNav } from '@/components/mobile-nav'
import AuthGuard from '@/components/auth-guard'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { authHelpers } from '@/lib/appwrite'

interface ProtectedLayoutClientProps {
  children: React.ReactNode
  companyName: string
  companyLogo: string | null
  currency: string
  userRole: string | null
}

export default function ProtectedLayoutClient({ 
  children, 
  companyName: initialCompanyName, 
  companyLogo: initialCompanyLogo, 
  currency: initialCurrency,
  userRole
}: ProtectedLayoutClientProps) {
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [companyLogo, setCompanyLogo] = useState(initialCompanyLogo)
  const [currency, setCurrency] = useState(initialCurrency)

  // Listen for company info updates
  useEffect(() => {
    const handleCompanyInfoUpdate = (event: CustomEvent) => {
      const { companyName: newName, companyLogo: newLogo, currency: newCurrency } = event.detail
      setCompanyName(newName)
      if (newLogo) setCompanyLogo(newLogo)
      if (newCurrency) setCurrency(newCurrency)
    }

    window.addEventListener('companyInfoUpdated', handleCompanyInfoUpdate as EventListener)
    
    return () => {
      window.removeEventListener('companyInfoUpdated', handleCompanyInfoUpdate as EventListener)
    }
  }, [])

  // Define navigation items based on role
  const getNavigationItems = () => {
    const baseItems = [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/patients', label: 'Patients' },
      { href: '/appointments', label: 'Appointments' },
      { href: '/inventory', label: 'Inventory' },
      { href: '/prescriptions', label: 'Prescriptions' },
    ]

    // Only show Admin and Billing for ADMIN role
    if (userRole === 'Admin') {
      baseItems.push(
        { href: '/billing', label: 'Billing' },
        { href: '/admin', label: 'Admin' }
      )
    }

    return baseItems
  }

  const handleLogout = async () => {
    try {
      console.log('🚪 Starting comprehensive logout process...');
      
      // Step 0: Try Appwrite SDK logout first
      try {
        console.log('🔄 Attempting Appwrite SDK logout...');
        await authHelpers.logout();
        console.log('✅ Appwrite SDK logout successful');
      } catch (error) {
        console.log('⚠️ Appwrite SDK logout failed:', error);
      }
      
      // Step 1: Call logout API to clear session server-side
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('✅ Logout API successful');
      } else {
        console.log('⚠️ Logout API failed, using fallback');
      }
      
      // Step 2: Clear all local storage/session storage
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ Local storage cleared');
      } catch (error) {
        console.log('⚠️ Local storage clear failed:', error);
      }
      
      // Step 3: Clear cookies manually as fallback
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68f4f8c8002cda88c2ef';
      const cookiesToClear = [
        `a_session_${projectId}`,
        `a_session_${projectId}_legacy`,
        'a_session',
        'logout',
        'session_cleared'
      ];
      
      // Comprehensive cookie clearing with multiple strategies
      cookiesToClear.forEach(cookieName => {
        // Strategy 1: Basic clearing
        document.cookie = `${cookieName}=; path=/; max-age=0`;
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        
        // Strategy 2: Domain-specific clearing for localhost
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          document.cookie = `${cookieName}=; path=/; domain=localhost; max-age=0`;
          document.cookie = `${cookieName}=; path=/; domain=.localhost; max-age=0`;
          document.cookie = `${cookieName}=; path=/; domain=localhost; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
        
        // Strategy 3: Secure variants for HTTPS (production)
        if (window.location.protocol === 'https:') {
          document.cookie = `${cookieName}=; path=/; secure; max-age=0`;
          document.cookie = `${cookieName}=; path=/; secure; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
        
        // Strategy 4: SameSite variants
        document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax`;
        document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Strict`;
        document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=None; Secure`;
      });
      
      console.log('✅ Manual cookie cleanup completed');
      
      // Step 4: Set logout trigger cookies
      document.cookie = 'logout=true; path=/; max-age=1';
      document.cookie = 'session_cleared=true; path=/; max-age=1';
      
      // Step 5: Force redirect to login page with cache busting
      const loginUrl = `/login?logout=${Date.now()}`;
      window.location.href = loginUrl;
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Emergency fallback: clear everything and redirect
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear all possible cookies
        const allCookies = document.cookie.split(';');
        allCookies.forEach(cookie => {
          const cookieName = cookie.split('=')[0].trim();
          document.cookie = `${cookieName}=; path=/; max-age=0`;
          document.cookie = `${cookieName}=; path=/; domain=localhost; max-age=0`;
        });
        
        // Force redirect
        window.location.href = '/login';
      } catch (fallbackError) {
        console.error('❌ Emergency fallback failed:', fallbackError);
        // Last resort: reload page
        window.location.reload();
      }
    }
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 flex items-center justify-between">
              {/* Logo and Company Name */}
              <div className="flex items-center gap-4 lg:gap-8">
                <Link href="/dashboard" className="flex items-center gap-2 lg:gap-3">
                  {companyLogo && (
                    <img
                      src={companyLogo}
                      alt={`${companyName} Logo`}
                      className="w-7 h-7 sm:w-8 sm:h-8 object-contain flex-shrink-0"
                    />
                  )}
                  <span className="text-lg sm:text-xl font-semibold hidden xs:block text-slate-900 dark:text-slate-100">
                    {companyName}
                  </span>
                  <span className="text-base font-semibold xs:hidden truncate max-w-[100px] text-slate-900 dark:text-slate-100">
                    {companyName.split(' ')[0]}
                  </span>
                </Link>
                
                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                  {getNavigationItems().map((item) => (
                    <Link 
                      key={item.href}
                      href={item.href} 
                      className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
              
              {/* Right Side Controls */}
              <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
                {/* Mobile Navigation */}
                <MobileNav 
                  companyName={companyName} 
                  companyLogo={companyLogo || undefined} 
                  navigationItems={getNavigationItems()}
                  userRole={userRole}
                  userName="User"
                  onLogout={handleLogout}
                />
                
                {/* Theme Toggle */}
                <ThemeToggle />
                
                {/* Desktop User Info and Logout */}
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400 hidden md:inline">
                    {userRole || 'User'}
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="rounded-xl bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">Sign out</span>
                  </button>
                </div>
                
                {/* Mobile Logout Button */}
                <div className="sm:hidden">
                  <button 
                    onClick={handleLogout}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 text-slate-600 dark:text-slate-400"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-8rem)]">
          {children}
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm mt-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <span>&copy; 2024 {companyName}. All rights reserved.</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-xs sm:text-sm">Currency: {currency}</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/admin/settings" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-xs sm:text-sm">
                  Settings
                </Link>
                <Link href="/admin/settings" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-xs sm:text-sm">
                  Support
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
  )
}