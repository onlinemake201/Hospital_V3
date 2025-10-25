"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/a11y'
import { getCurrency } from '@/lib/system-settings'
import { useToast } from '@/components/modern-toast'
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
  Trash2,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  Edit,
  FileText,
  Download
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
  status: 'paid' | 'outstanding' | 'overdue' | 'sent' | 'draft'
}

interface BillingPageClientV2Props {
  initialInvoices: Invoice[]
  currency: string
}

export default function BillingPageClientV2({ initialInvoices, currency }: BillingPageClientV2Props) {
  const router = useRouter()
  const { showToast } = useToast()
  
  // State management
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Fetch invoices with better error handling and caching - STABLE FUNCTION
  const fetchInvoices = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    
    try {
      console.log('🔄 Fetching invoices...')
      
      const response = await fetch('/api/billing/v2', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.invoices || !Array.isArray(data.invoices)) {
        throw new Error('Invalid response format')
      }
      
      console.log('✅ Invoices fetched successfully:', data.invoices.length)
      setInvoices(data.invoices)
      setLastRefresh(new Date())
      
    } catch (error) {
      console.error('❌ Error fetching invoices:', error)
      showToast('Failed to load invoices', 'error')
      // Don't clear invoices on error, keep existing data
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [showToast]) // Only depend on showToast

  // Smart status change handler
  const changeInvoiceStatus = useCallback(async (invoiceId: string, newStatus: string) => {
    if (isChangingStatus) {
      console.log('⏸️ Status change already in progress, skipping')
      return
    }

    setIsChangingStatus(true)
    
    try {
      console.log('🔄 Changing invoice status:', { invoiceId, newStatus })
      
      // Show confirmation for critical status changes
      if (newStatus === 'paid' || newStatus === 'overdue') {
        const confirmed = confirm(`Are you sure you want to change the status to "${newStatus}"?`)
        if (!confirmed) {
          // Reset dropdown to original value
          const selectElement = document.querySelector(`select[data-invoice-id="${invoiceId}"]`) as HTMLSelectElement
          if (selectElement) {
            const invoice = invoices.find(inv => inv.$id === invoiceId)
            if (invoice) {
              selectElement.value = invoice.status
            }
          }
          return
        }
      }
      
      const response = await fetch(`/api/billing/${invoiceId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update status')
      }
      
      const result = await response.json()
      console.log('✅ Status changed successfully:', result)
      
      // Update local state immediately
      setInvoices(prevInvoices => 
        prevInvoices.map(inv => 
          inv.$id === invoiceId 
            ? { ...inv, status: newStatus, $updatedAt: new Date().toISOString() }
            : inv
        )
      )
      
      showToast(`Status changed to ${newStatus}`, 'success')
      
      // Refresh from server after a delay to ensure consistency
      setTimeout(() => {
        fetchInvoices()
      }, 2000)
      
    } catch (error: any) {
      console.error('❌ Error changing status:', error)
      showToast(`Failed to change status: ${error.message}`, 'error')
      
      // Reset dropdown on error
      const selectElement = document.querySelector(`select[data-invoice-id="${invoiceId}"]`) as HTMLSelectElement
      if (selectElement) {
        const invoice = invoices.find(inv => inv.$id === invoiceId)
        if (invoice) {
          selectElement.value = invoice.status
        }
      }
    } finally {
      // Reset flag after a delay to allow server refresh
      setTimeout(() => {
        setIsChangingStatus(false)
      }, 3000)
    }
  }, [invoices, isChangingStatus, showToast, fetchInvoices])

  // Delete invoice handler
  const deleteInvoice = useCallback(async (invoiceId: string) => {
    const confirmed = confirm('Are you sure you want to delete this invoice?')
    if (!confirmed) return

    try {
      console.log('🗑️ Deleting invoice:', invoiceId)
      
      const response = await fetch(`/api/billing/${invoiceId}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete invoice')
      }
      
      // Remove from local state
      setInvoices(prevInvoices => prevInvoices.filter(inv => inv.$id !== invoiceId))
      showToast('Invoice deleted successfully', 'success')
      
    } catch (error) {
      console.error('❌ Error deleting invoice:', error)
      showToast('Failed to delete invoice', 'error')
    }
  }, [showToast])

  // Group invoices by customer
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
      groups[patientId].totalBalance += Number(invoice.balance)
      
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
        group.patient.patientNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.invoices.some(inv => inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || group.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [customerGroups, searchTerm, statusFilter])

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

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'paid':
          return { 
            text: 'Fully Paid', 
            className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            icon: CheckCircle
          }
        case 'overdue':
          return { 
            text: 'Overdue', 
            className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            icon: AlertTriangle
          }
        case 'sent':
          return { 
            text: 'Sent', 
            className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            icon: Clock
          }
        case 'draft':
          return { 
            text: 'Draft', 
            className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
            icon: FileText
          }
        default:
          return { 
            text: 'Outstanding', 
            className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            icon: Clock
          }
      }
    }

    const config = getStatusConfig(status)
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    )
  }

  // Status dropdown component
  const StatusDropdown = ({ invoice }: { invoice: Invoice }) => {
    const statusOptions = [
      { value: 'draft', label: 'Draft' },
      { value: 'sent', label: 'Sent' },
      { value: 'paid', label: 'Paid' },
      { value: 'overdue', label: 'Overdue' }
    ]

    return (
      <select
        value={invoice.status}
        onChange={(e) => changeInvoiceStatus(invoice.$id, e.target.value)}
        data-invoice-id={invoice.$id}
        disabled={isChangingStatus}
        className={`px-3 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-all duration-200 hover:shadow-md ${
          invoice.status === 'paid' ? 'border-green-300 bg-green-50 dark:bg-green-900/20' :
          invoice.status === 'overdue' ? 'border-red-300 bg-red-50 dark:bg-red-900/20' :
          invoice.status === 'sent' ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' :
          invoice.status === 'draft' ? 'border-gray-300 bg-gray-50 dark:bg-gray-900/20' :
          'border-gray-300 bg-gray-50 dark:bg-gray-900/20'
        } ${isChangingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {statusOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Billing Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage invoices and track payments
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchInvoices(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <Link
            href="/billing/new"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search invoices, patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="outstanding">Outstanding</option>
        </select>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-2 rounded-lg transition-colors ${
              viewMode === 'cards' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 rounded-lg transition-colors ${
              viewMode === 'table' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                {formatCurrency(invoices.reduce((sum, inv) => sum + Number(inv.balance), 0), currency)}
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
                {formatCurrency(invoices.reduce((sum, inv) => sum + (Number(inv.amount) - Number(inv.balance)), 0), currency)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-slate-600 dark:text-slate-400">Loading invoices...</span>
        </div>
      )}

      {/* Customer Groups */}
      {!loading && (
        <div className="space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                No invoices found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by creating your first invoice'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link
                  href="/billing/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  Create Invoice
                </Link>
              )}
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.patient.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Customer Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {group.patient.firstName} {group.patient.lastName}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Patient No: {group.patient.patientNo} • {group.invoices.length} invoice(s)
                        </p>
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
                      
                      <StatusBadge status={group.status} />
                      
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedGroups)
                          if (newExpanded.has(group.patient.id)) {
                            newExpanded.delete(group.patient.id)
                          } else {
                            newExpanded.add(group.patient.id)
                          }
                          setExpandedGroups(newExpanded)
                        }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Invoice List */}
                {expandedGroups.has(group.patient.id) && (
                  <div className="p-6">
                    {viewMode === 'cards' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.invoices.map((invoice) => (
                          <div key={invoice.$id} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-medium text-slate-900 dark:text-slate-100">
                                  {invoice.invoiceNo}
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                                </p>
                              </div>
                              <StatusBadge status={invoice.status} />
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Amount:</span>
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                  {formatCurrency(invoice.amount, currency)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Balance:</span>
                                <span className={`font-medium ${Number(invoice.balance) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                  {formatCurrency(invoice.balance, currency)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <StatusDropdown invoice={invoice} />
                              
                              <div className="flex gap-2">
                                <Link
                                  href={`/billing/${invoice.$id}`}
                                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </Link>
                                
                                <button
                                  onClick={() => deleteInvoice(invoice.$id)}
                                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-600">
                              <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Invoice No.</th>
                              <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Issue Date</th>
                              <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Due Date</th>
                              <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Amount</th>
                              <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Balance</th>
                              <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Status</th>
                              <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.invoices.map((invoice) => (
                              <tr key={invoice.$id} className="border-b border-slate-200 dark:border-slate-600">
                                <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">{invoice.invoiceNo}</td>
                                <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">
                                  {new Date(invoice.issueDate).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">
                                  {new Date(invoice.dueDate).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">
                                  {formatCurrency(invoice.amount, currency)}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`text-sm font-medium ${Number(invoice.balance) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {formatCurrency(invoice.balance, currency)}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <StatusDropdown invoice={invoice} />
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex gap-2">
                                    <Link
                                      href={`/billing/${invoice.$id}`}
                                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                    >
                                      <Eye className="w-3 h-3" />
                                      View
                                    </Link>
                                    
                                    <button
                                      onClick={() => deleteInvoice(invoice.$id)}
                                      className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Delete
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
