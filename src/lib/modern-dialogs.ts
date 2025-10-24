// Modern Dialog Utilities
// Reusable dialog functions for consistent UI across the application

export interface ConfirmDialogData {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  details?: {
    label: string
    value: string
  }[]
}

export interface SuccessDialogData {
  title: string
  message: string
  details?: {
    label: string
    value: string
  }[]
  autoClose?: number
}

export interface ErrorDialogData {
  title: string
  message: string
  details?: string
}

// Modern confirmation dialog
export const showConfirmDialog = (data: ConfirmDialogData): Promise<boolean> => {
  return new Promise((resolve) => {
    const dialog = document.createElement('div')
    dialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
    
    const iconColor = data.type === 'danger' ? 'red' : data.type === 'warning' ? 'yellow' : 'blue'
    const iconBg = data.type === 'danger' ? 'red-100 dark:bg-red-900/30' : data.type === 'warning' ? 'yellow-100 dark:bg-yellow-900/30' : 'blue-100 dark:bg-blue-900/30'
    const iconText = data.type === 'danger' ? 'red-600 dark:text-red-400' : data.type === 'warning' ? 'yellow-600 dark:text-yellow-400' : 'blue-600 dark:text-blue-400'
    const buttonColor = data.type === 'danger' ? 'red-600 hover:bg-red-700' : data.type === 'warning' ? 'yellow-600 hover:bg-yellow-700' : 'blue-600 hover:bg-blue-700'
    
    const iconSvg = data.type === 'danger' 
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>'
      : data.type === 'warning'
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
    
    const detailsHtml = data.details ? `
      <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
        ${data.details.map(detail => `
          <div class="flex items-center justify-between mb-2 last:mb-0">
            <span class="text-sm text-gray-500 dark:text-gray-400">${detail.label}:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">${detail.value}</span>
          </div>
        `).join('')}
      </div>
    ` : ''
    
    dialog.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-${iconBg} rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-${iconText}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${iconSvg}
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${data.title}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Please confirm your action</p>
            </div>
          </div>
          
          ${detailsHtml}
          
          <p class="text-gray-600 dark:text-gray-300 mb-6">${data.message}</p>
          
          <div class="flex gap-3">
            <button class="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium transition-colors" data-action="cancel">
              ${data.cancelText || 'Cancel'}
            </button>
            <button class="flex-1 px-4 py-2.5 text-white bg-${buttonColor} rounded-xl font-medium transition-colors" data-action="confirm">
              ${data.confirmText || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(dialog)
    
    const handleAction = (action: string) => {
      if (dialog.parentNode) {
        document.body.removeChild(dialog)
      }
      resolve(action === 'confirm')
    }
    
    dialog.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.dataset.action) {
        handleAction(target.dataset.action)
      } else if (target === dialog) {
        handleAction('cancel')
      }
    })
    
    // Focus the cancel button for safety
    const cancelBtn = dialog.querySelector('[data-action="cancel"]') as HTMLButtonElement
    cancelBtn?.focus()
  })
}

// Modern success dialog
export const showSuccessDialog = (data: SuccessDialogData): Promise<void> => {
  return new Promise((resolve) => {
    const dialog = document.createElement('div')
    dialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
    
    const detailsHtml = data.details ? `
      <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6">
        ${data.details.map(detail => `
          <div class="flex items-center justify-between mb-2 last:mb-0">
            <span class="text-sm text-gray-500 dark:text-gray-400">${detail.label}:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">${detail.value}</span>
          </div>
        `).join('')}
      </div>
    ` : ''
    
    dialog.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${data.title}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Operation completed successfully</p>
            </div>
          </div>
          
          ${detailsHtml}
          
          <p class="text-gray-600 dark:text-gray-300 mb-6">${data.message}</p>
          
          <button class="w-full px-4 py-2.5 text-white bg-green-600 hover:bg-green-700 rounded-xl font-medium transition-colors" data-action="ok">
            Continue
          </button>
        </div>
      </div>
    `
    
    document.body.appendChild(dialog)
    
    const handleAction = () => {
      if (dialog.parentNode) {
        document.body.removeChild(dialog)
      }
      resolve()
    }
    
    dialog.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.dataset.action === 'ok') {
        handleAction()
      } else if (target === dialog) {
        handleAction()
      }
    })
    
    // Auto-close if specified
    if (data.autoClose) {
      setTimeout(handleAction, data.autoClose)
    }
    
    // Focus the button
    const okBtn = dialog.querySelector('[data-action="ok"]') as HTMLButtonElement
    okBtn?.focus()
  })
}

// Modern error dialog
export const showErrorDialog = (data: ErrorDialogData): Promise<void> => {
  return new Promise((resolve) => {
    const dialog = document.createElement('div')
    dialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
    
    const detailsHtml = data.details ? `
      <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-6">
        <p class="text-red-800 dark:text-red-200 text-sm">${data.details}</p>
      </div>
    ` : ''
    
    dialog.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${data.title}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Operation failed</p>
            </div>
          </div>
          
          ${detailsHtml}
          
          <p class="text-gray-600 dark:text-gray-300 mb-6">${data.message}</p>
          
          <button class="w-full px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-colors" data-action="ok">
            OK
          </button>
        </div>
      </div>
    `
    
    document.body.appendChild(dialog)
    
    const handleAction = () => {
      if (dialog.parentNode) {
        document.body.removeChild(dialog)
      }
      resolve()
    }
    
    dialog.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.dataset.action === 'ok') {
        handleAction()
      } else if (target === dialog) {
        handleAction()
      }
    })
    
    // Focus the button
    const okBtn = dialog.querySelector('[data-action="ok"]') as HTMLButtonElement
    okBtn?.focus()
  })
}

// Convenience functions for common use cases
export const confirmDelete = (itemName: string, itemType: string = 'item'): Promise<boolean> => {
  return showConfirmDialog({
    title: `Delete ${itemType}`,
    message: `Are you sure you want to delete this ${itemType}? This action cannot be undone.`,
    confirmText: `Delete ${itemType}`,
    type: 'danger',
    details: [
      { label: 'Name', value: itemName }
    ]
  })
}

export const confirmBulkDelete = (count: number, itemType: string = 'items'): Promise<boolean> => {
  return showConfirmDialog({
    title: `Delete ${count} ${itemType}`,
    message: `Are you sure you want to delete ${count} ${itemType}? This action cannot be undone.`,
    confirmText: `Delete ${count} ${itemType}`,
    type: 'danger'
  })
}

export const showSuccess = (message: string, details?: { label: string, value: string }[]): Promise<void> => {
  return showSuccessDialog({
    title: 'Success',
    message,
    details,
    autoClose: 3000
  })
}

export const showError = (message: string, details?: string): Promise<void> => {
  return showErrorDialog({
    title: 'Error',
    message,
    details
  })
}
