"use client"
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { confirmDelete, showSuccess, showError } from '@/lib/modern-dialogs'
import { 
  User, 
  Calendar, 
  FileText, 
  CreditCard, 
  Phone, 
  Mail, 
  MapPin, 
  Heart, 
  Weight, 
  Shield, 
  Pill, 
  Clock, 
  DollarSign,
  Edit,
  Trash2,
  Plus,
  ChevronRight,
  File,
  Download,
  Eye,
  Image,
  FileImage,
  Upload,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react'

interface Patient {
  id: string
  patientNo: string
  firstName: string
  lastName: string
  dob: string
  gender: string
  address?: string
  phone?: string
  email?: string
  insurance?: string
  weight?: number
  allergies?: string
  dbStatus?: 'active' | 'inactive' | 'archived' | 'pending'
  encounters: any[]
  appointments: any[]
  invoices: any[]
  attachments?: PatientAttachment[]
}

interface PatientAttachment {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: string
  uploadedBy: string
  description?: string
  url: string
}

interface PrescriptionItem {
  id: string
  type: string
  medicationId?: string
  title: string
  description?: string
  dosage?: string
  frequency?: string
  duration?: string
  instructions?: string
  priority?: string
  dueDate?: string
  quantity?: number
  medication?: {
    id: string
    name: string
    code: string
    form?: string
    strength?: string
    imageUrl?: string
  }
}

interface Prescription {
  id: string
  prescriptionNo: string
  status: string
  createdAt: string
  notes?: string
  prescriber?: {
    name: string
    email: string
  }
  items: PrescriptionItem[]
}

export default function PatientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showPrescriptions, setShowPrescriptions] = useState(false)
  const [prescriptionFilter, setPrescriptionFilter] = useState('all')
  const [showAttachments, setShowAttachments] = useState(false)
  const [showAppointments, setShowAppointments] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // DB-Status-Badge-Funktion
  const getStatusBadge = (status: string = 'active') => {
    const statusConfig = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: '✓' },
      inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: '○' },
      archived: { label: 'Archived', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: '📁' },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: '⏳' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    )
  }

  useEffect(() => {
    async function fetchPatient() {
      try {
        const response = await fetch(`/api/patients/${patientId}`, {
          cache: 'force-cache', // Caching für bessere Performance
          next: { revalidate: 300 }, // 5 Minuten Cache
          headers: {
            'Cache-Control': 'max-age=300, stale-while-revalidate=600'
          }
        })
        if (response.ok) {
          const data = await response.json()
          setPatient(data.patient)
          setLastUpdated(new Date())
        } else if (response.status === 404) {
          router.push('/patients')
        }
      } catch (error) {
        console.error('Failed to fetch patient:', error)
      } finally {
        setLoading(false)
      }
    }
    
    async function fetchPrescriptions() {
      try {
        const response = await fetch(`/api/patients/${patientId}/prescriptions`, {
          cache: 'force-cache', // Caching für bessere Performance
          next: { revalidate: 300 }, // 5 Minuten Cache
          headers: {
            'Cache-Control': 'max-age=300, stale-while-revalidate=600'
          }
        })
        if (response.ok) {
          const data = await response.json()
          setPrescriptions(data.prescriptions || [])
        }
      } catch (error) {
        console.error('Failed to fetch prescriptions:', error)
      }
    }
    
    // Initiale Daten laden
    fetchPatient()
    fetchPrescriptions()
    
    // Echtzeit-Update alle 5 Minuten (reduziert für bessere Performance)
    const interval = setInterval(() => {
      fetchPatient()
      fetchPrescriptions()
    }, 300000) // 5 Minuten statt 30 Sekunden
    
    setRefreshInterval(interval)
    
    // Cleanup beim Unmount
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [patientId, router])

  // Manuelle Datenaktualisierung
  const refreshData = async () => {
    setLoading(true)
    try {
      const [patientResponse, prescriptionsResponse] = await Promise.all([
        fetch(`/api/patients/${patientId}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
        fetch(`/api/patients/${patientId}/prescriptions`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      ])

      if (patientResponse.ok) {
        const patientData = await patientResponse.json()
        setPatient(patientData.patient)
      }

      if (prescriptionsResponse.ok) {
        const prescriptionsData = await prescriptionsResponse.json()
        setPrescriptions(prescriptionsData.prescriptions || [])
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletePatient() {
    if (!patient) return
    
    const confirmed = await confirmDelete(
      `${patient.firstName} ${patient.lastName}`,
      'patient'
    )
    
    if (!confirmed) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete patient')
      }

      await showSuccess('Patient deleted successfully')
      router.push('/patients')
    } catch (error) {
      console.error('Error deleting patient:', error)
      await showError('Failed to delete patient', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
            <div className="text-slate-500 dark:text-slate-400">Loading patient...</div>
          </div>
        </div>
      </main>
    )
  }

  if (!patient) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
            <div className="text-slate-500 dark:text-slate-400">Patient not found</div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
            <nav className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
              <Link href="/patients" className="hover:text-slate-700 dark:hover:text-slate-300">Patients</Link>
              <ChevronRight className="w-4 h-4" />
            <span>{patient.firstName} {patient.lastName}</span>
          </nav>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {patient.firstName} {patient.lastName}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-slate-600 dark:text-slate-400">Patient #{patient.patientNo}</p>
              
              {/* DB-Status */}
              {getStatusBadge(patient.dbStatus)}
              
              {/* Echtzeit-Status */}
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Live Data
                </span>
                {lastUpdated && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    • Updated: {lastUpdated.toLocaleTimeString('en-US')}
                  </span>
                )}
              </div>
            </div>
        </div>
          <div className="flex items-center gap-2">
            <Link 
              href={`/patients/${patient.id}/prescription/new`}
              className="rounded-lg bg-green-600 text-white px-3 py-2 text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm"
            >
              <Pill className="w-4 h-4" />
              Prescribe
            </Link>
            <Link 
              href={`/patients/${patient.id}/edit`}
              className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <button
              onClick={handleDeletePatient}
              disabled={deleting}
              className="rounded-lg bg-red-600 text-white px-3 py-2 text-sm font-medium flex items-center gap-2 hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
      </div>

        <div className="space-y-6">
        {/* Patient Information */}
            {/* Personal Information Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Personal Information</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400">Date of Birth</label>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{new Date(patient.dob).toLocaleDateString('en-US')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400">Gender</label>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{patient.gender}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400">Insurance</label>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{patient.insurance || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400">Address</label>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{patient.address || 'Not specified'}</p>
                    </div>
                  </div>
              </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Weight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400">Weight</label>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{patient.weight ? `${patient.weight} kg` : 'Not specified'}</p>
                    </div>
              </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400">Phone</label>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{patient.phone || 'Not specified'}</p>
              </div>
              </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400">Email</label>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{patient.email || 'Not specified'}</p>
                    </div>
              </div>
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400">Allergies</label>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{patient.allergies || 'None'}</p>
                    </div>
                  </div>
              </div>
              </div>
            </div>

            {/* Medication History Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Pill className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Medication History</h2>
                </div>
                <button
                  onClick={() => setShowPrescriptions(!showPrescriptions)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-700 dark:to-slate-600 hover:from-green-100 hover:to-emerald-100 dark:hover:from-slate-600 dark:hover:to-slate-500 transition-all duration-200 text-sm font-medium text-green-700 dark:text-green-300"
                >
                  <Pill className="w-4 h-4" />
                  {showPrescriptions ? 'Hide' : 'Show'} ({prescriptions.length})
                </button>
              </div>
              
              {showPrescriptions && (
                <>
                  <div className="mb-6 flex items-center gap-4">
                    <select 
                      value={prescriptionFilter}
                      onChange={(e) => setPrescriptionFilter(e.target.value)}
                      className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 text-slate-900 dark:text-slate-100 min-h-[44px] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="all">Alle Rezepte</option>
                      <option value="active">Aktive Medikamente</option>
                      <option value="completed">Abgeschlossen</option>
                      <option value="cancelled">Storniert</option>
                    </select>
                  </div>

                  {prescriptions.length > 0 ? (
                    <div className="space-y-4">
                      {prescriptions
                        .filter(prescription => {
                          if (prescriptionFilter === 'all') return true
                          return prescription.status === prescriptionFilter
                        })
                        .map((prescription) => {
                          const getStatusColor = (status: string) => {
                            switch (status?.toLowerCase()) {
                              case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            }
                          }
                          
                          return (
                            <div key={prescription.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-200">
                              {/* Header with Date and Status */}
                              <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                      <Pill className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <div className="text-white font-semibold">
                                        {new Date(prescription.createdAt).toLocaleDateString('de-DE', { 
                                          weekday: 'short', 
                                          year: 'numeric', 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })}
                                      </div>
                                      <div className="text-white/80 text-sm">
                                        Rezept #{prescription.prescriptionNo}
                                      </div>
                                    </div>
                                  </div>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                                    {prescription.status}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Prescription Details */}
                              <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Verschrieben von:</span>
                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                      {prescription.prescriber?.name || 'Unbekannt'}
                                    </span>
                                  </div>
                                  <div className="text-sm text-slate-500 dark:text-slate-400">
                                    {prescription.items?.length || 0} Medikament{(prescription.items?.length || 0) !== 1 ? 'e' : ''}
                                  </div>
                                </div>
                                
                                {/* Medication Items */}
                                {prescription.items && prescription.items.length > 0 && (
                                  <div className="space-y-3">
                                    {prescription.items.map((item, index) => (
                                      <div key={index} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                                        <div className="flex items-start gap-3">
                                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Pill className="w-4 h-4 text-green-600 dark:text-green-400" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                              {item.title || 'Medikament'}
                                            </div>
                                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 space-y-1">
                                              {item.dosage && (
                                                <div><span className="font-medium">Dosierung:</span> {item.dosage}</div>
                                              )}
                                              {item.frequency && (
                                                <div><span className="font-medium">Häufigkeit:</span> {item.frequency}</div>
                                              )}
                                              {item.duration && (
                                                <div><span className="font-medium">Dauer:</span> {item.duration}</div>
                                              )}
                                              {item.instructions && (
                                                <div><span className="font-medium">Anweisungen:</span> {item.instructions}</div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Notes */}
                                {prescription.notes && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-start gap-2">
                                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Notizen</div>
                                        <div className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                                          {prescription.notes}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Creation Info */}
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-600">
                                  <Clock className="w-3 h-3" />
                                  <span>Erstellt: {new Date(prescription.createdAt).toLocaleDateString('de-DE')} um {new Date(prescription.createdAt).toLocaleTimeString('de-DE')}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Pill className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400">Keine Rezepte gefunden</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                        Für diesen Patienten wurden noch keine Medikamente verschrieben
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Patient Attachments Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <FileImage className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Patient Files</h2>
                </div>
                <button
                  onClick={() => setShowAttachments(!showAttachments)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  {showAttachments ? 'Hide' : 'Show'} ({patient.attachments?.length || 0})
                </button>
              </div>
              
              {showAttachments && (
                <>
                  {patient.attachments && patient.attachments.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {patient.attachments.map((attachment) => {
                        const isImage = attachment.fileType.startsWith('image/')
                        const fileSizeKB = Math.round(attachment.fileSize / 1024)
                        
                        return (
                          <div key={attachment.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <div className="flex items-start gap-3">
                              {/* File Icon/Preview */}
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-r from-blue-100 to-purple-100 dark:from-slate-700 dark:to-slate-600 flex-shrink-0">
                                {isImage ? (
                                  <img 
                                    src={attachment.url} 
                                    alt={attachment.fileName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                                      if (nextElement) {
                                        nextElement.style.display = 'flex'
                                      }
                                    }}
                                  />
                                ) : null}
                                <div className={`${isImage ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}>
                                  <File className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                              </div>
                              
                              {/* File Details */}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                                  {attachment.fileName}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {fileSizeKB} KB • {new Date(attachment.uploadedAt).toLocaleDateString('en-US')}
                                </p>
                                {attachment.description && (
                                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                                    {attachment.description}
                                  </p>
                                )}
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  by {attachment.uploadedBy}
                                </p>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-3">
                              <button
                                onClick={() => window.open(attachment.url, '_blank')}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </button>
                              <button
                                onClick={() => {
                                  const link = document.createElement('a')
                                  link.href = attachment.url
                                  link.download = attachment.fileName
                                  link.click()
                                }}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-600 text-white text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </button>
                      </div>
                      </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileImage className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400">No files uploaded</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                        Upload patient documents, images, or reports
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Recent Appointments Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Recent Appointments</h2>
                </div>
                <button
                  onClick={() => setShowAppointments(!showAppointments)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-700 dark:to-slate-600 hover:from-purple-100 hover:to-pink-100 dark:hover:from-slate-600 dark:hover:to-slate-500 transition-all duration-200 text-sm font-medium text-purple-700 dark:text-purple-300"
                >
                  <Calendar className="w-4 h-4" />
                  {showAppointments ? 'Hide' : 'Show'} ({patient.appointments?.length || 0})
                </button>
              </div>
              {showAppointments && patient.appointments && patient.appointments.length > 0 ? (
                <div className="space-y-4">
                  {patient.appointments.slice(0, 5).map((appointment) => {
                    const startDate = appointment.startAt ? new Date(appointment.startAt) : null
                    const endDate = appointment.endAt ? new Date(appointment.endAt) : null
                    const duration = startDate && endDate ? Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)) : null
                    
                    const getStatusColor = (status: string) => {
                      switch (status?.toLowerCase()) {
                        case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }
                    }
                    
                    return (
                      <div key={appointment.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-200">
                        {/* Header with Date and Status */}
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-white">
                                  {startDate ? startDate.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  }) : 'No date'}
                                </div>
                                <div className="text-sm text-white/80">
                                  {startDate ? startDate.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  }) : 'No time'} 
                                  {endDate && ` - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`}
                                  {duration && ` (${duration} min)`}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30`}>
                                {appointment.status || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-4">
                          {/* Appointment Details */}
                          <div className="grid gap-4 sm:grid-cols-2">
                            {appointment.reason && (
                              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Reason</div>
                                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                                    {appointment.reason}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {appointment.room && (
                              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Room</div>
                                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                                    {appointment.room}
                                  </div>
                                </div>
                              </div>
            )}
          </div>

                          {appointment.notes && (
                            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide">Notes</div>
                                  <div className="text-sm text-slate-900 dark:text-slate-100 mt-1">
                                    {appointment.notes}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {appointment.createdAt && (
                            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span>Created: {new Date(appointment.createdAt).toLocaleDateString('en-US')} at {new Date(appointment.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>

            {/* Recent Invoices Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Recent Invoices</h2>
              </div>
            {patient.invoices.length > 0 ? (
              <div className="space-y-3">
                {patient.invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{invoice.invoiceNo}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-US') : 'No date'}
                          </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">CHF {Number(invoice.total).toFixed(2)}</div>
                        <div className={`text-xs font-medium ${
                          Number(invoice.balance) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                      }`}>
                        {Number(invoice.balance) > 0 ? `CHF ${Number(invoice.balance).toFixed(2)} due` : 'Paid'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              ) : null}
          </div>
        </div>
      </div>
    </main>
  )
}