"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Menu, 
  X, 
  LogOut, 
  Home, 
  Users, 
  Calendar, 
  Package, 
  FileText, 
  CreditCard, 
  Settings
} from 'lucide-react'

interface MobileNavProps {
  companyName: string
  companyLogo?: string
  navigationItems?: Array<{ href: string; label: string }>
  userRole?: string | null
  userName?: string | null
  onLogout?: () => void
}

// Icon mapping for navigation items
const getIcon = (href: string) => {
  switch (href) {
    case '/dashboard': return Home
    case '/patients': return Users
    case '/appointments': return Calendar
    case '/inventory': return Package
    case '/prescriptions': return FileText
    case '/billing': return CreditCard
    case '/admin': return Settings
    default: return Home
  }
}

export function MobileNav({ companyName, companyLogo, navigationItems, userRole, userName, onLogout }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Use provided navigation items or fallback to default
  const navItems = navigationItems || [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/patients', label: 'Patients' },
    { href: '/appointments', label: 'Appointments' },
    { href: '/inventory', label: 'Inventory' },
    { href: '/prescriptions', label: 'Prescriptions' },
    { href: '/billing', label: 'Billing' },
  ]

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Generate user initials
  const getUserInitials = () => {
    if (userName) {
      return userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return 'U'
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative z-10"
        aria-label="Toggle menu"
      >
        <div className="relative">
          {isOpen ? (
            <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          ) : (
            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          )}
        </div>
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Menu panel - VON RECHTS */}
          <div className="fixed top-0 right-0 w-72 h-full bg-white dark:bg-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out">
            {/* Header mit Gradient */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <h2 className="text-xl font-bold">Navigation</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 bg-white dark:bg-slate-800">
              <div className="px-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = getIcon(item.href)
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* User Section mit modernem Design */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {getUserInitials()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-base truncate">
                    {userName || 'User'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {userRole || 'User'}
                  </p>
                </div>
              </div>
              
              {/* Logout button mit modernem Design */}
              {onLogout && (
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onLogout()
                  }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200 border border-red-200 dark:border-red-800"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}