"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, 
  Minus, 
  Search, 
  Upload, 
  FileText, 
  X, 
  ArrowLeft,
  Pill,
  Calendar,
  Clock,
  User
} from 'lucide-react'
import { DOSAGE_OPTIONS, FREQUENCY_OPTIONS, DURATION_OPTIONS, INSTRUCTIONS_OPTIONS } from '@/lib/medication-options'
import { BasicSelect } from '@/components/basic-select'

interface Patient {
  id: string
  firstName: string
  lastName: string
  patientNo: string
}

interface Medication {
  id: string
  name: string
  code: string
  form?: string
  strength?: string
}

interface PrescriptionItem {
  type: 'medication' | 'bloodtest' | 'referral' | 'info' | 'other'
  medicationId?: string
  title: string
  description?: string
  dosage?: string
  frequency?: string
  duration?: string
  instructions?: string
  priority?: 'urgent' | 'high' | 'normal' | 'low'
  dueDate?: string
}

// Helper function for consistent date formatting
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export default function NewPrescriptionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([])
  const [patientSearchTerm, setPatientSearchTerm] = useState('')
  const [medicationSearchTerm, setMedicationSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([])
  const [currentItem, setCurrentItem] = useState<PrescriptionItem>({
    type: 'medication',
    title: '',
    description: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    priority: 'normal'
  })
  const [formData, setFormData] = useState({
    status: 'draft' as const,
    notes: '',
    attachments: [] as string[]
  })

  useEffect(() => {
    fetchPatients()
    fetchMedications()
  }, [])

  useEffect(() => {
    if (!patientSearchTerm) {
      setFilteredPatients(patients)
    } else {
      const filtered = patients.filter(patient => 
        patient.firstName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        patient.lastName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        patient.patientNo.toLowerCase().includes(patientSearchTerm.toLowerCase())
      )
      setFilteredPatients(filtered)
    }
  }, [patientSearchTerm, patients])

  useEffect(() => {
    if (!medicationSearchTerm) {
      setFilteredMedications(medications)
    } else {
      const filtered = medications.filter(medication => 
        medication.name.toLowerCase().includes(medicationSearchTerm.toLowerCase()) ||
        medication.code.toLowerCase().includes(medicationSearchTerm.toLowerCase())
      )
      setFilteredMedications(filtered)
    }
  }, [medicationSearchTerm, medications])

  const fetchPatients = async () => {
    try {
      console.log('Fetching patients...')
      const response = await fetch('/api/patients')
      console.log('Patients response:', response)
      if (response.ok) {
        const data = await response.json()
        console.log('Patients data:', data)
        setPatients(data.patients || [])
        setFilteredPatients(data.patients || [])
      } else {
        console.error('Failed to fetch patients:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    }
  }

  const fetchMedications = async () => {
    try {
      console.log('Fetching medications...')
      const response = await fetch('/api/inventory')
      console.log('Inventory response:', response)
      if (response.ok) {
        const data = await response.json()
        console.log('Inventory data:', data)
        setMedications(data.medications || [])
        setFilteredMedications(data.medications || [])
      } else {
        console.error('Failed to fetch medications:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch medications:', error)
    }
  }

  const addPrescriptionItem = () => {
    if (!currentItem.title) {
      setError('Please fill in the title')
      return
    }

    if (currentItem.type === 'medication' && (!currentItem.medicationId || !currentItem.dosage || !currentItem.frequency || !currentItem.duration)) {
      setError('Please fill in all required fields for the medication')
      return
    }

    setPrescriptionItems(prev => [...prev, currentItem])
    setCurrentItem({
      type: 'medication',
      title: '',
      description: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      priority: 'normal'
    })
    setMedicationSearchTerm('')
  }

  const removePrescriptionItem = (index: number) => {
    setPrescriptionItems(prev => prev.filter((_, i) => i !== index))
  }

  const selectMedication = (medication: Medication) => {
    setCurrentItem(prev => ({ 
      ...prev, 
      medicationId: medication.id,
      title: medication.name,
      type: 'medication'
    }))
    setMedicationSearchTerm(`${medication.name} (${medication.code})`)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          return data.url
        }
        throw new Error('Upload failed')
      } catch (error) {
        console.error('Upload error:', error)
        return null
      }
    })

    const uploadedUrls = await Promise.all(uploadPromises)
    const validUrls = uploadedUrls.filter(url => url !== null)
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validUrls]
    }))
  }

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!selectedPatient) {
      setError('Please select a patient')
      setLoading(false)
      return
    }

    if (prescriptionItems.length === 0) {
      setError('Please add at least one medication')
      setLoading(false)
      return
    }

    try {
      console.log('Creating prescription with data:', {
        patientId: selectedPatient.id,
        status: formData.status,
        notes: formData.notes,
        items: prescriptionItems,
        attachments: formData.attachments
      })

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          status: formData.status,
          notes: formData.notes,
          items: prescriptionItems.map(item => {
            const baseItem = {
              type: item.type,
              title: item.title,
              description: item.description,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions,
              priority: item.priority,
              dueDate: item.dueDate
            }
            
            // Only include medicationId if it's a medication type and has a medicationId
            if (item.type === 'medication' && item.medicationId) {
              return { ...baseItem, medicationId: item.medicationId }
            }
            
            return baseItem
          }),
          attachments: formData.attachments
        })
      })

      console.log('Prescription response:', response)

      if (!response.ok) {
        const error = await response.json()
        console.error('Prescription creation failed:', error)
        throw new Error(error.error || 'Failed to create prescription')
      }

      const result = await response.json()
      console.log('Prescription created successfully:', result)
      router.push('/prescriptions')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link 
          href="/prescriptions" 
          className="text-muted-foreground hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Prescriptions
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">New Prescription</h1>
          <p className="text-muted-foreground">Create a new prescription for a patient</p>
        </div>
      </div>

      <div className="elevation bg-card p-6 rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Patient Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Patient *</label>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {patientSearchTerm && (
                <div className="max-h-40 overflow-y-auto border border-border rounded-lg">
                  {filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(patient)
                        setPatientSearchTerm(`${patient.firstName} ${patient.lastName} (${patient.patientNo})`)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-muted border-b border-border last:border-b-0"
                    >
                      <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                      <div className="text-sm text-muted-foreground">{patient.patientNo}</div>
                    </button>
                  ))}
                </div>
              )}
              {selectedPatient && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                    <span className="text-sm text-muted-foreground">({selectedPatient.patientNo})</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Prescription Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Prescription Items</h3>
            
            {/* Add Item Form */}
            <div className="border border-border rounded-lg p-4 space-y-4">
              {/* Item Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Item Type *</label>
                <select
                  value={currentItem.type}
                  onChange={(e) => setCurrentItem(prev => ({ 
                    ...prev, 
                    type: e.target.value as any,
                    medicationId: e.target.value === 'medication' ? prev.medicationId : undefined
                  }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="medication">Medication</option>
                  <option value="bloodtest">Blood Test</option>
                  <option value="referral">Referral</option>
                  <option value="info">Information</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <input
                  type="text"
                  placeholder={currentItem.type === 'medication' ? 'Medication name' : 
                              currentItem.type === 'bloodtest' ? 'Blood test name' :
                              currentItem.type === 'referral' ? 'Referral to specialist' :
                              'Item title'}
                  value={currentItem.title}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  rows={2}
                  placeholder="Detailed description..."
                  value={currentItem.description || ''}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Medication-specific fields */}
              {currentItem.type === 'medication' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Medication *</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search medications..."
                        value={medicationSearchTerm}
                        onChange={(e) => setMedicationSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    {medicationSearchTerm && (
                      <div className="max-h-32 overflow-y-auto border border-border rounded-lg">
                        {filteredMedications.map((medication) => (
                          <button
                            key={medication.id}
                            type="button"
                            onClick={() => selectMedication(medication)}
                            className="w-full text-left px-3 py-2 hover:bg-muted border-b border-border last:border-b-0"
                          >
                            <div className="font-medium">{medication.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {medication.code} • {medication.form} • {medication.strength}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Dosage *</label>
                      <BasicSelect
                        value={currentItem.dosage || ''}
                        onChange={(value) => setCurrentItem(prev => ({ ...prev, dosage: value }))}
                        options={DOSAGE_OPTIONS}
                        placeholder="Select dosage..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Frequency *</label>
                      <BasicSelect
                        value={currentItem.frequency || ''}
                        onChange={(value) => setCurrentItem(prev => ({ ...prev, frequency: value }))}
                        options={FREQUENCY_OPTIONS}
                        placeholder="Select frequency..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration *</label>
                      <BasicSelect
                        value={currentItem.duration || ''}
                        onChange={(value) => setCurrentItem(prev => ({ ...prev, duration: value }))}
                        options={DURATION_OPTIONS}
                        placeholder="Select duration..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Instructions</label>
                      <BasicSelect
                        value={currentItem.instructions || ''}
                        onChange={(value) => setCurrentItem(prev => ({ ...prev, instructions: value }))}
                        options={INSTRUCTIONS_OPTIONS}
                        placeholder="Select instructions..."
                      />
                    </div>
                  </div>
                </>
              )}

              {/* General fields for all types */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    value={currentItem.priority || 'normal'}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <input
                    type="date"
                    value={currentItem.dueDate || ''}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addPrescriptionItem}
                className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {/* Added Items */}
            {prescriptionItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Added Items</h4>
                <div className="space-y-2">
                  {prescriptionItems.map((item, index) => {
                    const medication = item.type === 'medication' ? medications.find(m => m.id === item.medicationId) : null
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.type === 'medication' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              item.type === 'bloodtest' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              item.type === 'referral' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              item.type === 'info' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            }`}>
                              {item.type}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              item.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              item.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                              item.priority === 'normal' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            }`}>
                              {item.priority}
                            </span>
                          </div>
                          <div className="font-medium mt-1">{item.title}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground mt-1">{item.description}</div>
                          )}
                          {item.type === 'medication' && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {item.dosage} • {item.frequency} • {item.duration}
                            </div>
                          )}
                          {item.instructions && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Instructions: {item.instructions}
                            </div>
                          )}
                          {item.dueDate && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Due: {formatDate(item.dueDate)}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removePrescriptionItem(index)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Status and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                rows={3}
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Attachments (Lab Results, Images)</label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload lab results, X-rays, or other documents
              </p>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 cursor-pointer"
              >
                Choose Files
              </label>
            </div>
            
            {/* Uploaded Files */}
            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Uploaded Files</h4>
                <div className="space-y-2">
                  {formData.attachments.map((url, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{url.split('/').pop()}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/prescriptions"
              className="rounded-xl border border-border bg-background px-4 py-2 font-medium hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !selectedPatient || prescriptionItems.length === 0}
              className="rounded-xl bg-primary text-primary-foreground px-4 py-2 font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Prescription'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
