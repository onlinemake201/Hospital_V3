"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Patient {
  id: string
  firstName: string
  lastName: string
  patientNo: string
}

interface Appointment {
  id: string
  startAt: string
  endAt: string
  room: string
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

function NewAppointmentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [patientSearchTerm, setPatientSearchTerm] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [availableStartTimes, setAvailableStartTimes] = useState<string[]>([])
  const [availableEndTimes, setAvailableEndTimes] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    patientId: '',
    room: '',
    startAt: '',
    endAt: '',
    reason: '',
    status: 'scheduled'
  })

  // Generate 30-minute time slots from 8:00 to 18:00
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    return slots
  }

  // Calculate available times based on room and existing appointments
  const calculateAvailableTimes = (room: string, selectedDate?: string) => {
    if (!room) {
      setAvailableStartTimes([])
      setAvailableEndTimes([])
      return
    }

    const allTimeSlots = generateTimeSlots()
    // Only check appointments for the specific room
    const roomAppointments = appointments.filter(apt => 
      apt.room === room && 
      (!selectedDate || apt.startAt.startsWith(selectedDate))
    )

    // Create a set of occupied time slots for this specific room
    const occupiedSlots = new Set<string>()
    roomAppointments.forEach(apt => {
      const start = new Date(apt.startAt)
      const end = new Date(apt.endAt)
      
      // Mark all 30-minute slots as occupied
      let current = new Date(start)
      while (current < end) {
        const hour = current.getHours()
        const minute = current.getMinutes() >= 30 ? '30' : '00'
        occupiedSlots.add(`${hour.toString().padStart(2, '0')}:${minute}`)
        current.setMinutes(current.getMinutes() + 30)
      }
    })

    // Filter out occupied slots for this room only
    const availableSlots = allTimeSlots.filter(slot => !occupiedSlots.has(slot))
    
    setAvailableStartTimes(availableSlots)
    setAvailableEndTimes(availableSlots)
  }

  // Get modern horizontal layout for concurrent appointments
  const getModernAppointmentLayout = (selectedDate?: string) => {
    if (!selectedDate) return []
    
    const hours = Array.from({ length: 11 }, (_, i) => i + 8) // 8:00 to 18:00
    const layout: Array<{
      hour: number
      appointments: Array<{
        room: string
        patient: string
        startTime: string
        endTime: string
        duration: number
        color: string
        isSelectedRoom: boolean
      }>
    }> = []
    
    // Define colors for different rooms
    const roomColors = {
      'Labor': 'bg-teal-100 border-teal-500 text-teal-800',
      'Bloodtest': 'bg-orange-100 border-orange-500 text-orange-800',
      'X-Ray': 'bg-purple-100 border-purple-500 text-purple-800',
      'Doctor Checkings': 'bg-blue-100 border-blue-500 text-blue-800',
      'Emergency Room': 'bg-red-100 border-red-500 text-red-800',
      'Surgery Room': 'bg-green-100 border-green-500 text-green-800',
      'Consultation Room': 'bg-yellow-100 border-yellow-500 text-yellow-800',
      'Physical Therapy': 'bg-pink-100 border-pink-500 text-pink-800',
      'Cardiology': 'bg-indigo-100 border-indigo-500 text-indigo-800',
      'Neurology': 'bg-gray-100 border-gray-500 text-gray-800'
    }
    
    hours.forEach(hour => {
      const appointmentsAtHour: Array<{
        room: string
        patient: string
        startTime: string
        endTime: string
        duration: number
        color: string
        isSelectedRoom: boolean
      }> = []
      
      ROOM_OPTIONS.forEach(room => {
        const roomAppointments = appointments.filter(apt => 
          apt.room === room && 
          apt.startAt.startsWith(selectedDate)
        )
        
        roomAppointments.forEach(apt => {
          const start = new Date(apt.startAt)
          const end = new Date(apt.endAt)
          const startHour = start.getHours()
          const endHour = end.getHours()
          
          // Check if this appointment covers the current hour
          if (startHour <= hour && endHour > hour) {
            const startTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
            const endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`
            const duration = (end.getTime() - start.getTime()) / (1000 * 60) // in minutes
            
            appointmentsAtHour.push({
              room,
              patient: `${(apt as any).patient?.firstName || 'Unknown'} ${(apt as any).patient?.lastName || 'Patient'}`,
              startTime,
              endTime,
              duration,
              color: roomColors[room as keyof typeof roomColors] || 'bg-gray-100 border-gray-500 text-gray-800',
              isSelectedRoom: formData.room === room
            })
          }
        })
      })
      
      if (appointmentsAtHour.length > 0) {
        layout.push({
          hour,
          appointments: appointmentsAtHour
        })
      }
    })
    
    return layout
  }

  useEffect(() => {
    // Load patients
    fetch('/api/patients')
      .then(r => r.json())
      .then(data => {
        setPatients(data.patients || [])
        setFilteredPatients(data.patients || [])
        
        // Set patient from URL parameter
        const patientId = searchParams.get('patientId')
        if (patientId) {
          const preselectedPatient = data.patients.find((p: Patient) => p.id === patientId)
          if (preselectedPatient) {
            setFormData(prev => ({ ...prev, patientId: preselectedPatient.id }))
            setPatientSearchTerm(`${preselectedPatient.firstName} ${preselectedPatient.lastName}`)
          }
        }
      })
      .catch(err => console.error('Failed to load patients:', err))

    // Load appointments to check availability
    fetch('/api/appointments')
      .then(r => r.json())
      .then(data => {
        setAppointments(data.appointments || [])
      })
      .catch(err => console.error('Failed to load appointments:', err))

    // Handle pre-filled time from calendar
    const dateFromUrl = searchParams.get('date')
    const startTimeFromUrl = searchParams.get('startTime')
    const endTimeFromUrl = searchParams.get('endTime')

    if (dateFromUrl && startTimeFromUrl && endTimeFromUrl) {
      // Convert local time to UTC for storage
      const startDateTime = new Date(`${dateFromUrl}T${startTimeFromUrl}`).toISOString()
      const endDateTime = new Date(`${dateFromUrl}T${endTimeFromUrl}`).toISOString()
      
      setFormData(prev => ({
        ...prev,
        startAt: startDateTime,
        endAt: endDateTime
      }))
    }
  }, [searchParams])

  // Calculate available times when room or date changes
  useEffect(() => {
    if (formData.room) {
      const selectedDate = formData.startAt ? formData.startAt.split('T')[0] : undefined
      calculateAvailableTimes(formData.room, selectedDate)
    }
  }, [formData.room, formData.startAt, appointments])

  useEffect(() => {
    if (!patientSearchTerm) {
      setFilteredPatients(patients)
    } else {
      const filtered = patients.filter(patient => 
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        patient.patientNo.toLowerCase().includes(patientSearchTerm.toLowerCase())
      )
      setFilteredPatients(filtered)
    }
  }, [patientSearchTerm, patients])

  function handlePatientSelect(patient: Patient) {
    setFormData({ ...formData, patientId: patient.id })
    setPatientSearchTerm(`${patient.firstName} ${patient.lastName}`)
    setShowPatientDropdown(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate that a patient is selected
    if (!formData.patientId) {
      setError('Please select a patient')
      setLoading(false)
      return
    }

    // Validate that end time is after start time
    const startDate = new Date(formData.startAt)
    const endDate = new Date(formData.endAt)
    if (endDate <= startDate) {
      setError('End time must be after start time')
      setLoading(false)
      return
    }

    // SIMPLE: Just send the form data as-is
    try {
      console.log('Submitting appointment with data:', formData)
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          providerId: 'default-provider' // We'll use room instead of provider
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Appointment creation failed:', error)
        throw new Error(error.error || 'Failed to create appointment')
      }

      const { appointment } = await response.json()
      console.log('Appointment created successfully:', appointment)
      router.push(`/appointments/${appointment.id}`)
    } catch (err: any) {
      console.error('Error creating appointment:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const selectedPatient = patients.find(p => p.id === formData.patientId)

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 sm:p-8 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="relative">
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Patient *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search patient..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 pr-8 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100"
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
            
            {showPatientDropdown && filteredPatients.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer border-b border-slate-200 dark:border-slate-600 last:border-b-0 transition-colors"
                    onClick={() => handlePatientSelect(patient)}
                  >
                    <div className="font-medium text-slate-900 dark:text-slate-100">{patient.firstName} {patient.lastName}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">#{patient.patientNo}</div>
                  </div>
                ))}
              </div>
            )}
            
            {selectedPatient && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Selected: {selectedPatient.firstName} {selectedPatient.lastName}</div>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Room *</label>
            <select
              required
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100"
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

        {/* Modern Horizontal Appointment Layout */}
        {formData.startAt && formData.startAt.split('T')[0] && (
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Appointment Schedule</label>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 max-h-80 overflow-y-auto">
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                Schedule for {formData.startAt.split('T')[0]}
              </div>
              
              {(() => {
                const layout = getModernAppointmentLayout(formData.startAt.split('T')[0])
                
                if (layout.length === 0) {
                  return (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                      <div className="text-sm">No appointments scheduled</div>
                      <div className="text-xs mt-1">All rooms are available</div>
                    </div>
                  )
                }
                
                return (
                  <div className="space-y-4">
                    {layout.map((hourSlot) => (
                      <div key={hourSlot.hour} className="flex items-start gap-4">
                        {/* Timeline */}
                        <div className="flex-shrink-0 w-12 text-right">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {hourSlot.hour.toString().padStart(2, '0')}:00
                          </div>
                        </div>
                        
                        {/* Appointments */}
                        <div className="flex-1 flex gap-2 flex-wrap">
                          {hourSlot.appointments.map((appointment, index) => (
                            <div
                              key={index}
                              className={`flex-1 min-w-[200px] max-w-[300px] p-3 rounded-lg border-l-4 ${
                                appointment.color
                              } ${
                                appointment.isSelectedRoom 
                                  ? 'ring-2 ring-blue-500 ring-opacity-50' 
                                  : ''
                              }`}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <div className="font-medium text-sm truncate">
                                  {appointment.patient}
                                </div>
                                {appointment.isSelectedRoom && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs opacity-75">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{appointment.startTime} – {appointment.endTime}</span>
                              </div>
                              
                              <div className="mt-1">
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-white bg-opacity-50 rounded">
                                  {appointment.room}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
              
              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">Room Colors:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries({
                    'Labor': 'bg-teal-100 border-teal-500 text-teal-800',
                    'Bloodtest': 'bg-orange-100 border-orange-500 text-orange-800',
                    'X-Ray': 'bg-purple-100 border-purple-500 text-purple-800',
                    'Emergency': 'bg-red-100 border-red-500 text-red-800'
                  }).map(([room, color]) => (
                    <div key={room} className={`px-2 py-1 text-xs rounded border-l-4 ${color}`}>
                      {room}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Date *</label>
            <input
              type="date"
              required
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              value={formData.startAt ? formData.startAt.split('T')[0] : ''}
              onChange={(e) => {
                const selectedDate = e.target.value
                const currentTime = formData.startAt ? formData.startAt.split('T')[1] : '08:00'
                const newStartTime = `${selectedDate}T${currentTime}`
                setFormData(prev => ({
                  ...prev,
                  startAt: newStartTime,
                  endAt: formData.endAt ? `${selectedDate}T${formData.endAt.split('T')[1]}` : ''
                }))
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Start Time *</label>
            <select
              required
              disabled={!formData.room || availableStartTimes.length === 0}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              value={formData.startAt ? formData.startAt.split('T')[1] : ''}
              onChange={(e) => {
                const selectedTime = e.target.value
                const currentDate = formData.startAt ? formData.startAt.split('T')[0] : ''
                const newStartTime = `${currentDate}T${selectedTime}`
                setFormData(prev => ({
                  ...prev,
                  startAt: newStartTime
                }))
              }}
            >
              <option value="">Select start time</option>
              {availableStartTimes.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            {!formData.room && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Please select a room first</p>
            )}
            {formData.room && availableStartTimes.length === 0 && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">No available times for this room</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">End Time *</label>
            <select
              required
              disabled={!formData.room || availableEndTimes.length === 0 || !formData.startAt}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              value={formData.endAt ? formData.endAt.split('T')[1] : ''}
              onChange={(e) => {
                const selectedTime = e.target.value
                const currentDate = formData.endAt ? formData.endAt.split('T')[0] : formData.startAt.split('T')[0]
                const newEndTime = `${currentDate}T${selectedTime}`
                setFormData(prev => ({
                  ...prev,
                  endAt: newEndTime
                }))
              }}
            >
              <option value="">Select end time</option>
              {availableEndTimes
                .filter(time => {
                  if (!formData.startAt) return true
                  const startTime = formData.startAt.split('T')[1]
                  return time > startTime
                })
                .map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
            </select>
            {!formData.startAt && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Please select start time first</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Reason</label>
          <textarea
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100"
            rows={3}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Status</label>
          <select
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100"
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
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 font-medium disabled:opacity-50 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? 'Creating...' : 'Create Appointment'}
          </button>
          <Link
            href="/appointments"
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-6 py-3 font-medium hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 transition-all duration-200 text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

export default function NewAppointmentPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <nav className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                <Link href="/appointments" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Appointments</Link> / New Appointment
              </nav>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                New Appointment
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">
                Schedule a new patient appointment
              </p>
            </div>
          </div>
        </div>

        <Suspense fallback={
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
            <div className="text-center text-slate-600 dark:text-slate-400">Loading...</div>
          </div>
        }>
          <NewAppointmentForm />
        </Suspense>
      </div>
    </main>
  )
}