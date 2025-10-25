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

  useEffect(() => {
    let isMounted = true
    
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
        
        if (isMounted) {
          setInvoice(data.invoice)
        }
      } catch (error: any) {
        console.error('❌ Error fetching invoice:', error)
        if (isMounted) {
          setError(error.message || 'Failed to load invoice')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchInvoice()
    
    return () => {
      isMounted = false
    }
  }, [invoiceId])

  // Listen for page focus to refresh data when returning from edit
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Page focused, refreshing invoice data...')
      fetchInvoice()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [invoiceId])

  // Automatic refresh every 30 seconds for real-time status updates
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh triggered for invoice detail')
      fetchInvoice()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [invoiceId])

  // Manual refresh function
  const fetchInvoice = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Manual refresh for invoice:', invoiceId)
      
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
      console.log('📊 Refreshed invoice data:', data.invoice)
      
      setInvoice(data.invoice)
    } catch (error: any) {
      console.error('❌ Error refreshing invoice:', error)
      setError(error.message || 'Failed to refresh invoice')
    } finally {
      setLoading(false)
    }
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
      } catch (error) {
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
        showToast('Error generating PDF', 'error')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      showToast('Error downloading PDF', 'error')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      case 'partial':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
      case 'overdue':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
      case 'sent':
      case 'pending':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20'
      default:
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid'
      case 'partial':
        return 'Partially Paid'
      case 'overdue':
        return 'Overdue'
      case 'sent':
      case 'pending':
        return 'Outstanding'
      default:
        return 'Outstanding'
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/billing"
              className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Invoice {invoice.invoiceNo}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Invoice details and payment information
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <Link
              href={`/billing/${invoice.$id}/edit`}
              className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid gap-6 lg:grid-cols-1">
          {/* Invoice Info */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Invoice Information</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Issue Date</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {new Date(invoice.issueDate).toLocaleDateString('en-US')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Due Date</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {new Date(invoice.dueDate).toLocaleDateString('en-US')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Amount</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {formatCurrency(invoice.amount, currency)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 flex items-center justify-center">
                  {invoice.status === 'paid' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : invoice.status === 'overdue' ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {getStatusText(invoice.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Invoice Recipient</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Name</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {invoice.patient?.firstName} {invoice.patient?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Patient Number</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {invoice.patient?.patientNo}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Location</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {invoice.patient?.address || 'Not specified'}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Invoice Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Quantity</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Unit Price</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="py-3 px-4 text-slate-900 dark:text-slate-100">{item.description}</td>
                    <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                      {formatCurrency(item.unitPrice || item.total / item.quantity, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.total, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                  <td colSpan={3} className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    Total Amount:
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-lg text-slate-900 dark:text-slate-100">
                    {formatCurrency(invoice.amount, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payments */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Payments</h2>
            </div>
            <div className="space-y-3">
              {invoice.payments.map((payment: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(payment.amount, currency)}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {payment.method} • {new Date(payment.date).toLocaleDateString('en-US')}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-lg text-xs font-medium">
                    Paid
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Total Paid:</span>
                <span className="font-bold text-lg text-green-600 dark:text-green-400">
                  {formatCurrency(totalPaid, currency)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Outstanding Balance:</span>
                <span className={`font-bold text-lg ${Number(invoice.balance) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {formatCurrency(invoice.balance, currency)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </main>
  )
}