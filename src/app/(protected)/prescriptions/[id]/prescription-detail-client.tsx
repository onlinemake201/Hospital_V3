"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Download, 
  FileText, 
  User,
  Calendar,
  Clock,
  Pill,
  AlertCircle,
  CheckCircle,
  Eye,
  Receipt,
  Plus
} from 'lucide-react'

interface PrescriptionDetailClientProps {
  prescription: any
}

export default function PrescriptionDetailClient({ prescription }: PrescriptionDetailClientProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />
      case 'active': return <Clock className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <AlertCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this prescription? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/prescriptions/${prescription.$id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete prescription')
      }

      router.push('/prescriptions')
    } catch (error) {
      console.error('Error deleting prescription:', error)
      alert('Failed to delete prescription. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    router.push(`/prescriptions/${prescription.$id}/edit`)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {!mounted ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-8"></div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href="/prescriptions"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Prescriptions
                </Link>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
            
            <div className="mt-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Prescription {prescription.prescriptionNo}
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Created on {formatDate(prescription.$createdAt)}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-8">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(prescription.status)}`}>
              {getStatusIcon(prescription.status)}
              {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Patient & Prescriber Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Patient Information */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Patient Information
                </h2>
                
                {prescription.patient ? (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Name:</span>
                      <p className="text-slate-900 dark:text-slate-100">
                        {prescription.patient.firstName} {prescription.patient.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Patient ID:</span>
                      <p className="text-slate-900 dark:text-slate-100">{prescription.patient.patientNo}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">Patient information not available</p>
                )}
              </div>

              {/* Prescriber Information */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Prescriber Information
                </h2>
                
                {prescription.prescriber ? (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Name:</span>
                      <p className="text-slate-900 dark:text-slate-100">{prescription.prescriber.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Email:</span>
                      <p className="text-slate-900 dark:text-slate-100">{prescription.prescriber.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">Prescriber information not available</p>
                )}
              </div>

              {/* Prescription Items */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Prescription Items
                </h2>
                
                {prescription.items && prescription.items.length > 0 ? (
                  <div className="space-y-4">
                    {prescription.items.map((item: any, index: number) => (
                      <div key={index} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-slate-900 dark:text-slate-100">
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {item.description}
                              </p>
                            )}
                            
                            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                              {item.dosage && (
                                <div>
                                  <span className="font-medium text-slate-500 dark:text-slate-400">Dosage:</span>
                                  <p className="text-slate-900 dark:text-slate-100">{item.dosage}</p>
                                </div>
                              )}
                              {item.frequency && (
                                <div>
                                  <span className="font-medium text-slate-500 dark:text-slate-400">Frequency:</span>
                                  <p className="text-slate-900 dark:text-slate-100">{item.frequency}</p>
                                </div>
                              )}
                              {item.duration && (
                                <div>
                                  <span className="font-medium text-slate-500 dark:text-slate-400">Duration:</span>
                                  <p className="text-slate-900 dark:text-slate-100">{item.duration}</p>
                                </div>
                              )}
                              {item.instructions && (
                                <div>
                                  <span className="font-medium text-slate-500 dark:text-slate-400">Instructions:</span>
                                  <p className="text-slate-900 dark:text-slate-100">{item.instructions}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No prescription items found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Prescription Details */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Prescription Details
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Prescription No:</span>
                    <p className="text-slate-900 dark:text-slate-100">{prescription.prescriptionNo}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Created:</span>
                    <p className="text-slate-900 dark:text-slate-100">{formatDateTime(prescription.$createdAt)}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Last Updated:</span>
                    <p className="text-slate-900 dark:text-slate-100">{formatDateTime(prescription.$updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {prescription.notes && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Notes
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {prescription.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}