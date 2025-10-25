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
  User
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const { showToast } = useToast()

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
  }, [isChangingStatus]) // Only depend on isChangingStatus

  // Focus-based refresh
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Window focused, refreshing invoices...')
      fetchInvoices()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, []) // Empty dependency array

  // Initial load
  useEffect(() => {
    fetchInvoices(true)
  }, []) // Empty dependency array

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search invoices (number, patient, amount)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
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
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAllGroups}
            className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAllGroups}
            className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Collapse All
          </button>
          
          <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 transition-colors ${viewMode === 'cards' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Groups */}
      <div className="space-y-4">
        {customerGroups.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No invoices found</h3>
            <p className="text-slate-600 dark:text-slate-400">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          customerGroups.map((group) => (
            <div key={group.patient.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              {/* Customer Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-200 dark:border-slate-700"
                onClick={() => toggleGroupExpansion(group.patient.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedGroups.has(group.patient.id) ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
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
                          {group.patient.patientNo}
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
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {group.invoices.length} invoice{group.invoices.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoices List */}
              {expandedGroups.has(group.patient.id) && (
                <div className="border-t border-slate-200 dark:border-slate-700">
                  {viewMode === 'cards' ? (
                    <div className="p-4 space-y-3">
                      {group.invoices.map((invoice) => (
                        <div key={invoice.$id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {invoice.invoiceNo}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {new Date(invoice.issueDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {formatCurrency(invoice.amount, currency)}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                Balance: {formatCurrency(invoice.balance, currency)}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
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
                                className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Invoice
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Patient
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Balance
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {group.invoices.map((invoice) => (
                            <tr key={invoice.$id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                      {invoice.invoiceNo}
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                      {invoice.patient?.firstName} {invoice.patient?.lastName}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {invoice.patient?.firstName} {invoice.patient?.lastName}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                  {invoice.patient?.patientNo}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {new Date(invoice.issueDate).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                  {new Date(invoice.issueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm font-medium text-slate-900 dark:text-slate-100">
                                {formatCurrency(invoice.amount, currency)}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`text-sm font-medium ${Number(invoice.balance) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                  {formatCurrency(invoice.balance, currency)}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                {getStatusBadge(invoice.status)}
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/billing/${invoice.$id}`}
                                    className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View
                                  </Link>
                                  {invoice.status === 'paid' ? (
                                    <button
                                      disabled
                                      className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed"
                                    >
                                      <FileText className="w-4 h-4" />
                                      Invoiced
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => changeInvoiceStatus(invoice.$id, 'paid')}
                                      className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                    >
                                      <FileText className="w-4 h-4" />
                                      Invoice
                                    </button>
                                  )}
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
    </div>
  )
}