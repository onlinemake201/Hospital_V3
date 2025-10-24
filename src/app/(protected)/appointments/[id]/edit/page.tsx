"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Patient {
  id: string
  firstName: string
  lastName: string
  patientNo: string
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

const ROOM_OPTIONS = [
  'Labor',
  'Bloodtest', 
  'X-Ray',
  'Doctor Checkings',
  'Emergency Room',
  'Surgery Room',
  'Consultation Room',
  'Physical Therapy',
  'Cardiology',
  'Neurology'
]

export default function EditAppointmentPage() {
  const router = useRouter()
  const params = useParams()
  const appointmentId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [patientSearchTerm, setPatientSearchTerm] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  
  const [formData, setFormData] = useState({
    patientId: '',
    room: '',
    startAt: '',
    endAt: '',
    reason: '',
    status: 'scheduled'
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [appointmentRes, patientsRes] = await Promise.all([
          fetch(`/api/appointments/${appointmentId}`),
          fetch('/api/patients')
        ])
        
        if (!appointmentRes.ok) throw new Error('Failed to fetch appointment')
        if (!patientsRes.ok) throw new Error('Failed to fetch patients')
        
        const appointmentData = await appointmentRes.json()
        const patientsData = await patientsRes.json()
        
        setAppointment(appointmentData.appointment)
        setPatients(patientsData.patients || [])
        
        // Set form data
        const apt = appointmentData.appointment
        const startDate = new Date(apt.startAt)
        const endDate = new Date(apt.endAt)
        
        const formatForInput = (date: Date) => {
          return date.toISOString().slice(0, 16)
        }
        
        setFormData({
          patientId: apt.patientId,
          room: apt.room || '',
          startAt: formatForInput(startDate),
          endAt: formatForInput(endDate),
          reason: apt.reason || '',
          status: apt.status
        })
        
        // Set patient search term
        setPatientSearchTerm(`${apt.patient.firstName} ${apt.patient.lastName}`)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [appointmentId])

  function handlePatientSelect(patient: Patient) {
    setFormData({ ...formData, patientId: patient.id })
    setPatientSearchTerm(`${patient.firstName} ${patient.lastName}`)
    setShowPatientDropdown(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    // Validate that a patient is selected
    if (!formData.patientId) {
      setError('Please select a patient')
      setSaving(false)
      return
    }

    // Validate that end time is after start time
    const startDate = new Date(formData.startAt)
    const endDate = new Date(formData.endAt)
    if (endDate <= startDate) {
      setError('End time must be after start time')
      setSaving(false)
      return
    }

    const dataToSend = {
      ...formData
    }

    try {
      console.log('Updating appointment with data:', dataToSend)
      
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Appointment update failed:', error)
        throw new Error(error.error || 'Failed to update appointment')
      }

      const { appointment } = await response.json()
      console.log('Appointment updated successfully:', appointment)
      router.push(`/appointments`)
    } catch (err: any) {
      console.error('Error updating appointment:', err)
      setError(err.message)
      setSaving(false)
    }
  }

  const selectedPatient = patients.find(p => p.id === formData.patientId)

  if (loading) {
    return (
      <main className="container py-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading appointment...</div>
        </div>
      </main>
    )
  }

  if (error || !appointment) {
    return (
      <main className="container py-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">Error: {error || 'Appointment not found.'}</div>
        </div>
      </main>
    )
  }

  return (
    <main className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-sm text-muted-foreground mb-2">
            <Link href="/appointments" className="hover:text-foreground">Appointments</Link> / Edit Appointment
          </nav>
          <h1 className="text-3xl font-semibold tracking-tight">Edit Appointment</h1>
          <p className="text-muted-foreground">Update appointment information</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="elevation bg-card p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="relative">
              <label className="block text-sm font-medium mb-2">Patient *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search patient..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-8 outline-none focus:ring-2 focus:ring-ring"
                  value={patientSearchTerm}
                  onChange={(e) => {
                    setPatientSearchTerm(e.target.value)
                    setShowPatientDropdown(true)
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  required
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {showPatientDropdown && patients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      className="px-3 py-2 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                      <div className="text-sm text-muted-foreground">#{patient.patientNo}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedPatient && (
                <div className="mt-2 p-2 bg-muted rounded-lg">
                  <div className="text-sm font-medium">Selected: {selectedPatient.firstName} {selectedPatient.lastName}</div>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Room *</label>
              <select
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              >
                <option value="">Select room</option>
                {ROOM_OPTIONS.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Start Time *</label>
              <input
                type="datetime-local"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                value={formData.startAt}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    startAt: e.target.value
                  }))
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Time *</label>
              <input
                type="datetime-local"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                value={formData.endAt}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    endAt: e.target.value
                  }))
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary text-primary-foreground px-6 py-2 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/appointments"
              className="rounded-xl border border-border bg-background px-6 py-2 font-medium hover:bg-muted"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}
