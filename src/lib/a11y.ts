// A11y utilities and components
export function announceToScreenReader(message: string) {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

export function focusElement(element: HTMLElement | null) {
  if (element) {
    element.focus()
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
  }
  
  element.addEventListener('keydown', handleKeyDown)
  
  return () => {
    element.removeEventListener('keydown', handleKeyDown)
  }
}

export function getAriaLabel(action: string, item?: string): string {
  const labels: Record<string, string> = {
    edit: `Edit ${item || 'item'}`,
    delete: `Delete ${item || 'item'}`,
    view: `View ${item || 'item'}`,
    close: 'Close',
    open: 'Open',
    save: 'Save changes',
    cancel: 'Cancel changes',
    search: 'Search',
    filter: 'Filter results',
    sort: 'Sort',
    expand: 'Expand',
    collapse: 'Collapse',
  }
  
  return labels[action] || action
}

export function formatCurrency(amount: number | undefined | null, currency = 'CHF'): string {
  // Handle undefined, null, or invalid amounts
  if (amount === undefined || amount === null || isNaN(amount)) {
    amount = 0
  }
  
  // Map our currency codes to ISO currency codes
  const currencyMap: Record<string, string> = {
    'CHF': 'CHF',
    'EUR': 'EUR', 
    'USD': 'USD',
    'GBP': 'GBP',
    'KES': 'KES',
    'ETB': 'ETB'
  }
  
  const isoCurrency = currencyMap[currency] || 'CHF'
  
  // Use appropriate locale based on currency
  const localeMap: Record<string, string> = {
    'CHF': 'de-CH',
    'EUR': 'de-DE',
    'USD': 'en-US',
    'GBP': 'en-GB',
    'KES': 'en-KE',
    'ETB': 'en-ET'
  }
  
  const locale = localeMap[currency] || 'de-CH'
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: isoCurrency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date, locale = 'de-CH'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function formatDateTime(date: Date, locale = 'de-CH'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
