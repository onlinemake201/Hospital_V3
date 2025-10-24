"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Plus, Search, Filter, Calendar, Phone, Mail, Weight, Shield, Eye, MoreVertical, Grid3X3, List, UserCheck, Activity, Heart, Stethoscope, ClipboardList } from 'lucide-react'

interface Patient {
  id: string
  patientNo: string
  firstName: string
  lastName: string
  dob: string
  gender: string
  insurance?: string
  phone?: string
  email?: string
  weight?: number
  allergies?: string
  dbStatus?: 'active' | 'inactive' | 'archived' | 'pending'
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived' | 'pending'>('all')

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
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    )
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    async function fetchPatients() {
      try {
        const response = await fetch('/api/patients', {
          cache: 'force-cache',
          next: { revalidate: 300 }, // 5 Minuten Cache
          headers: {
            'Cache-Control': 'max-age=300, stale-while-revalidate=600'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setPatients(data.patients || [])
          setFilteredPatients(data.patients || [])
        } else {
          console.error('Failed to fetch patients:', response.status)
          setPatients([])
          setFilteredPatients([])
        }
      } catch (error) {
        console.error('Failed to fetch patients:', error)
        setPatients([])
        setFilteredPatients([])
      } finally {
        setLoading(false)
      }
    }
    
    // Initiale Daten laden
    fetchPatients()
    
    // Cleanup beim Unmount
    return () => {
      // Kein automatisches Update mehr
    }
  }, [mounted])

  useEffect(() => {
    let filtered = patients

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(patient => 
        patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.includes(searchTerm)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(patient => 
        (patient.dbStatus || 'active') === statusFilter
      )
    }

    setFilteredPatients(filtered)
  }, [searchTerm, patients, statusFilter])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Loading patients...</p>
          <p className="text-slate-500 dark:text-slate-500 mt-2 text-sm">Please wait while we fetch the patient data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Modern Header (aligned with Appointments) */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Patient Management</h1>
              <div className="flex items-center gap-4 mt-1 sm:mt-2">
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">Medical patient records and information</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href="/patients/new"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 font-medium flex items-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">New Patient</span>
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
                  placeholder="Search patients (name, patient number, phone)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 sm:py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 min-w-[140px] text-sm sm:text-base"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                  <option value="pending">Pending</option>
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

        {/* Professional Patient Display */}
        {viewMode === 'cards' ? (
          /* Professional Card Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {filteredPatients.map((patient) => (
              <Link 
                key={patient.id} 
                href={`/patients/${patient.id}`}
                className="group bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600"
              >
                {/* Patient Header */}
                <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm sm:text-base truncate">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-mono">
                          {patient.patientNo}
                        </p>
                      </div>
                    </div>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors flex-shrink-0">
                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                  </div>
                </div>

                {/* Patient Information */}
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">Age</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                      {new Date().getFullYear() - new Date(patient.dob).getFullYear()} years
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">Gender</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                      {patient.gender === 'Male' ? 'Male' : patient.gender === 'Female' ? 'Female' : patient.gender}
                    </span>
                  </div>

                  {patient.phone && (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400 truncate">{patient.phone}</span>
                    </div>
                  )}

                  {patient.insurance && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">{patient.insurance}</span>
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-b-lg">
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Click for patient details
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Professional Table View */
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Patient</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hidden sm:table-cell">Age</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hidden md:table-cell">Gender</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hidden lg:table-cell">Contact</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hidden xl:table-cell">Insurance</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hidden md:table-cell">Status</th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-2 sm:py-4 px-2 sm:px-6">
                        {/* Mobile: Compact layout with minimal spacing */}
                        <div className="sm:hidden">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                                {patient.firstName} {patient.lastName}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                                {patient.patientNo}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date().getFullYear() - new Date(patient.dob).getFullYear()} years • {patient.gender === 'Male' ? 'Male' : patient.gender === 'Female' ? 'Female' : patient.gender}
                              </div>
                              <div className="mt-1">
                                {getStatusBadge(patient.dbStatus)}
                              </div>
                            </div>
                            <Link 
                              href={`/patients/${patient.id}`}
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
                              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                                {patient.firstName} {patient.lastName}
                              </div>
                              <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-mono">
                                {patient.patientNo}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden sm:table-cell">
                        <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {new Date().getFullYear() - new Date(patient.dob).getFullYear()} years
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(patient.dob).toLocaleDateString('en-US')}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                            patient.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'
                          }`}></div>
                          <span className="text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            {patient.gender === 'Male' ? 'Male' : patient.gender === 'Female' ? 'Female' : patient.gender}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden lg:table-cell">
                        <div className="space-y-1">
                          {patient.phone && (
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                              <Phone className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                              <span className="truncate">{patient.phone}</span>
                            </div>
                          )}
                          {patient.email && (
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{patient.email}</span>
                            </div>
                          )}
                          {!patient.phone && !patient.email && (
                            <span className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm">Not specified</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden xl:table-cell">
                        {patient.insurance ? (
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                            <span className="truncate">{patient.insurance}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm">Not specified</span>
                        )}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden md:table-cell">
                        {getStatusBadge(patient.dbStatus)}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        {/* Desktop: Show button in Actions column */}
                        <div className="hidden sm:block">
                          <Link 
                            href={`/patients/${patient.id}`}
                            className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ClipboardList className="w-3 h-3 sm:w-4 sm:h-4" />
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
        {filteredPatients.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {searchTerm ? 'No patients found' : 'No patients recorded yet'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? 'Try a different search term or add a new patient.'
                : 'Record your first patient to start patient management.'
              }
            </p>
            {!searchTerm && (
              <Link 
                href="/patients/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Record First Patient
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}