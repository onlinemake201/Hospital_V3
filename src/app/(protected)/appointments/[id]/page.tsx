"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, User, MapPin, Edit, Trash2, ArrowLeft } from 'lucide-react'

interface Patient {
  id: string
  firstName: string
  lastName: string
  patientNo: string
  phone?: string
  email?: string
}

interface Appointment {
  id: string
  patientId: string
  providerId: string
  room: string
  startAt: string
  endAt: string
  reason: string
  status: string
  patient: Patient
  provider: { id: string; name: string }
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = params.id as string
  
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAppointment() {
      try {
        setLoading(true)
        setError(null)
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const response = await fetch(`/api/appointments/${appointmentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add cache control for better performance
          cache: 'no-store',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Appointment not found')
          }
          throw new Error(`Failed to fetch appointment: ${response.status}`)
        }
        
        const data = await response.json()
        setAppointment(data.appointment)
      } catch (err: any) {
        console.error('Error fetching appointment:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    if (appointmentId) {
      fetchAppointment()
    }
  }, [appointmentId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 mt-6 text-lg font-medium">Loading appointment details...</p>
          <p className="text-slate-500 dark:text-slate-500 mt-2 text-sm">Please wait while we fetch the information</p>
        </div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Appointment Not Found</h1>
          <p className="text-gray-600 mt-2">The requested appointment could not be found.</p>
          <Link href="/appointments" className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Appointments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/appointments" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Appointments
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Appointment Details
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Appointment #{appointment.id}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Patient Information
              </h3>
              {appointment.patient ? (
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {appointment.patient.firstName} {appointment.patient.lastName}</p>
                  <p><span className="font-medium">Patient No:</span> {appointment.patient.patientNo}</p>
                  {appointment.patient.phone && <p><span className="font-medium">Phone:</span> {appointment.patient.phone}</p>}
                  {appointment.patient.email && <p><span className="font-medium">Email:</span> {appointment.patient.email}</p>}
                </div>
              ) : (
                <p className="text-gray-500">Patient information not available</p>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Appointment Details
              </h3>
              <div className="space-y-2">
                <p><span className="font-medium">Date:</span> {new Date(appointment.startAt).toISOString().split('T')[0]}</p>
                <p><span className="font-medium">Time:</span> {new Date(appointment.startAt).toISOString().split('T')[1].slice(0, 5)} - {new Date(appointment.endAt).toISOString().split('T')[1].slice(0, 5)} UTC</p>
                <p><span className="font-medium">Status:</span> <span className="capitalize">{appointment.status}</span></p>
                {appointment.room && <p><span className="font-medium">Room:</span> {appointment.room}</p>}
                {appointment.reason && <p><span className="font-medium">Reason:</span> {appointment.reason}</p>}
              </div>
            </div>
          </div>

          {appointment.provider && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Provider
              </h3>
              <p>{appointment.provider?.name || 'Standard Provider'}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex gap-4">
            <Link
              href={`/appointments/${appointment.id}/edit`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Appointment
            </Link>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this appointment?')) {
                  // Handle delete
                  console.log('Delete appointment:', appointment.id)
                }
              }}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}