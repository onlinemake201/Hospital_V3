'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  type: ToastType
  duration?: number
  onClose: () => void
}

export function ModernToast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 300)
  }

  const getIcon = () => {
    const iconClass = "w-5 h-5"
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-white`} />
      case 'error':
        return <XCircle className={`${iconClass} text-white`} />
      case 'warning':
        return <AlertCircle className={`${iconClass} text-white`} />
      case 'info':
        return <Info className={`${iconClass} text-white`} />
      default:
        return <CheckCircle className={`${iconClass} text-white`} />
    }
  }

  const getStyles = () => {
    const baseStyles = "border rounded-2xl shadow-xl backdrop-blur-sm p-4 flex items-start gap-3 relative overflow-hidden"
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-green-800/20 border-green-200/60 dark:border-green-700/60`
      case 'error':
        return `${baseStyles} bg-gradient-to-br from-red-50 via-rose-50 to-red-100 dark:from-red-900/20 dark:via-rose-900/20 dark:to-red-800/20 border-red-200/60 dark:border-red-700/60`
      case 'warning':
        return `${baseStyles} bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-amber-800/20 border-amber-200/60 dark:border-amber-700/60`
      case 'info':
        return `${baseStyles} bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-blue-800/20 border-blue-200/60 dark:border-blue-700/60`
      default:
        return `${baseStyles} bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-900/20 dark:via-slate-900/20 dark:to-gray-800/20 border-gray-200/60 dark:border-gray-700/60`
    }
  }

  const getIconContainerStyles = () => {
    const baseStyles = "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/20"
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-gradient-to-br from-green-500 to-emerald-600`
      case 'error':
        return `${baseStyles} bg-gradient-to-br from-red-500 to-rose-600`
      case 'warning':
        return `${baseStyles} bg-gradient-to-br from-amber-500 to-yellow-600`
      case 'info':
        return `${baseStyles} bg-gradient-to-br from-blue-500 to-cyan-600`
      default:
        return `${baseStyles} bg-gradient-to-br from-gray-500 to-slate-600`
    }
  }

  if (!isVisible) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full mx-4 transform transition-all duration-500 ease-out ${
        isLeaving ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'
      }`}
    >
      <div className={`${getStyles()}`}>
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50"></div>
        
        {/* Icon container */}
        <div className={`${getIconContainerStyles()} mt-0.5`}>
          {getIcon()}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 relative z-10">
          <p className="text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
            {message}
          </p>
        </div>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-2 p-1.5 rounded-xl hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-200 hover:scale-110 group"
        >
          <svg className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Hook für einfache Verwendung
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([])

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ModernToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )

  return { showToast, ToastContainer }
}
