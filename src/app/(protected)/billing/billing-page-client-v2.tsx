"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/a11y'
import { useToast } from '@/components/modern-toast'
import { 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Calendar,
  User,
  CreditCard
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
  status: 'paid' | 'overdue' | 'outstanding' | 'sent' | 'draft'
}

interface BillingPageClientV2Props {
  initialInvoices: Invoice[]
  currency: string
}

export default function BillingPageClientV2({ initialInvoices, currency }: BillingPageClientV2Props) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const { showToast } = useToast()
  const router = useRouter()

  // Optimized fetchInvoices with useCallback
  const fetchInvoices = useCallback(async (isInitialLoad = false) => {
    if (!isInitialLoad) {
      setLoading(true)
    }
    setError(null)
    
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
      
      if (!data.invoices) {
        throw new Error('Invalid response format: missing invoices')
      }
      
      console.log('✅ Fetched invoices:', data.invoices.length)
      setInvoices(data.invoices)
      setLastRefresh(new Date())
      
    } catch (error: any) {
      console.error('❌ Error fetching invoices:', error)
      setError(error.message || 'Failed to fetch invoices')
      showToast('Failed to fetch invoices', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

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
  }, [isChangingStatus, fetchInvoices])

  // Focus-based refresh
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Window focused, refreshing invoices...')
      fetchInvoices()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchInvoices])

  // Initial load
  useEffect(() => {
    fetchInvoices(true)
  }, [fetchInvoices])

  const changeInvoiceStatus = useCallback(async (invoiceId: string, newStatus: string) => {
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
        
        // Also refresh from server after a short delay
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
      console.log('🔄 Resetting isChangingStatus flag')
      // Reset the flag after a short delay
      console.log('🔄 Resetting isChangingStatus flag in 3 seconds')
      setTimeout(() => {
        console.log('✅ Resetting isChangingStatus flag')
        setIsChangingStatus(false)
      }, 3000)
    }
  }, [invoices, showToast, fetchInvoices])

  const deleteInvoice = useCallback(async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    
    try {
      const response = await fetch(`/api/billing/${invoiceId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        showToast('Invoice deleted successfully', 'success')
        await fetchInvoices()
      } else {
        const error = await response.json()
        showToast(`Failed to delete invoice: ${error.error}`, 'error')
      }
    } catch (error) {
      console.error('❌ Error deleting invoice:', error)
      showToast('Failed to delete invoice', 'error')
    }
  }, [showToast, fetchInvoices])

  // Group invoices by customer with CORRECT status logic
  const customerGroups = useMemo(() => {
    const grouped = invoices.reduce((groups: Record<string, CustomerGroup>, invoice) => {
      const patientId = invoice.patientId || invoice.patient?.id || 'unknown'
      
      if (!groups[patientId]) {
        groups[patientId] = {
          patient: invoice.patient || {
            id: patientId,
            firstName: 'Unknown',
            lastName: 'Patient',
            patientNo: 'N/A'
          },
          invoices: [],
          totalAmount: 0,
          totalBalance: 0,
          status: 'outstanding' as const
        }
      }
      
      groups[patientId].invoices.push(invoice)
      groups[patientId].totalAmount += Number(invoice.amount)
      
      // FIXED: Calculate balance based on STATUS, not just balance field
      if (invoice.status === 'paid') {
        // If status is paid, balance should be 0 regardless of balance field
        groups[patientId].totalBalance += 0
      } else {
        // For non-paid invoices, use the actual balance
        groups[patientId].totalBalance += Number(invoice.balance)
      }
      
      return groups
    }, {})

    // Determine group status based on individual invoice statuses
    Object.values(grouped).forEach(group => {
      const hasOverdue = group.invoices.some(inv => inv.status === 'overdue')
      const allPaid = group.invoices.every(inv => inv.status === 'paid')
      const hasSent = group.invoices.some(inv => inv.status === 'sent')
      const hasDraft = group.invoices.some(inv => inv.status === 'draft')
      
      if (hasOverdue) {
        group.status = 'overdue'
      } else if (allPaid) {
        group.status = 'paid'
      } else if (hasSent) {
        group.status = 'sent'
      } else if (hasDraft) {
        group.status = 'draft'
      } else {
        group.status = 'outstanding'
      }
    })

    return Object.values(grouped)
  }, [invoices])

  // Filter groups based on search and status
  const filteredGroups = useMemo(() => {
    return customerGroups.filter(group => {
      const matchesSearch = searchTerm === '' || 
        group.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.patient.patientNo.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || group.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [customerGroups, searchTerm, statusFilter])

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
      paid: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      overdue: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertTriangle },
      sent: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: FileText },
      draft: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: FileText },
      outstanding: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: AlertTriangle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.outstanding
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status === 'outstanding' ? 'Outstanding' : 
         status === 'sent' ? 'Sent' : 
         status === 'draft' ? 'Draft' :
         status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Billing</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage invoices and payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/billing/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Invoices</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{invoices.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Amount</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(invoices.reduce((sum, inv) => sum + Number(inv.amount), 0), currency)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Outstanding</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(invoices.reduce((sum, inv) => {
                  // FIXED: Only count non-paid invoices as outstanding
                  return inv.status === 'paid' ? sum : sum + Number(inv.balance)
                }, 0), currency)}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Paid</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(invoices.reduce((sum, inv) => {
                  // FIXED: Count paid invoices by status, not by balance calculation
                  return inv.status === 'paid' ? sum + Number(inv.amount) : sum
                }, 0), currency)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading invoices...
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Error loading invoices</span>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
        </div>
      )}

      {/* Controls */}
      {!loading && !error && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="sent">Sent</option>
              <option value="draft">Draft</option>
              <option value="outstanding">Outstanding</option>
            </select>
            
            <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={expandAllGroups}
                className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                Expand All
              </button>
              <button
                onClick={collapseAllGroups}
                className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Groups */}
      {!loading && !error && filteredGroups.length > 0 && (
        <div className="space-y-4">
          {filteredGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.patient.id)
            
            return (
              <div key={group.patient.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Group Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleGroupExpansion(group.patient.id)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        )}
                      </button>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                            {group.patient.firstName} {group.patient.lastName}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Patient No: {group.patient.patientNo} • {group.invoices.length} invoice(s)
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Total Amount</p>
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(group.totalAmount, currency)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Outstanding</p>
                        <p className={`text-lg font-semibold ${group.totalBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {formatCurrency(group.totalBalance, currency)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        {getStatusBadge(group.status)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group Invoices */}
                {isExpanded && (
                  <div className="p-6">
                    {viewMode === 'cards' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.invoices.map((invoice) => (
                          <div key={invoice.$id} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-slate-900 dark:text-slate-100">
                                {invoice.invoiceNo}
                              </h4>
                              {getStatusBadge(invoice.status)}
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Amount:</span>
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                  {formatCurrency(invoice.amount, currency)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Outstanding:</span>
                                <span className={`font-medium ${Number(invoice.balance) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                  {formatCurrency(invoice.balance, currency)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Due Date:</span>
                                <span className="text-slate-900 dark:text-slate-100">
                                  {new Date(invoice.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-4">
                              <select
                                value={invoice.status}
                                onChange={(e) => changeInvoiceStatus(invoice.$id, e.target.value)}
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
                              
                              <Link
                                href={`/billing/${invoice.$id}`}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-600">
                              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Invoice</th>
                              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Amount</th>
                              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Outstanding</th>
                              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Due Date</th>
                              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Status</th>
                              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.invoices.map((invoice) => (
                              <tr key={invoice.$id} className="border-b border-slate-100 dark:border-slate-700">
                                <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">{invoice.invoiceNo}</td>
                                <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">{formatCurrency(invoice.amount, currency)}</td>
                                <td className="py-3 px-4">
                                  <span className={`text-sm font-medium ${Number(invoice.balance) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {formatCurrency(invoice.balance, currency)}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">
                                  {new Date(invoice.dueDate).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4">
                                  <select
                                    value={invoice.status}
                                    onChange={(e) => changeInvoiceStatus(invoice.$id, e.target.value)}
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
                                  <Link
                                    href={`/billing/${invoice.$id}`}
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Last Refresh Info */}
      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        Last updated: {lastRefresh.toLocaleTimeString()}
        {isChangingStatus && (
          <span className="ml-2 text-blue-600 dark:text-blue-400">
            • Status change in progress...
          </span>
        )}
      </div>
    </div>
  )
}
