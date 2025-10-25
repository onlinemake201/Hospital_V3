"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/a11y'
import { useToast } from '@/components/modern-toast'
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Search,
  Grid3X3,
  List,
  ChevronDown,
  ChevronRight,
  Eye,
  Plus,
  RefreshCw,
  User,
  Receipt,
  DollarSign,
  Calendar,
  Clock
} from 'lucide-react'

interface Invoice {
  $id: string
  invoiceNo: string
  issueDate: string
  dueDate: string
  amount: number
  balance: number
  status: string
  currency: string
  items: string
  patientId: string
  patient?: {
    id: string
    firstName: string
    lastName: string
    patientNo: string
  }
  payments: any[]
  $createdAt: string
  $updatedAt: string
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
  status: string
}

interface BillingPageClientV2Props {
  initialInvoices: Invoice[]
  currency: string
}

export default function BillingPageClientV2({ initialInvoices, currency }: BillingPageClientV2Props) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchInvoices = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true)
    }
    
    try {
      console.log('🔄 Fetching invoices...')
      const response = await fetch('/api/billing/v2', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📊 Fetched invoices:', data)
      
      if (data.invoices && Array.isArray(data.invoices)) {
        setInvoices(data.invoices)
        console.log('✅ Invoices updated:', data.invoices.length)
      } else {
        console.warn('⚠️ Invalid invoices data format:', data)
        setInvoices([])
      }
    } catch (error) {
      console.error('❌ Error fetching invoices:', error)
      showToast('Failed to load invoices', 'error')
    } finally {
      if (isInitial) {
        setLoading(false)
      }
    }
  }, [])

  // Auto-refresh with smart timing
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isChangingStatus) {
        console.log('🔄 Auto-refresh triggered')
        fetchInvoices()
      } else {
        console.log('⏸️ Auto-refresh skipped - status change in progress')
      }
    }, 30000) // 30 seconds
    return () => clearInterval(interval)
  }, [isChangingStatus])

  // Focus-based refresh
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Window focused, refreshing invoices...')
      fetchInvoices()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Initial load
  useEffect(() => {
    if (mounted) {
      fetchInvoices(true)
    }
  }, [mounted])

  const changeInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    console.log('🚀 changeInvoiceStatus called with:', { invoiceId, newStatus })
    setIsChangingStatus(true)
    
    try {
      console.log('🔄 Changing invoice status:', { invoiceId, newStatus })
      
      if (newStatus === 'paid' || newStatus === 'overdue') {
        console.log('⚠️ Critical status change, showing confirmation')
        const confirmed = confirm(`Are you sure you want to change the status to "${newStatus}"?`)
        console.log('Confirmation result:', confirmed)
        if (!confirmed) {
          console.log('❌ User cancelled, resetting select')
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

  const customerGroups = useMemo(() => {
    const filtered = invoices.filter(invoice => {
      const matchesSearch = !searchTerm || 
        invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.patient?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.patient?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.patient?.patientNo.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
      
      return matchesSearch && matchesStatus
    })

    const grouped = filtered.reduce((groups: Record<string, CustomerGroup>, invoice) => {
      const patientId = invoice.patientId
      if (!groups[patientId]) {
        groups[patientId] = {
          patient: invoice.patient || { id: patientId, firstName: 'Unknown', lastName: 'Patient', patientNo: 'N/A' },
          invoices: [],
          totalAmount: 0,
          totalBalance: 0,
          status: 'outstanding'
        }
      }
      
      groups[patientId].invoices.push(invoice)
      groups[patientId].totalAmount += Number(invoice.amount)
      
      // Only add balance for non-paid invoices
      if (invoice.status === 'paid') {
        groups[patientId].totalBalance += 0
      } else {
        groups[patientId].totalBalance += Number(invoice.balance)
      }
      
      return groups
    }, {})

    // Calculate group status
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
    })

    return Object.values(grouped)
  }, [invoices, searchTerm, statusFilter])

  const dashboardStats = useMemo(() => {
    const totalOutstanding = invoices.reduce((sum, inv) => 
      inv.status === 'paid' ? sum : sum + Number(inv.balance), 0)
    
    const totalPaid = invoices.reduce((sum, inv) => 
      inv.status === 'paid' ? sum + Number(inv.amount) : sum, 0)
    
    const overdueCount = invoices.filter(inv => inv.status === 'overdue').length
    const totalInvoices = invoices.length

    return {
      totalOutstanding,
      totalPaid,
      overdueCount,
      totalInvoices
    }
  }, [invoices])

  const toggleGroupExpansion = (patientId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(patientId)) {
        newSet.delete(patientId)
      } else {
        newSet.add(patientId)
      }
      return newSet
    })
  }

  const expandAllGroups = () => {
    setExpandedGroups(new Set(customerGroups.map(group => group.patient.id)))
  }

  const collapseAllGroups = () => {
    setExpandedGroups(new Set())
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: 'Paid', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: '✅' },
      overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: '⚠️' },
      sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: '📤' },
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: '📝' },
      outstanding: { label: 'Outstanding', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: '⏳' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.outstanding
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Loading invoices...</p>
          <p className="text-slate-500 dark:text-slate-500 mt-2 text-sm">Please wait while we fetch the billing data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Modern Header (aligned with other pages) */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Billing</h1>
              <div className="flex items-center gap-4 mt-1 sm:mt-2">
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">Manage invoices and <span className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">track payments</span></p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href="/billing/new"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 font-medium flex items-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">New Invoice</span>
              <span className="xs:hidden">New</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* Modern Controls */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg mb-4 sm:mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoices (number, patient, amount)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 sm:py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 min-w-[140px] text-sm sm:text-base"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      viewMode === 'cards' 
                        ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Cards</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <List className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">List</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Outstanding</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(dashboardStats.totalOutstanding, currency)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Paid</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(dashboardStats.totalPaid, currency)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Overdue</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {dashboardStats.overdueCount}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Invoices</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {dashboardStats.totalInvoices}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Professional Invoice Display */}
        {viewMode === 'cards' ? (
          /* Professional Card Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {customerGroups.map((group) => (
              <div key={group.patient.id} className="group bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600">
                {/* Invoice Header */}
                <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm sm:text-base truncate">
                          {group.patient.firstName} {group.patient.lastName}
                        </h3>
                        <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-mono">
                          {group.patient.patientNo}
                        </p>
                      </div>
                    </div>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors flex-shrink-0">
                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                  </div>
                </div>

                {/* Invoice Information */}
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">Total</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                      {formatCurrency(group.totalAmount, currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">Outstanding</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                      {formatCurrency(group.totalBalance, currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">Invoices</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                      {group.invoices.length}
                    </span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-b-lg">
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Click for invoice details
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Professional Table View */
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Invoice</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hidden sm:table-cell">Patient</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hidden md:table-cell">Date</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hidden lg:table-cell">Amount</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hidden xl:table-cell">Balance</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hidden md:table-cell">Status</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {customerGroups.map((group) => (
                    <tr key={group.patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-2 sm:py-4 px-2 sm:px-6">
                        {/* Mobile: Compact layout with minimal spacing */}
                        <div className="sm:hidden">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                                {group.patient.firstName} {group.patient.lastName}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                                {group.patient.patientNo}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {formatCurrency(group.totalAmount, currency)} • {group.invoices.length} invoice{group.invoices.length !== 1 ? 's' : ''}
                              </div>
                              <div className="mt-1">
                                {getStatusBadge(group.status)}
                              </div>
                            </div>
                            <Link 
                              href={`/billing/${group.invoices[0]?.$id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Open</span>
                            </Link>
                          </div>
                        </div>
                        
                        {/* Desktop: Original horizontal layout */}
                        <div className="hidden sm:block">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                                {group.patient.firstName} {group.patient.lastName}
                              </div>
                              <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-mono">
                                {group.patient.patientNo}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden sm:table-cell">
                        <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {group.patient.firstName} {group.patient.lastName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {group.patient.patientNo}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden md:table-cell">
                        <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {group.invoices.length > 0 ? new Date(group.invoices[0].issueDate).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {group.invoices.length} invoice{group.invoices.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden lg:table-cell">
                        <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {formatCurrency(group.totalAmount, currency)}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden xl:table-cell">
                        <span className={`text-xs sm:text-sm font-medium ${Number(group.totalBalance) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {formatCurrency(group.totalBalance, currency)}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden md:table-cell">
                        {getStatusBadge(group.status)}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        {/* Desktop: Show button in Actions column */}
                        <div className="hidden sm:block">
                          <Link 
                            href={`/billing/${group.invoices[0]?.$id}`}
                            className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">Open File</span>
                            <span className="xs:hidden">Open</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Professional Empty State */}
        {customerGroups.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Receipt className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {searchTerm ? 'No invoices found' : 'No invoices recorded yet'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? 'Try a different search term or add a new invoice.'
                : 'Create your first invoice to start billing management.'
              }
            </p>
            {!searchTerm && (
              <Link 
                href="/billing/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create First Invoice
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}