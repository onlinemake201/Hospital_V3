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
  status: 'paid' | 'overdue' | 'sent' | 'draft' | 'outstanding'
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
  const [showAllInvoices, setShowAllInvoices] = useState(false)
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
      console.log('📊 Fetched invoices:', data.invoices?.length || 0)
      
      if (data.invoices) {
        setInvoices(data.invoices)
      } else {
        console.warn('⚠️ No invoices array in response:', data)
        setInvoices([])
      }
    } catch (error) {
      console.error('❌ Error fetching invoices:', error)
      showToast('Failed to fetch invoices', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  // Auto-refresh with smart timing - FIXED DEPENDENCIES
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
  }, [isChangingStatus]) // Only depend on isChangingStatus, not fetchInvoices

  // Focus-based refresh - FIXED DEPENDENCIES
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Window focused, refreshing invoices...')
      fetchInvoices()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, []) // Empty dependency array to prevent re-registration

  // Initial load - FIXED DEPENDENCIES
  useEffect(() => {
    fetchInvoices(true)
  }, []) // Empty dependency array to run only once

  const changeInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    console.log('🚀 changeInvoiceStatus called with:', { invoiceId, newStatus })
    setIsChangingStatus(true) // Set flag to prevent auto-refresh
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

    // If showAllInvoices is true, create individual groups for each invoice
    if (showAllInvoices) {
      return filtered.map(invoice => ({
        patient: invoice.patient || { id: invoice.patientId, firstName: 'Unknown', lastName: 'Patient', patientNo: 'N/A' },
        invoices: [invoice],
        totalAmount: Number(invoice.amount),
        totalBalance: invoice.status === 'paid' ? 0 : Number(invoice.balance),
        status: invoice.status as 'paid' | 'overdue' | 'sent' | 'draft' | 'outstanding'
      }))
    }

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
  }, [invoices, searchTerm, statusFilter, showAllInvoices])

  const dashboardStats = useMemo(() => {
    const totalOutstanding = invoices.reduce((sum, inv) => 
      inv.status === 'paid' ? sum : sum + Number(inv.balance), 0)
    
    const totalPaid = invoices.reduce((sum, inv) => 
      inv.status === 'paid' ? sum + Number(inv.amount) : sum, 0)
    
    const overdueCount = invoices.filter(inv => inv.status === 'overdue').length
    
    return {
      totalOutstanding,
      totalPaid,
      overdueCount,
      totalInvoices: invoices.length
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

  const toggleShowAllInvoices = () => {
    setShowAllInvoices(!showAllInvoices)
    if (!showAllInvoices) {
      // When showing all invoices, expand all groups
      expandAllGroups()
    } else {
      // When hiding all invoices, collapse all groups
      collapseAllGroups()
    }
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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading billing data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Billing
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Manage invoices and <span className="bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded-md text-blue-700 dark:text-blue-300">track payments</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/billing/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                New
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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

        {/* Invoice Display - Cards or List */}
        {viewMode === 'cards' ? (
          /* Card Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {customerGroups.map((group) => (
              <div key={group.patient.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
                {/* Patient Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {group.patient.firstName} {group.patient.lastName}
                      </h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                        {group.patient.patientNo}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {group.invoices.length} invoice{group.invoices.length !== 1 ? 's' : ''}
                    </div>
                    {getStatusBadge(group.status)}
                  </div>
                </div>

                {/* Invoice Summary */}
                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Total Amount:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(group.totalAmount, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Outstanding:</span>
                    <span className={`font-medium ${Number(group.totalBalance) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {formatCurrency(group.totalBalance, currency)}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="p-4 pt-0">
                  <Link
                    href={`/billing/${group.invoices[0]?.$id}`}
                    className="w-full bg-blue-600 text-white text-center py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Invoices
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            {/* Table Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
              <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                <div className="col-span-3">PATIENT</div>
                <div className="col-span-2">INVOICE</div>
                <div className="col-span-2">DATE</div>
                <div className="col-span-1">AMOUNT</div>
                <div className="col-span-1">BALANCE</div>
                <div className="col-span-2">STATUS</div>
                <div className="col-span-1">ACTION</div>
              </div>
            </div>

            {/* Invoice Groups */}
            {customerGroups.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No invoices found</h3>
                <p className="text-slate-600 dark:text-slate-400">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              customerGroups.map((group) => (
                <div key={group.patient.id} className="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                  {/* Patient Group Header */}
                  <div 
                    className="px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    onClick={() => toggleGroupExpansion(group.patient.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedGroups.has(group.patient.id) ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {group.patient.firstName} {group.patient.lastName}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {group.patient.patientNo} • {group.invoices.length} invoice{group.invoices.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {formatCurrency(group.totalAmount, currency)}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Outstanding: {formatCurrency(group.totalBalance, currency)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(group.status)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Individual Invoices */}
                  {expandedGroups.has(group.patient.id) && (
                    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      {group.invoices.map((invoice, index) => (
                        <div key={invoice.$id} className={`px-4 py-3 ${index !== group.invoices.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
                          <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Patient */}
                            <div className="col-span-3 flex items-center gap-3">
                              <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                                <Receipt className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {index === 0 ? `${group.patient.firstName} ${group.patient.lastName}` : 'Additional invoice'}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {group.patient.patientNo}
                                </div>
                              </div>
                            </div>

                            {/* Invoice */}
                            <div className="col-span-2">
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {invoice.invoiceNo}
                              </div>
                            </div>

                            {/* Date */}
                            <div className="col-span-2">
                              <div className="text-sm text-slate-900 dark:text-slate-100">
                                {new Date(invoice.issueDate).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                            </div>

                            {/* Amount */}
                            <div className="col-span-1">
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {formatCurrency(invoice.amount, currency)}
                              </div>
                            </div>

                            {/* Balance */}
                            <div className="col-span-1">
                              <div className={`text-sm font-medium ${Number(invoice.balance) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                {formatCurrency(invoice.balance, currency)}
                              </div>
                            </div>

                            {/* Status */}
                            <div className="col-span-2">
                              {getStatusBadge(invoice.status)}
                            </div>

                            {/* Action */}
                            <div className="col-span-1">
                              <Link
                                href={`/billing/${invoice.$id}`}
                                className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                              >
                                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}