"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Receipt,
  Calendar,
  User,
  Pill,
  FileText,
  Grid3X3,
  List,
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'

interface Prescription {
  $id: string
  prescriptionNo: string
  patientId: string
  prescriberId: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  notes?: string
  createdAt: string
  updatedAt: string
  isInvoiced?: boolean
  invoiceNo?: string
  patient?: {
    id: string
    firstName: string
    lastName: string
    patientNo: string
  }
  prescriber?: {
    id: string
    name: string
    email: string
  }
  items?: Array<{
    id: string
    title: string
    dosage?: string
    frequency?: string
    duration?: string
    instructions?: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
    dueDate?: string
    medication?: {
      id: string
      name: string
      strength: string
      unit: string
    }
  }>
}

interface PrescriptionsClientProps {
  initialPrescriptions: Prescription[]
  patients: any[]
  medications: any[]
  userRole: string
}

export default function PrescriptionsClient({ 
  initialPrescriptions, 
  patients, 
  medications, 
  userRole 
}: PrescriptionsClientProps) {
  const router = useRouter()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions || [])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list')

  useEffect(() => {
    setMounted(true)
    loadPrescriptions()
  }, [])

  // Reload prescriptions when window regains focus (e.g., returning from edit page)
  useEffect(() => {
    if (!mounted) return

    const handleFocus = () => {
      loadPrescriptions()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [mounted])

  const loadPrescriptions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/prescriptions', {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions')
      }

      const data = await response.json()
      setPrescriptions(data.prescriptions || [])
    } catch (error) {
      console.error('Error loading prescriptions:', error)
      setError('Failed to load prescriptions')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePrescription = async (prescriptionId: string) => {
    if (!confirm('Are you sure you want to delete this prescription? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete prescription')
      }

      setPrescriptions(prev => prev.filter(p => p.$id !== prescriptionId))
      console.log('Prescription deleted successfully')
      
      // Reload prescriptions to ensure data is fresh
      await loadPrescriptions()
    } catch (error) {
      console.error('Error deleting prescription:', error)
      alert('Failed to delete prescription. Please try again.')
    }
  }

  const handleConvertToInvoice = async (prescriptionId: string) => {
    // Find the prescription to check if it's already invoiced
    const prescription = prescriptions.find(p => p.$id === prescriptionId)
    
    if (prescription?.isInvoiced) {
      alert(`This prescription has already been converted to an invoice. Invoice: ${prescription.invoiceNo}`)
      return
    }

    if (!confirm('Are you sure you want to convert this prescription to an invoice? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/convert-to-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle specific error cases
        if (response.status === 409) {
          // Already converted
          alert(`This prescription has already been converted to an invoice. Invoice: ${errorData.invoiceNo}`)
          return
        } else if (response.status === 400) {
          // Not completed
          alert('Only completed prescriptions can be converted to invoices')
          return
        } else {
          throw new Error(errorData.error || 'Failed to convert prescription to invoice')
        }
      }

      const data = await response.json()
      
      // Show success message
      alert(`Prescription ${data.invoice.prescriptionNo} successfully converted to invoice ${data.invoice.invoiceNo}`)
      
      // Reload prescriptions to get updated status
      await loadPrescriptions()
      
      // Navigate to billing page to create/edit the invoice
      router.push('/billing')
      
      console.log('Prescription converted to invoice successfully:', data.message)
    } catch (error: any) {
      console.error('Error converting prescription to invoice:', error)
      alert(error.message || "Failed to convert prescription to invoice. Please try again.")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: '📝' },
      active: { label: 'Active', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: '⏳' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: '✅' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: '❌' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    )
  }

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = 
      prescription.prescriptionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.patient?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.patient?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.prescriber?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Loading prescriptions...</p>
          <p className="text-slate-500 dark:text-slate-500 mt-2 text-sm">Please wait while we fetch the prescription data</p>
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
              <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Prescriptions</h1>
              <div className="flex items-center gap-4 mt-1 sm:mt-2">
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">Manage patient prescriptions and <span className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">convert them to invoices</span></p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href="/prescriptions/new"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 font-medium flex items-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">New Prescription</span>
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
                  placeholder="Search prescriptions (number, patient, doctor)..."
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
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
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

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Professional Prescriptions Display */}
        {viewMode === 'cards' ? (
          /* Professional Card Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {filteredPrescriptions.map((prescription) => (
              <div
                key={prescription.$id}
                className="group bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600"
              >
                {/* Prescription Header */}
                <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm sm:text-base truncate">
                          {prescription.prescriptionNo}
                        </h3>
                        <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-mono">
                          {prescription.patient ? `${prescription.patient.firstName} ${prescription.patient.lastName}` : 'Unknown Patient'}
                        </p>
                      </div>
                    </div>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors flex-shrink-0">
                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                  </div>
                </div>

                {/* Prescription Information */}
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">Date</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                      {format(new Date(prescription.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">Doctor</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                      {prescription.prescriber?.name || 'Unknown'}
                    </span>
                  </div>

                  {prescription.items && prescription.items.length > 0 && (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <Pill className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">{prescription.items.length} medication(s)</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 text-xs">Status</span>
                    {getStatusBadge(prescription.status)}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/prescriptions/${prescription.$id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ClipboardList className="w-3 h-3" />
                        <span>Open</span>
                      </Link>
                      
                      {prescription.status === 'completed' && (
                        <button
                          onClick={() => handleConvertToInvoice(prescription.$id)}
                          disabled={prescription.isInvoiced}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            prescription.isInvoiced 
                              ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                          title={prescription.isInvoiced ? `Already invoiced: ${prescription.invoiceNo}` : "Convert to Invoice"}
                        >
                          <Receipt className="w-3 h-3" />
                          <span>{prescription.isInvoiced ? 'Invoiced' : 'Invoice'}</span>
                        </button>
                      )}
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
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Prescription</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hidden sm:table-cell">Patient</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hidden md:table-cell">Doctor</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hidden lg:table-cell">Date</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hidden xl:table-cell">Medications</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hidden md:table-cell">Status</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredPrescriptions.map((prescription) => (
                    <tr key={prescription.$id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-2 sm:py-4 px-2 sm:px-6">
                        {/* Mobile: Compact layout */}
                        <div className="sm:hidden">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                                {prescription.prescriptionNo}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                                {prescription.patient ? `${prescription.patient.firstName} ${prescription.patient.lastName}` : 'Unknown Patient'}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {format(new Date(prescription.createdAt), 'MMM dd, yyyy')} • {prescription.prescriber?.name || 'Unknown Doctor'}
                              </div>
                              <div className="mt-1">
                                {getStatusBadge(prescription.status)}
                              </div>
                            </div>
                            <Link 
                              href={`/prescriptions/${prescription.$id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                            >
                              <ClipboardList className="w-3 h-3" />
                              <span>Open</span>
                            </Link>
                          </div>
                        </div>
                        
                        {/* Desktop: Original horizontal layout */}
                        <div className="hidden sm:block">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                                {prescription.prescriptionNo}
                              </div>
                              <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-mono">
                                {prescription.patient ? `${prescription.patient.firstName} ${prescription.patient.lastName}` : 'Unknown Patient'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden sm:table-cell">
                        <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {prescription.patient ? `${prescription.patient.firstName} ${prescription.patient.lastName}` : 'Unknown Patient'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {prescription.patient?.patientNo || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden md:table-cell">
                        <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {prescription.prescriber?.name || 'Unknown Doctor'}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden lg:table-cell">
                        <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {format(new Date(prescription.createdAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {format(new Date(prescription.createdAt), 'HH:mm')}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden xl:table-cell">
                        {prescription.items && prescription.items.length > 0 ? (
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            <Pill className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                            <span>{prescription.items.length} medication(s)</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm">No medications</span>
                        )}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden md:table-cell">
                        {getStatusBadge(prescription.status)}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        {/* Desktop: Show buttons in Actions column */}
                        <div className="hidden sm:flex items-center gap-2">
                          <Link 
                            href={`/prescriptions/${prescription.$id}`}
                            className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ClipboardList className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">Open</span>
                          </Link>
                          
                          {prescription.status === 'completed' && (
                            <button
                              onClick={() => handleConvertToInvoice(prescription.$id)}
                              disabled={prescription.isInvoiced}
                              className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                                prescription.isInvoiced 
                                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                              title={prescription.isInvoiced ? `Already invoiced: ${prescription.invoiceNo}` : "Convert to Invoice"}
                            >
                              <Receipt className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden xs:inline">{prescription.isInvoiced ? 'Invoiced' : 'Invoice'}</span>
                            </button>
                          )}
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
        {filteredPrescriptions.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Pill className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {searchTerm ? 'No prescriptions found' : 'No prescriptions recorded yet'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? 'Try a different search term or add a new prescription.'
                : 'Record your first prescription to start prescription management.'
              }
            </p>
            {!searchTerm && (
              <Link 
                href="/prescriptions/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Record First Prescription
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}