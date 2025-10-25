"use client"

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/a11y'
import { getCurrency } from '@/lib/system-settings'
import { useToast } from '@/components/modern-toast'
import { useConfirm } from '@/components/modern-confirm'
import { 
  DollarSign, 
  AlertTriangle, 
  Calendar, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  CreditCard,
  Eye,
  Trash2
} from 'lucide-react'

interface Invoice {
  $id: string
  invoiceNo: string
  issueDate: string
  dueDate: string
  amount: number
  balance: number
  status: string
  currency?: string
  items: string | any[]
  patientId?: string
  patient: {
    id: string
    firstName: string
    lastName: string
    patientNo: string
  }
  payments: any[]
}


interface CustomerGroup {
  patient: {
    id: string
    firstName: string
    lastName: string
    patientNo: string
  }
  invoices: Invoice[]
  totalAmount: number
  totalBalance: number
  status: 'paid' | 'partial' | 'outstanding' | 'overdue'
}

interface BillingPageProps {
  initialInvoices?: Invoice[]
}

export default function BillingPage({ initialInvoices = [] }: BillingPageProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set())
  const [currency, setCurrency] = useState('CHF')
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const router = useRouter()
  const { showToast, ToastContainer } = useToast()
  const { showConfirm, ConfirmModalComponent } = useConfirm()

  useEffect(() => {
    // Always fetch fresh data from API to avoid stale initial data
    fetchInvoices()
    getCurrency().then(setCurrency)
  }, [])

  // Listen for page focus to refresh data when returning from edit pages
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Page focused, refreshing invoices...')
      fetchInvoices()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Automatic refresh every 5 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isChangingStatus) {
        console.log('🔄 Auto-refresh triggered')
        fetchInvoices()
      } else {
        console.log('⏸️ Auto-refresh skipped - status change in progress')
      }
    }, 5000) // 5 seconds for better responsiveness

    return () => clearInterval(interval)
  }, [isChangingStatus])

  // Manual status update function for specific invoice
  const updateInvoiceStatus = async (invoiceId: string) => {
    try {
      console.log('🔄 Manual status update for invoice:', invoiceId)
      
      const response = await fetch(`/api/billing/${invoiceId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Status updated manually:', result)
        
        // Refresh the invoices list to show updated status
        await fetchInvoices()
      } else {
        console.error('❌ Manual status update failed:', response.status)
      }
    } catch (error) {
      console.error('❌ Error updating invoice status:', error)
    }
  }

  // Change invoice status function
  const changeInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    console.log('🚀 changeInvoiceStatus called with:', { invoiceId, newStatus })
    
    // Set flag to prevent auto-refresh during status change
    setIsChangingStatus(true)
    
    try {
      console.log('🔄 Changing invoice status:', { invoiceId, newStatus })
      
      // Show confirmation for critical status changes
      if (newStatus === 'paid' || newStatus === 'overdue') {
        console.log('⚠️ Critical status change, showing confirmation')
        const confirmed = confirm(`Are you sure you want to change the status to "${newStatus}"?`)
        console.log('Confirmation result:', confirmed)
        if (!confirmed) {
          console.log('❌ User cancelled, resetting select')
          // Reset the select to original value
          const selectElement = document.querySelector(`select[data-invoice-id="${invoiceId}"]`) as HTMLSelectElement
          if (selectElement) {
            const invoice = invoices.find(inv => inv.$id === invoiceId)
            if (invoice) {
              selectElement.value = invoice.status
              console.log('✅ Select reset to:', invoice.status)
            }
          }
          return
        }
      }
      
      console.log('🌐 Making API request to:', `/api/billing/${invoiceId}/status`)
      const response = await fetch(`/api/billing/${invoiceId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      console.log('📡 API response status:', response.status)
      console.log('📡 API response ok:', response.ok)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Status changed successfully:', result)
        
        // Show success message
        console.log('🎉 Showing success toast for:', newStatus)
        showToast(`Status changed to ${newStatus}`, 'success')
        
        // Update the invoice status in the local state immediately
        console.log('🔄 Updating local state for invoice:', invoiceId)
        setInvoices(prevInvoices => 
          prevInvoices.map(inv => 
            inv.$id === invoiceId 
              ? { ...inv, status: newStatus }
              : inv
          )
        )
        
        // Also refresh from server after a short delay to ensure DB is updated
        console.log('🔄 Scheduling server refresh in 2 seconds...')
        setTimeout(async () => {
          console.log('🔄 Refreshing from server after status change')
          await fetchInvoices()
        }, 2000)
      } else {
        const error = await response.json()
        console.error('❌ Status change failed:', error)
        console.log('🚨 Showing error toast for:', error.error)
        showToast(`Failed to change status: ${error.error}`, 'error')
        
        // Reset the select to original value on error
        console.log('🔄 Resetting select on error for invoice:', invoiceId)
        const selectElement = document.querySelector(`select[data-invoice-id="${invoiceId}"]`) as HTMLSelectElement
        if (selectElement) {
          const invoice = invoices.find(inv => inv.$id === invoiceId)
          if (invoice) {
            selectElement.value = invoice.status
            console.log('✅ Select reset to original value:', invoice.status)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error changing invoice status:', error)
      console.log('🚨 Showing catch error toast')
      showToast('Failed to change status', 'error')
      
      // Reset the select to original value on error
      console.log('🔄 Resetting select on catch error for invoice:', invoiceId)
      const selectElement = document.querySelector(`select[data-invoice-id="${invoiceId}"]`) as HTMLSelectElement
      if (selectElement) {
        const invoice = invoices.find(inv => inv.$id === invoiceId)
        if (invoice) {
          selectElement.value = invoice.status
          console.log('✅ Select reset to original value:', invoice.status)
        }
      }
    } finally {
      // Reset the flag after a short delay to allow server refresh
      console.log('🔄 Resetting isChangingStatus flag in 3 seconds')
      setTimeout(() => {
        console.log('✅ Resetting isChangingStatus flag')
        setIsChangingStatus(false)
      }, 3000)
    }
  }

  const fetchInvoices = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true)
    }
    
    try {
      console.log('🔄 Fetching invoices from API...')
      
      const response = await fetch('/api/billing', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch invoices')
      const data = await response.json()
      
      console.log('📊 Fetched invoices from API:', data.invoices)
      
      // Use invoices as they come from the API
      // Status logic should be handled on the backend
      setInvoices(data.invoices || [])
      
      console.log('✅ Invoices state updated')
    } catch (error) {
      console.error('❌ Error fetching invoices:', error)
      // Set empty array on error to prevent crashes
      setInvoices([])
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  // Delete invoice function
  const deleteInvoice = async (invoiceId: string) => {
    console.log('🗑️ deleteInvoice called for:', invoiceId)
    const invoice = invoices.find(inv => inv.$id === invoiceId)
    if (!invoice) {
      console.log('❌ Invoice not found:', invoiceId)
      return
    }

    console.log('⚠️ Showing delete confirmation for:', invoice.invoiceNo)
    const confirmed = confirm(`Are you sure you want to delete invoice ${invoice.invoiceNo}? This action cannot be undone.`)
    console.log('Confirmation result:', confirmed)
    
    if (!confirmed) {
      console.log('❌ User cancelled delete')
      return
    }

    try {
      console.log('🌐 Making DELETE request to:', `/api/billing/${invoiceId}`)
      const response = await fetch(`/api/billing/${invoiceId}`, {
        method: 'DELETE'
      })

      console.log('📡 Delete response status:', response.status)
      console.log('📡 Delete response ok:', response.ok)

      if (response.ok) {
        console.log('✅ Invoice deleted successfully')
        showToast('Invoice deleted successfully', 'success')
        // Refresh the invoices list
        console.log('🔄 Refreshing invoices after delete')
        fetchInvoices()
      } else {
        const errorData = await response.json()
        console.error('❌ Delete failed:', errorData)
        throw new Error(errorData.error || 'Delete failed')
      }
    } catch (error) {
      console.error('❌ Delete error:', error)
      showToast(`Failed to delete invoice: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }

  // Gruppierung nach Kunden mit automatischer Statusaktualisierung
  const customerGroups = useMemo(() => {
    let filtered = invoices

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.patient && (
          inv.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.patient.patientNo.toLowerCase().includes(searchTerm.toLowerCase())
        )) ||
        (inv.patientId && inv.patientId.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Gruppierung nach Patient - alle Invoices anzeigen, auch ohne Patient-Daten
    const grouped = filtered
      .reduce((groups: { [key: string]: CustomerGroup }, invoice) => {
        // Verwende Patient-ID oder Invoice-ID als Fallback
        const patientId = invoice.patient?.id || invoice.$id
        
        if (!groups[patientId]) {
          groups[patientId] = {
            patient: invoice.patient || {
              id: invoice.$id,
              firstName: 'Unknown',
              lastName: 'Patient',
              patientNo: invoice.patientId || 'N/A'
            },
            invoices: [],
            totalAmount: 0,
            totalBalance: 0,
            status: 'outstanding' as const
          }
        }
        
        groups[patientId].invoices.push(invoice)
        groups[patientId].totalAmount += Number(invoice.amount)
        groups[patientId].totalBalance += Number(invoice.balance)
        
        return groups
      }, {})

    // Status für jede Kundengruppe bestimmen - basierend auf Invoice-Status, nicht Balance
    Object.values(grouped).forEach(group => {
      const hasOverdue = group.invoices.some(inv => inv.status === 'overdue')
      const allPaid = group.invoices.every(inv => inv.status === 'paid')
      const allSent = group.invoices.every(inv => inv.status === 'sent')
      const allDraft = group.invoices.every(inv => inv.status === 'draft')
      const hasSent = group.invoices.some(inv => inv.status === 'sent')
      const hasDraft = group.invoices.some(inv => inv.status === 'draft')
      
      if (hasOverdue) {
        group.status = 'overdue'
      } else if (allPaid) {
        group.status = 'paid'
      } else if (allSent) {
        group.status = 'sent'
      } else if (allDraft) {
        group.status = 'draft'
      } else if (hasSent) {
        group.status = 'sent'
      } else if (hasDraft) {
        group.status = 'draft'
      } else {
        group.status = 'outstanding'
      }
      
      console.log('📊 Customer group status:', {
        customerName: group.customerName,
        invoiceCount: group.invoices.length,
        status: group.status,
        invoices: group.invoices.map(inv => ({
          id: inv.$id,
          status: inv.status,
          balance: inv.balance,
          dueDate: inv.dueDate
        }))
      })
    })

    // Filter by status
    if (statusFilter !== 'all') {
      return Object.values(grouped).filter(group => group.status === statusFilter)
    }

    return Object.values(grouped)
  }, [invoices, searchTerm, statusFilter])

  // Optimized calculations with useMemo
  const overdueInvoices = useMemo(() => 
    invoices.filter(inv => 
      inv.status === 'overdue' || (new Date(inv.dueDate) < new Date() && Number(inv.balance) > 0)
    ), [invoices]
  )

  const totalOutstanding = useMemo(() => 
    invoices.reduce((sum, inv) => sum + Number(inv.balance), 0), [invoices]
  )

  const thisMonthAmount = useMemo(() => {
    const now = new Date()
    return invoices
      .filter(inv => {
        const issueDate = new Date(inv.issueDate)
        return issueDate.getMonth() === now.getMonth() && issueDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, inv) => sum + Number(inv.amount), 0)
  }, [invoices])

  const paidTodayAmount = useMemo(() => {
    const today = new Date()
    return invoices
      .flatMap(inv => inv.payments || [])
      .filter(payment => {
        const paidDate = new Date(payment.paidAt)
        return paidDate.toDateString() === today.toDateString()
      })
      .reduce((sum, payment) => sum + Number(payment.amount), 0)
  }, [invoices])

  const unpaidInvoicesCount = useMemo(() => 
    invoices.filter(inv => Number(inv.balance) > 0).length, [invoices]
  )

  const overdueAmount = useMemo(() => 
    overdueInvoices.reduce((sum, inv) => sum + Number(inv.balance), 0), [overdueInvoices]
  )

  const thisMonthInvoicesCount = useMemo(() => {
    const now = new Date()
    return invoices.filter(inv => {
      const issueDate = new Date(inv.issueDate)
      return issueDate.getMonth() === now.getMonth() && issueDate.getFullYear() === now.getFullYear()
    }).length
  }, [invoices])

  const todayPaymentsCount = useMemo(() => {
    const today = new Date()
    return invoices.flatMap(inv => inv.payments || []).filter(payment => {
      const paidDate = new Date(payment.paidAt)
      return paidDate.toDateString() === today.toDateString()
    }).length
  }, [invoices])

  // Funktionen zum Ein- und Ausklappen der Kundengruppen
  const toggleCustomer = (customerId: string) => {
    setExpandedCustomers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(customerId)) {
        newSet.delete(customerId)
      } else {
        newSet.add(customerId)
      }
      return newSet
    })
  }

  const expandAllCustomers = () => {
    const allCustomerIds = customerGroups.map(group => group.patient.id)
    setExpandedCustomers(new Set(allCustomerIds))
  }

  const collapseAllCustomers = () => {
    setExpandedCustomers(new Set())
  }

  if (loading && invoices.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-slate-500 dark:text-slate-400">Loading invoices...</div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Billing</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">Manage invoices and payments</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/billing/new"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 font-medium text-center min-h-[44px] flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              New Invoice
            </Link>
          </div>
        </div>

        {/* Modern Dashboard Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Outstanding */}
          <div className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500 rounded-xl shadow-lg group-hover:bg-blue-600 transition-colors">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Total Outstanding</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(totalOutstanding, currency)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300 font-medium">Outstanding Balance</span>
            </div>
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 opacity-75">
              {unpaidInvoicesCount} unpaid invoices
            </div>
          </div>

          {/* Overdue Invoices */}
          <div className="group bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl shadow-lg border border-red-200 dark:border-red-800 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500 rounded-xl shadow-lg group-hover:bg-red-600 transition-colors">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-red-600 dark:text-red-400 font-medium uppercase tracking-wide">Overdue Invoices</div>
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">{overdueInvoices.length}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300 font-medium">Require Attention</span>
            </div>
            <div className="mt-2 text-xs text-red-600 dark:text-red-400 opacity-75">
              {formatCurrency(overdueAmount, currency)} overdue amount
            </div>
          </div>

          {/* This Month */}
          <div className="group bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl shadow-lg border border-green-200 dark:border-green-800 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 rounded-xl shadow-lg group-hover:bg-green-600 transition-colors">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">This Month</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(thisMonthAmount, currency)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300 font-medium">Monthly Revenue</span>
            </div>
            <div className="mt-2 text-xs text-green-600 dark:text-green-400 opacity-75">
              {thisMonthInvoicesCount} invoices this month
            </div>
          </div>

          {/* Paid Today */}
          <div className="group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-800 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500 rounded-xl shadow-lg group-hover:bg-purple-600 transition-colors">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">Paid Today</div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(paidTodayAmount, currency)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-purple-700 dark:text-purple-300 font-medium">Today's Payments</span>
            </div>
            <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 opacity-75">
              {todayPaymentsCount} payments today
            </div>
          </div>
        </div>

        {/* Alerts */}
        {overdueInvoices.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-xl">
            <h3 className="font-medium">Overdue Invoices</h3>
            <p className="text-sm opacity-80">
              {overdueInvoices.length} invoice(s) require immediate attention
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg">
          <div className="p-6">
            <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 text-slate-900 dark:text-slate-100 min-h-[44px] sm:w-auto outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Customers</option>
                <option value="outstanding">Outstanding</option>
                <option value="partial">Partially Paid</option>
                <option value="paid">Fully Paid</option>
                <option value="overdue">Overdue</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={expandAllCustomers}
                  className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-200 min-h-[44px]"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAllCustomers}
                  className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-200 min-h-[44px]"
                >
                  Collapse All
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {customerGroups.map((group) => (
                <div key={group.patient.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                  {/* Customer Header */}
                  <div 
                    className="bg-slate-50 dark:bg-slate-700/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => toggleCustomer(group.patient.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <svg 
                            className={`w-5 h-5 transition-transform text-slate-600 dark:text-slate-400 ${expandedCustomers.has(group.patient.id) ? 'rotate-90' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div>
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                              {group.patient.firstName} {group.patient.lastName}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Patient No: {group.patient.patientNo} • {group.invoices.length} invoice(s)
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">Total Amount</div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(group.totalAmount, currency)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">Outstanding</div>
                          <div className={`font-semibold ${group.totalBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {formatCurrency(group.totalBalance, currency)}
                          </div>
                        </div>
                        <div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            group.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            group.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            group.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            group.status === 'draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {group.status === 'paid' ? 'Fully Paid' :
                             group.status === 'overdue' ? 'Overdue' :
                             group.status === 'sent' ? 'Sent' :
                             group.status === 'draft' ? 'Draft' :
                             'Outstanding'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Invoices Table - nur anzeigen wenn ausgeklappt */}
                  {expandedCustomers.has(group.patient.id) && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Invoice No.</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Issue Date</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Amount</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Balance</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.invoices.map((invoice) => (
                            <tr key={invoice.$id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                              <td className="py-3 px-4 font-mono text-sm text-slate-900 dark:text-slate-100">{invoice.invoiceNo}</td>
                              <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">{new Date(invoice.issueDate).toLocaleDateString('en-US')}</td>
                              <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">{new Date(invoice.dueDate).toLocaleDateString('en-US')}</td>
                              <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">{formatCurrency(invoice.amount, currency || 'CHF')}</td>
                              <td className="py-3 px-4">
                                <span className={`text-sm font-medium ${Number(invoice.balance) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                  {formatCurrency(invoice.balance, currency || 'CHF')}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  value={invoice.status}
                                  onChange={(e) => {
                                    console.log('🎯 Select onChange triggered for invoice:', invoice.$id, 'new value:', e.target.value)
                                    changeInvoiceStatus(invoice.$id, e.target.value)
                                  }}
                                  data-invoice-id={invoice.$id}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-600 cursor-pointer transition-all duration-200 hover:shadow-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${
                                    invoice.status === 'paid' ? 'border-green-300 bg-green-50 dark:bg-green-900/20' :
                                    invoice.status === 'partial' ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20' :
                                    invoice.status === 'overdue' ? 'border-red-300 bg-red-50 dark:bg-red-900/20' :
                                    invoice.status === 'sent' || invoice.status === 'pending' ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' :
                                    'border-gray-300 bg-gray-50 dark:bg-gray-900/20'
                                  }`}
                                >
                                  <option value="draft">Draft</option>
                                  <option value="sent">Sent</option>
                                  <option value="paid">Paid</option>
                                  <option value="overdue">Overdue</option>
                                </select>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Link 
                                    href={`/billing/${invoice.$id}`}
                                    className="group relative rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 text-xs font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-1 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                                  >
                                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                                    <Eye className="w-3 h-3 relative z-10 group-hover:rotate-12 transition-transform duration-200" />
                                    <span className="relative z-10">View</span>
                                  </Link>
                                  <button 
                                    onClick={() => {
                                      console.log('🗑️ Delete button clicked for invoice:', invoice.$id)
                                      deleteInvoice(invoice.$id)
                                    }}
                                    className="group relative rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 text-xs font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-1 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                                  >
                                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-400 to-red-500 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                                    <Trash2 className="w-3 h-3 relative z-10 group-hover:rotate-12 transition-transform duration-200" />
                                    <span className="relative z-10">Delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
              
              {customerGroups.length === 0 && (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  {searchTerm || statusFilter !== 'all' ? 'No customers found matching your criteria.' : 'No customers found.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirm Modal */}
      <ConfirmModalComponent />
      
      {/* Toast Container */}
      <ToastContainer />
    </main>
  )
}