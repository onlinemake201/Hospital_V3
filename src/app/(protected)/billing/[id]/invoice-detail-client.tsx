"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/a11y'
import { useToast } from '@/components/modern-toast'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Download, 
  FileText, 
  User,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Receipt,
  Loader2
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
  items: string | any[]
  notes?: string
  patient: {
    id: string
    firstName: string
    lastName: string
    patientNo: string
    address: string
  } | null
  payments: any[]
}

interface InvoiceDetailClientProps {
  invoiceId: string
}

export default function InvoiceDetailClient({ invoiceId }: InvoiceDetailClientProps) {
  const router = useRouter()
  const { showToast, ToastContainer } = useToast()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState('CHF')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load global currency setting
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const response = await fetch('/api/admin/settings')
        if (response.ok) {
          const data = await response.json()
          setCurrency(data.settings?.currency || 'CHF')
        }
      } catch (error) {
        console.error('Error loading currency:', error)
      }
    }
    loadCurrency()
  }, [])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Fetching invoice data for:', invoiceId)
      
      const response = await fetch(`/api/billing/${invoiceId}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoice')
      }
      
      const data = await response.json()
      console.log('📊 Fetched invoice data:', data.invoice)
      
      setInvoice(data.invoice)
    } catch (error: any) {
      console.error('❌ Error fetching invoice:', error)
      setError(error.message || 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mounted) {
      fetchInvoice()
    }
  }, [mounted, invoiceId])

  // Listen for page focus to refresh data when returning from edit
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Page focused, refreshing invoice data...')
      fetchInvoice()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [invoiceId])

  // Automatic refresh every 15 seconds for real-time status updates
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh triggered for invoice detail')
      fetchInvoice()
    }, 15000) // 15 seconds

    return () => clearInterval(interval)
  }, [invoiceId])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Loading invoice details...</p>
          <p className="text-slate-500 dark:text-slate-500 mt-2 text-sm">Please wait while we fetch the invoice data</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">Error loading invoice</p>
          <p className="text-slate-500 dark:text-slate-500 mt-2 text-sm">{error || 'Invoice not found'}</p>
          <Link 
            href="/billing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Billing
          </Link>
        </div>
      </div>
    )
  }

  const items = Array.isArray(invoice.items) ? invoice.items : JSON.parse(invoice.items || '[]')
  const totalPaid = invoice.payments?.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0) || 0

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete invoice ${invoice.invoiceNo}? This action cannot be undone.`)) {
      setLoading(true)
      try {
        const response = await fetch(`/api/billing/${invoice.$id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          showToast('Invoice deleted successfully', 'success')
          router.push('/billing')
        } else {
          const error = await response.json()
          showToast(error.error || 'Error deleting invoice', 'error')
        }
      } catch (error: any) {
        console.error('Error deleting invoice:', error)
        showToast('Error deleting invoice', 'error')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/billing/${invoice.$id}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoice.invoiceNo}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast('PDF downloaded successfully', 'success')
      } else {
        showToast('Error downloading PDF', 'error')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      showToast('Error downloading PDF', 'error')
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid'
      case 'partial': return 'Partially Paid'
      case 'overdue': return 'Overdue'
      case 'sent':
      case 'pending': return 'Outstanding'
      default: return 'Outstanding'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      case 'partial': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
      case 'overdue': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
      case 'sent':
      case 'pending': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20'
      default: return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/billing"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </Link>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Invoice Details
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Invoice {invoice.invoiceNo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/billing/${invoice.$id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Invoice Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Header */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Invoice {invoice.invoiceNo}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Created on {new Date(invoice.issueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-lg font-medium ${getStatusColor(invoice.status)}`}>
                  {getStatusText(invoice.status)}
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Issue Date</p>
                      <p className="text-slate-900 dark:text-slate-100">
                        {new Date(invoice.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Due Date</p>
                      <p className="text-slate-900 dark:text-slate-100">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Amount</p>
                      <p className="text-slate-900 dark:text-slate-100 font-semibold">
                        {formatCurrency(invoice.amount, currency)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Outstanding Balance</p>
                      <p className={`font-semibold ${Number(invoice.balance) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {formatCurrency(invoice.balance, currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Notes */}
            {invoice.notes && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Notes</h3>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              </div>
            )}

            {/* Invoice Items */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Invoice Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Quantity</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Unit Price</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-slate-100 dark:border-slate-700">
                        <td className="py-3 px-4 text-slate-900 dark:text-slate-100">{item.description || 'Item'}</td>
                        <td className="py-3 px-4 text-slate-900 dark:text-slate-100">{item.quantity || 1}</td>
                        <td className="py-3 px-4 text-slate-900 dark:text-slate-100">{formatCurrency(item.unitPrice || 0, currency)}</td>
                        <td className="py-3 px-4 text-right text-slate-900 dark:text-slate-100 font-medium">
                          {formatCurrency(item.total || 0, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Patient Information */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Patient Information
              </h3>
              {invoice.patient ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Name</p>
                    <p className="text-slate-900 dark:text-slate-100">
                      {invoice.patient.firstName} {invoice.patient.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Patient Number</p>
                    <p className="text-slate-900 dark:text-slate-100 font-mono">
                      {invoice.patient.patientNo}
                    </p>
                  </div>
                  {invoice.patient.address && (
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Address</p>
                      <p className="text-slate-900 dark:text-slate-100">
                        {invoice.patient.address}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No patient information available</p>
              )}
            </div>

            {/* Payment Information */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                Payment Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Amount</span>
                  <span className="text-slate-900 dark:text-slate-100 font-medium">
                    {formatCurrency(invoice.amount, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Amount Paid</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {formatCurrency(totalPaid, currency)}
                  </span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-900 dark:text-slate-100 font-semibold">Outstanding</span>
                    <span className={`font-semibold ${Number(invoice.balance) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {formatCurrency(invoice.balance, currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ToastContainer />
    </div>
  )
}