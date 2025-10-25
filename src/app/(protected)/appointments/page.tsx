'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/modern-toast'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Search, 
  Filter, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Eye, 
  Edit, 
  Download, 
  RefreshCw, 
  XCircle,
  List
} from 'lucide-react'

interface Patient {
  id: string
  firstName: string
  lastName: string
  patientNo: string
}

interface Provider {
  id: string
  firstName: string
  lastName: string
  name?: string
}

interface Appointment {
  id: string
  patientId: string
  providerId: string
  startAt: string
  endAt: string
  room: string
  status: string
  reason: string
  patient?: Patient
  provider?: Provider
}

export default function AppointmentsPage() {
  const router = useRouter()
  const { showToast, ToastContainer } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year' | 'list'>('day')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  
  const toggleGroup = (patientName: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(patientName)) {
        newSet.delete(patientName)
      } else {
        newSet.add(patientName)
      }
      return newSet
    })
  }
  
  // Drag & Drop states
  const [isDragging, setIsDragging] = useState(false)
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)
  const [dragOverDay, setDragOverDay] = useState<string | null>(null)
  const [dragOverTime, setDragOverTime] = useState<string | null>(null)

  // Tooltip states
  const [hoveredAppointment, setHoveredAppointment] = useState<Appointment | null>(null)
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    fetchAppointments()
    fetchPatients()
    fetchProviders()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [appointments, searchTerm])

  const fetchAppointments = async () => {
      try {
        const response = await fetch('/api/appointments', {
          cache: 'force-cache',
          next: { revalidate: 300 }, // 5 Minuten Cache
          headers: {
            'Cache-Control': 'max-age=300, stale-while-revalidate=600'
          }
        })
        if (response.ok) {
          const data = await response.json()
        // API returns { appointments: [...] }, so we need to extract the appointments array
        const appointmentsArray = data.appointments || data || []
        setAppointments(Array.isArray(appointmentsArray) ? appointmentsArray : [])
        console.log('Fetched appointments:', appointmentsArray.length, 'appointments')
        console.log('First appointment patient data:', appointmentsArray[0]?.patient)
        console.log('All appointments with patient data:', appointmentsArray.map(apt => ({
          id: apt.id,
          patient: apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'No patient data'
        })))
        }
      } catch (error) {
      console.error('Error fetching appointments:', error)
      setAppointments([])
      } finally {
      setIsLoading(false)
    }
  }

  const fetchPatients = async () => {
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
        // API returns { patients: [...] }, so we need to extract the patients array
        const patientsArray = data.patients || data || []
        setPatients(Array.isArray(patientsArray) ? patientsArray : [])
        console.log('Fetched patients:', patientsArray.length, 'patients')
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        // API returns { users: [...] }, so we need to extract the users array
        const usersArray = data.users || data || []
        setProviders(Array.isArray(usersArray) ? usersArray : [])
        console.log('Fetched providers:', usersArray.length, 'providers')
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    }
  }

  const filterAppointments = () => {
    if (!Array.isArray(appointments)) {
      setFilteredAppointments([])
      return
    }

    if (!searchTerm) {
      setFilteredAppointments(appointments)
      return
    }

    const filtered = appointments.filter(apt => {
      const patientName = `${apt.patient?.firstName || ''} ${apt.patient?.lastName || ''}`.toLowerCase()
      const providerName = `${apt.provider?.firstName || ''} ${apt.provider?.lastName || ''}`.toLowerCase()
      const room = apt.room.toLowerCase()
      const reason = apt.reason.toLowerCase()
      
      return patientName.includes(searchTerm.toLowerCase()) ||
             providerName.includes(searchTerm.toLowerCase()) ||
             room.includes(searchTerm.toLowerCase()) ||
             reason.includes(searchTerm.toLowerCase())
    })

    setFilteredAppointments(filtered)
  }

  // Function to organize overlapping appointments horizontally
  const organizeAppointmentsHorizontally = (appointments: Appointment[]) => {
    if (appointments.length === 0) return []

    // Sort appointments by start time
    const sortedAppointments = [...appointments].sort((a, b) => 
      new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    )

    const organizedAppointments: Array<Appointment & { lane: number; totalLanes: number }> = []
    
    for (const appointment of sortedAppointments) {
      const appointmentStart = new Date(appointment.startAt)
      const appointmentEnd = new Date(appointment.endAt)
      
      // Find conflicting appointments (overlapping in time)
      const conflictingAppointments = organizedAppointments.filter(existing => {
        const existingStart = new Date(existing.startAt)
        const existingEnd = new Date(existing.endAt)
        
        // Check if appointments overlap
        return (
          (appointmentStart < existingEnd && appointmentEnd > existingStart)
        )
      })
      
      // Find the first available lane
      const usedLanes = conflictingAppointments.map(apt => apt.lane)
      let availableLane = 0
      while (usedLanes.includes(availableLane)) {
        availableLane++
      }
      
      // Calculate total lanes needed for this time slot - allow more lanes for better visibility
      const calculatedLanes = Math.max(availableLane + 1, ...conflictingAppointments.map(apt => apt.totalLanes))
      const totalLanes = Math.min(calculatedLanes, 4) // Increased from 2 to 4 for better visibility
      
      // Update all conflicting appointments to have the same total lanes
      conflictingAppointments.forEach(conflicting => {
        conflicting.totalLanes = totalLanes
      })
      
      organizedAppointments.push({
        ...appointment,
        lane: Math.min(availableLane, totalLanes - 1),
        totalLanes: totalLanes
      })
    }
    
    return organizedAppointments
  }

  const getEventColor = (reason: string, status: string) => {
    // Modern color scheme based on appointment type and status
    const typeColors: { [key: string]: string } = {
      'Labor': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Bloodtest': 'bg-orange-100 text-orange-800 border-orange-200',
      'Consultation': 'bg-blue-100 text-blue-800 border-blue-200',
      'Check-up': 'bg-purple-100 text-purple-800 border-purple-200',
      'Surgery': 'bg-red-100 text-red-800 border-red-200',
      'X-Ray': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'MRI': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Physical Therapy': 'bg-green-100 text-green-800 border-green-200',
      'Dental': 'bg-pink-100 text-pink-800 border-pink-200',
      'Emergency': 'bg-red-100 text-red-800 border-red-200'
    }
    
    // Fallback to status-based colors if reason not found
    const statusColors: { [key: string]: string } = {
      'scheduled': 'bg-blue-100 text-blue-800 border-blue-200',
      'confirmed': 'bg-green-100 text-green-800 border-green-200',
      'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'completed': 'bg-gray-100 text-gray-800 border-gray-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'no-show': 'bg-orange-100 text-orange-800 border-orange-200'
    }
    
    return typeColors[reason] || statusColors[status] || 'bg-slate-100 text-slate-800 border-slate-200'
  }

  const getAppointmentType = (reason: string) => {
    // Map reasons to display types
    const typeMap: { [key: string]: string } = {
      'Labor': 'Labor',
      'Bloodtest': 'Bloodtest',
      'Consultation': 'Consultation',
      'Check-up': 'Check-up',
      'Surgery': 'Surgery',
      'X-Ray': 'X-Ray',
      'MRI': 'MRI',
      'Physical Therapy': 'Physical Therapy',
      'Dental': 'Dental',
      'Emergency': 'Emergency'
    }
    
    return typeMap[reason] || reason || 'Appointment'
  }

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    console.log('Drag start:', appointment.patient?.firstName, appointment.patient?.lastName)
    setIsDragging(true)
    setDraggedAppointment(appointment)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', appointment.id)
  }

  const handleDragOver = (e: React.DragEvent, day: string, time?: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDay(day)
    if (time) setDragOverTime(time)
  }

  const handleDragLeave = () => {
    setDragOverDay(null)
    setDragOverTime(null)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setDraggedAppointment(null)
    setDragOverDay(null)
    setDragOverTime(null)
  }

  const handleDrop = async (e: React.DragEvent, targetDay: string, targetTime?: string) => {
    e.preventDefault()
    
    if (!draggedAppointment) return

    try {
      const appointmentStart = new Date(draggedAppointment.startAt)
      const appointmentEnd = new Date(draggedAppointment.endAt)
      const duration = appointmentEnd.getTime() - appointmentStart.getTime()
      
      const [year, month, day] = targetDay.split('-').map(Number)
      let newStartTime: Date
      
      if (targetTime) {
        const [hours, minutes] = targetTime.split(':').map(Number)
        newStartTime = new Date(year, month - 1, day, hours, minutes)
      } else {
        newStartTime = new Date(year, month - 1, day, appointmentStart.getHours(), appointmentStart.getMinutes())
      }
      
      const newEndTime = new Date(newStartTime.getTime() + duration)
      
      const response = await fetch(`/api/appointments/${draggedAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startAt: newStartTime.toISOString(),
          endAt: newEndTime.toISOString()
        })
      })
      
      if (response.ok) {
        // Reload appointments to ensure consistency
        await fetchAppointments()
        showToast('Appointment moved successfully', 'success')
      } else {
        showToast('Failed to move appointment', 'error')
      }
    } catch (error) {
      console.error('Error moving appointment:', error)
      showToast('Failed to move appointment', 'error')
    } finally {
      handleDragEnd()
    }
  }

  // Hover handlers for tooltips
  const handleMouseEnter = (e: React.MouseEvent, appointment: Appointment) => {
    setHoveredAppointment(appointment)
    setHoverPosition({ x: e.clientX, y: e.clientY })
  }

  const handleMouseLeave = () => {
    setHoveredAppointment(null)
    setHoverPosition(null)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (hoveredAppointment) {
      setHoverPosition({ x: e.clientX, y: e.clientY })
    }
  }

  const renderDayView = () => {
    const dayAppointments = filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.startAt)
      return aptDate.toDateString() === currentDate.toDateString()
    })

    const hours = Array.from({ length: 12 }, (_, i) => i + 7) // 7 AM to 6 PM

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="flex min-w-[800px]">
            {/* Time Column */}
            <div className="w-24 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-600 flex-shrink-0">
              <div className="h-20 border-b border-slate-200 dark:border-slate-600 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
              {hours.map(hour => (
                <div key={hour} className="border-b border-slate-200 dark:border-slate-600 flex items-center justify-center h-20">
                  <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                    {hour.toString().padStart(2, '0') + ':00'}
                  </span>
                </div>
              ))}
            </div>

            {/* Day Column */}
            <div className="flex-1 min-w-[700px] border-r border-slate-200 dark:border-slate-600 last:border-r-0 relative">
              {/* Day Header */}
              <div className="h-20 border-b border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-center">
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Appointments
                </div>
              </div>

              {/* Time Slots Container */}
              <div className="relative" style={{ height: `${hours.length * 80}px` }}>
                {/* Hour slots as drop zones */}
                {hours.map(hour => (
                  <div
                    key={hour} 
                    className="absolute w-full border-b border-slate-100 dark:border-slate-700"
                    style={{
                      height: '80px',
                      top: `${(hour - 7) * 80}px`,
                      zIndex: draggedAppointment ? 10 : 1
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (draggedAppointment) {
                        const dayKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`
                        handleDragOver(e, dayKey, `${hour.toString().padStart(2, '0')}:00`)
                      }
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      if (draggedAppointment) {
                        handleDragLeave()
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (draggedAppointment) {
                        const dayKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`
                        handleDrop(e, dayKey, `${hour.toString().padStart(2, '0')}:00`)
                      }
                    }}
                  >
                    {/* Drop indicator */}
                    {draggedAppointment && dragOverDay === `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}` && dragOverTime === `${hour.toString().padStart(2, '0')}:00` && (
                      <div className="absolute inset-0 bg-blue-200 dark:bg-blue-800 opacity-50 border-2 border-dashed border-blue-500 dark:border-blue-400"></div>
                    )}
                  </div>
                ))}

                {/* Appointments */}
                {organizeAppointmentsHorizontally(dayAppointments).map((appointment) => {
                  // Parse UTC dates correctly
                  const startTime = new Date(appointment.startAt)
                  const endTime = new Date(appointment.endAt)
                  
                  const startHour = startTime.getUTCHours()
                  const startMinute = startTime.getUTCMinutes()
                  const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
                  
                  const topPosition = (startHour - 7) * 80 + (startMinute / 60) * 80
                  const height = (durationMinutes / 60) * 80
                  
                  // Calculate horizontal position and width for side-by-side layout
                  const leftOffset = 8 + (appointment.lane * (100 / Math.max(appointment.totalLanes, 4)))
                  const width = Math.max((100 / Math.max(appointment.totalLanes, 4)) - 2, 20)

                  return (
                    <div
                      key={appointment.id}
                      className={`absolute rounded-xl cursor-move z-20 border-2 shadow-lg hover:shadow-xl transition-all duration-200 ${getEventColor(appointment.reason || '', appointment.status)} ${
                        draggedAppointment?.id === appointment.id ? 'opacity-30' : draggedAppointment ? 'opacity-70' : ''
                      }`}
                            style={{
                              top: `${topPosition}px`,
                              height: `${height}px`,
                              minHeight: '70px',
                              left: `${leftOffset}%`,
                              width: `${Math.max(width, 20)}%`
                            }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, appointment)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => {
                        if (!isDragging) {
                          e.stopPropagation()
                          setSelectedAppointment(appointment)
                        }
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, appointment)}
                      onMouseLeave={handleMouseLeave}
                      onMouseMove={handleMouseMove}
                    >
                      <div className="p-2 h-full flex flex-col justify-between overflow-hidden relative">
                        {/* View Button - Top Right */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/appointments/${appointment.id}`)
                          }}
                          className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 transition-colors z-10"
                          title="View Appointment"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        
                        {/* Top Section */}
                        <div className="flex flex-col pr-6">
                          {/* Patient Name - Prominent at the top */}
                          <div className="font-bold text-sm mb-1 text-slate-900 dark:text-slate-100 leading-tight">
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </div>
                          
                          {/* Time */}
                          <div className="flex items-center gap-1 text-xs mb-1">
                            <Clock className="w-3 h-3" />
                            <span className="font-medium">
                              {new Date(appointment.startAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false,
                                timeZone: 'UTC'
                              })} – {new Date(appointment.endAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false,
                                timeZone: 'UTC'
                              })}
                            </span>
                          </div>
                          
                          {/* Appointment Type */}
                          <div className="text-xs font-medium">
                            {getAppointmentType(appointment.reason || '')}
                          </div>
                        </div>
                        
                        {/* Bottom Section - Room info only */}
                        <div className="flex justify-start items-center mt-2">
                          <div className="text-xs px-1 py-0.5 rounded-full bg-white/60 backdrop-blur-sm font-medium">
                            {appointment.room || 'No Room'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      return day
    })

    const hours = Array.from({ length: 12 }, (_, i) => i + 7) // 7 AM to 6 PM

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="flex min-w-[900px]">
            {/* Time Column */}
            <div className="w-24 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-600 flex-shrink-0">
              <div className="h-20 border-b border-slate-200 dark:border-slate-600 flex items-center justify-center">
                <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">Time</span>
              </div>
              {hours.map(hour => (
                <div key={hour} className="border-b border-slate-200 dark:border-slate-600 flex items-center justify-center h-20">
                  <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                    {hour.toString().padStart(2, '0') + ':00'}
                  </span>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            <div className="flex flex-1">
              {days.map((day, dayIndex) => {
                const dayKey = `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, '0')}-${day.getDate().toString().padStart(2, '0')}`
                const dayAppointments = filteredAppointments.filter(apt => {
                  const aptDate = new Date(apt.startAt)
                  return aptDate.toDateString() === day.toDateString()
                })

                return (
                  <div key={dayIndex} className="flex-1 min-w-[150px] border-r border-slate-200 dark:border-slate-600 last:border-r-0 relative">
                    {/* Day Header */}
                    <div className="h-20 border-b border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex flex-col items-center justify-center">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {day.getDate()}
                      </div>
                    </div>

                    {/* Time Slots Container */}
                    <div className="relative" style={{ height: `${hours.length * 80}px` }}>
                      {/* Hour slots as drop zones */}
                      {hours.map(hour => (
                        <div
                          key={hour} 
                          className="absolute w-full border-b border-slate-100 dark:border-slate-700"
                          style={{
                            height: '80px',
                            top: `${(hour - 8) * 80}px`,
                            zIndex: draggedAppointment ? 10 : 1
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                            if (draggedAppointment) {
                              handleDragOver(e, dayKey, `${hour.toString().padStart(2, '0')}:00`)
                            }
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault()
                            if (draggedAppointment) {
                              handleDragLeave()
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (draggedAppointment) {
                              handleDrop(e, dayKey, `${hour.toString().padStart(2, '0')}:00`)
                            }
                          }}
                        >
                          {/* Drop indicator */}
                          {draggedAppointment && dragOverDay === dayKey && dragOverTime === `${hour.toString().padStart(2, '0')}:00` && (
                            <div className="absolute inset-0 bg-blue-200 dark:bg-blue-800 opacity-50 border-2 border-dashed border-blue-500 dark:border-blue-400"></div>
                          )}
                        </div>
                      ))}

                      {/* Appointments */}
                      {organizeAppointmentsHorizontally(dayAppointments).map((appointment) => {
                        const startTime = new Date(appointment.startAt)
                        const endTime = new Date(appointment.endAt)
                        const startHour = startTime.getHours()
                        const startMinute = startTime.getMinutes()
                        const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
                        
                        const topPosition = (startHour - 7) * 80 + (startMinute / 60) * 80
                        const height = (durationMinutes / 60) * 80
                        
                        // Calculate horizontal position and width for side-by-side layout
                        const leftOffset = 8 + (appointment.lane * (100 / Math.max(appointment.totalLanes, 4)))
                        const width = Math.max((100 / Math.max(appointment.totalLanes, 4)) - 2, 20)
            
                        return (
                          <div
                            key={appointment.id}
                            className={`absolute rounded-xl cursor-move z-20 border-2 shadow-lg hover:shadow-xl transition-all duration-200 ${getEventColor(appointment.reason || '', appointment.status)} ${
                              draggedAppointment?.id === appointment.id ? 'opacity-30' : draggedAppointment ? 'opacity-70' : ''
                            }`}
                            style={{
                              top: `${topPosition}px`,
                              height: `${height}px`,
                              minHeight: '80px',
                              left: `${leftOffset}%`,
                              width: `${width}%`
                            }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, appointment)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => {
                              if (!isDragging) {
                                e.stopPropagation()
                                setSelectedAppointment(appointment)
                              }
                            }}
                            onMouseEnter={(e) => handleMouseEnter(e, appointment)}
                            onMouseLeave={handleMouseLeave}
                            onMouseMove={handleMouseMove}
                          >
                            <div className="p-1 h-full flex flex-col justify-between overflow-hidden">
                              {/* Top Section */}
                              <div className="flex flex-col">
                                {/* Patient Name - Prominent at the top */}
                                <div className="font-bold text-xs mb-1 text-slate-900 dark:text-slate-100 leading-tight">
                                  {appointment.patient?.firstName} {appointment.patient?.lastName}
                                </div>
                                
                                {/* Time */}
                                <div className="flex items-center gap-1 text-xs mb-1">
                                  <Clock className="w-2 h-2" />
                                  <span className="font-medium">
                                    {new Date(appointment.startAt).toLocaleTimeString('en-US', { 
                                      hour: '2-digit', 
                                      minute: '2-digit',
                                      hour12: false 
                                    })} – {new Date(appointment.endAt).toLocaleTimeString('en-US', { 
                                      hour: '2-digit', 
                                      minute: '2-digit',
                                      hour12: false 
                                    })}
                                  </span>
                                </div>
                                
                                {/* Appointment Type */}
                                <div className="text-xs font-medium">
                                  {getAppointmentType(appointment.reason || '')}
                                </div>
                              </div>
                              
                              {/* Bottom Section - Always at bottom */}
                              <div className="flex justify-between items-center mt-1">
                                <div className="text-xs px-1 py-0.5 rounded-full bg-white/60 backdrop-blur-sm font-medium">
                                  {appointment.room || 'No Room'}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/appointments/${appointment.id}/edit`)
                                  }}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Edit Appointment"
                                >
                                  <Eye className="w-2 h-2" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = Array.from({ length: 42 }, (_, i) => {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      return day
    })
    
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayKey = `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, '0')}-${day.getDate().toString().padStart(2, '0')}`
            const dayAppointments = filteredAppointments.filter(apt => {
              const aptDate = new Date(apt.startAt)
              return aptDate.toDateString() === day.toDateString()
            })
    
            return (
              <div 
                key={index} 
                className="min-h-[140px] border-r border-b border-slate-200 dark:border-slate-600 p-1 relative"
                onDragOver={(e) => {
                  e.preventDefault()
                  if (draggedAppointment) {
                    handleDragOver(e, dayKey)
                  }
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  if (draggedAppointment) {
                    handleDragLeave()
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (draggedAppointment) {
                    handleDrop(e, dayKey)
                  }
                }}
              >
                <div className={`text-sm font-medium mb-1 ${
                  day.getMonth() !== month ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100'
                }`}>
                  {day.getDate()}
                </div>
                
                {/* Drop indicator */}
                {draggedAppointment && dragOverDay === dayKey && (
                  <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900 opacity-30 border-2 border-dashed border-blue-400 dark:border-blue-500 rounded"></div>
                )}

                {/* Appointments */}
                <div className="space-y-1">
                  {organizeAppointmentsHorizontally(dayAppointments.slice(0, 6)).map((appointment, appointmentIndex) => (
                    <div
                      key={appointment.id}
                      className={`text-sm p-2 rounded-lg cursor-move z-20 border shadow-sm ${getEventColor(appointment.reason || '', appointment.status)} ${
                        draggedAppointment?.id === appointment.id ? 'opacity-30' : draggedAppointment ? 'opacity-70' : ''
                      }`}
                      style={{
                        width: `${Math.max(100 / appointment.totalLanes, 45)}%`,
                        marginLeft: `${(appointment.lane * 100) / appointment.totalLanes}%`,
                        marginBottom: '3px'
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, appointment)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => {
                        if (!isDragging) {
                          e.stopPropagation()
                          setSelectedAppointment(appointment)
                        }
                      }}
                    >
                      <div className="p-1 flex flex-col justify-between overflow-hidden min-h-[60px]">
                        {/* Top Section */}
                        <div className="flex flex-col">
                          {/* Patient Name - Prominent at the top */}
                          <div className="font-bold text-xs mb-1 text-slate-900 dark:text-slate-100 leading-tight">
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </div>
                          
                          {/* Time */}
                          <div className="flex items-center gap-1 text-xs mb-1">
                            <Clock className="w-2 h-2" />
                            <span className="font-medium">
                              {new Date(appointment.startAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false 
                              })} – {new Date(appointment.endAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false 
                              })}
                            </span>
                          </div>
                          
                          {/* Appointment Type */}
                          <div className="text-xs font-medium">
                            {getAppointmentType(appointment.reason || '')}
                          </div>
                        </div>
                        
                        {/* Bottom Section - Always at bottom */}
                        <div className="flex justify-between items-center mt-1">
                          <div className="text-xs px-1 py-0.5 rounded-full bg-white/60 backdrop-blur-sm font-medium">
                            {appointment.room || 'No Room'}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/appointments/${appointment.id}/edit`)
                            }}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit Appointment"
                          >
                            <Eye className="w-2 h-2" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {dayAppointments.length > 6 && (
                    <div className="text-xs text-slate-500">
                      +{dayAppointments.length - 6} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderListView = () => {
    // Group appointments by patient
    const groupedAppointments = filteredAppointments.reduce((groups, appointment) => {
      const patientKey = `${appointment.patient?.firstName} ${appointment.patient?.lastName}`
      if (!groups[patientKey]) {
        groups[patientKey] = {
          patient: appointment.patient,
          appointments: []
        }
      }
      groups[patientKey].appointments.push(appointment)
      return groups
    }, {} as Record<string, { patient: any, appointments: any[] }>)

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 px-6 py-4 border-b border-slate-200 dark:border-slate-600">
              <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <div className="col-span-3">Patient</div>
                <div className="col-span-2">Provider</div>
                <div className="col-span-2">Date & Time</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-1">Room</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1 text-center">Action</div>
              </div>
            </div>

            {/* Patient Groups */}
            <div className="divide-y divide-slate-200 dark:divide-slate-600">
              {Object.entries(groupedAppointments).map(([patientName, group]) => (
                <div key={patientName} className="group">
                  {/* Patient Header */}
                  <div 
                    className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-6 py-3 border-b border-blue-200 dark:border-blue-700 cursor-pointer hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all duration-200"
                    onClick={() => toggleGroup(patientName)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {group.patient?.firstName} {group.patient?.lastName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            #{group.patient?.patientNo} • {group.appointments.length} appointment{group.appointments.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {collapsedGroups.has(patientName) ? (
                          <ChevronRight className="w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform duration-200" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform duration-200" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Appointments for this patient */}
                  {!collapsedGroups.has(patientName) && (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {group.appointments.map((appointment, index) => {
                      const startTime = new Date(appointment.startAt)
                      const endTime = new Date(appointment.endAt)

                      return (
                        <div key={appointment.id} className="px-6 py-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-200">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Patient Info (empty for sub-rows) */}
                            <div className="col-span-3">
                              {index === 0 ? (
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                    <User className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                      {appointment.patient?.firstName} {appointment.patient?.lastName}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                      #{appointment.patient?.patientNo}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="pl-11">
                                  <div className="text-xs text-slate-400 dark:text-slate-500">
                                    Additional appointment
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Provider */}
                            <div className="col-span-2">
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {appointment.provider?.firstName} {appointment.provider?.lastName}
                              </div>
                            </div>

                            {/* Date & Time */}
                            <div className="col-span-2">
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {startTime.toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric',
                                  timeZone: 'UTC'
                                })}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {startTime.toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: false,
                                  timeZone: 'UTC'
                                })} - {endTime.toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: false,
                                  timeZone: 'UTC'
                                })}
                              </div>
                            </div>

                            {/* Type */}
                            <div className="col-span-2">
                              <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {getAppointmentType(appointment.reason || '')}
                              </span>
                            </div>

                            {/* Room */}
                            <div className="col-span-1">
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                                {appointment.room || 'No Room'}
                              </span>
                            </div>

                            {/* Status */}
                            <div className="col-span-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                appointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                appointment.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
                              }`}>
                                {appointment.status}
                              </span>
                            </div>

                            {/* Action */}
                            <div className="col-span-1 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/appointments/${appointment.id}`)
                                }}
                                className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }


  if (isLoading) {
    return (
          <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
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
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Appointment Management</h1>
              <div className="flex items-center gap-4 mt-1 sm:mt-2">
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">Schedule and manage patient appointments</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href="/appointments/new"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 font-medium flex items-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">New Appointment</span>
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
                  placeholder="Search appointments (patient name, room, reason)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm sm:text-base"
                    />
                  </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* View Controls */}
                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
          <button
                    onClick={() => setView('day')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      view === 'day' 
                        ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Day</span>
          </button>
          <button
                    onClick={() => setView('week')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      view === 'week' 
                        ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Week</span>
                  </button>
                  <button
                    onClick={() => setView('month')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      view === 'month' 
                        ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Month</span>
          </button>
          <button
                    onClick={() => setView('list')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      view === 'list' 
                        ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <List className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">List</span>
          </button>
          </div>

                {/* Date Navigation */}
                <div className="flex items-center gap-2">
          <button
                    onClick={() => {
                      const newDate = new Date(currentDate)
                      if (view === 'day') {
                        newDate.setDate(currentDate.getDate() - 1)
                      } else if (view === 'week') {
                        newDate.setDate(currentDate.getDate() - 7)
                      } else if (view === 'month') {
                        newDate.setMonth(currentDate.getMonth() - 1)
                      }
                      setCurrentDate(newDate)
                    }}
                    className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
              <button
            onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-600 dark:text-slate-400"
          >
            Today
          </button>
          <button
                    onClick={() => {
                      const newDate = new Date(currentDate)
                      if (view === 'day') {
                        newDate.setDate(currentDate.getDate() + 1)
                      } else if (view === 'week') {
                        newDate.setDate(currentDate.getDate() + 7)
                      } else if (view === 'month') {
                        newDate.setMonth(currentDate.getMonth() + 1)
                      }
                      setCurrentDate(newDate)
                    }}
                    className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
                </div>
                    </div>
                </div>
              </div>
              
      {/* Calendar Views */}
      {view === 'day' && renderDayView()}
      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}
      {view === 'list' && renderListView()}

      {/* Tooltip */}
      {hoveredAppointment && hoverPosition && (
        <div
          className="fixed z-50 bg-slate-900 text-white p-3 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: hoverPosition.x + 10,
            top: hoverPosition.y - 10,
            maxWidth: '300px'
          }}
        >
          <div className="text-sm font-semibold mb-1">
            {hoveredAppointment.patient?.firstName} {hoveredAppointment.patient?.lastName}
                </div>
          <div className="text-xs text-slate-300 mb-1">
            {new Date(hoveredAppointment.startAt).toLocaleDateString('en-US', { timeZone: 'UTC' })} at {new Date(hoveredAppointment.startAt).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false,
              timeZone: 'UTC'
            })}
              </div>
          <div className="text-xs text-slate-300">
            Room: {hoveredAppointment.room}
          </div>
        </div>
      )}

      
      {/* Modern Toast Container */}
      <ToastContainer />
      </div>
    </div>
  )
}