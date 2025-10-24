"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Search, 
  Upload, 
  FileText, 
  X, 
  Save,
  Pill,
  Edit,
  Check,
  X as XIcon
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
  id?: string
  type?: string
  title?: string
  description?: string
  medicationId: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
  priority?: string
  dueDate?: string
}

interface Prescription {
  id: string
  prescriptionNo: string
  patient: Patient
  prescriber: { id: string; name: string }
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  notes?: string
  attachments?: string[]
  items: PrescriptionItem[]
}

export default function EditPrescriptionPage() {
  const params = useParams()
  const prescriptionId = params.id as string
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([])
  const [medicationSearchTerm, setMedicationSearchTerm] = useState('')
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([])
  const [currentItem, setCurrentItem] = useState<PrescriptionItem>({
    medicationId: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  })
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [editingItem, setEditingItem] = useState<PrescriptionItem | null>(null)
  const [formData, setFormData] = useState({
    status: 'draft' as const,
    notes: '',
    attachments: [] as string[]
  })

  useEffect(() => {
    fetchPrescription()
    fetchMedications()
  }, [prescriptionId])

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

  const fetchPrescription = async () => {
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`Failed to fetch prescription: ${response.status}`)
      }
      const data = await response.json()
      setPrescription(data.prescription)
      setPrescriptionItems(data.prescription.items || [])
      setFormData({
        status: data.prescription.status,
        notes: data.prescription.notes || '',
        attachments: data.prescription.attachments ? 
          (typeof data.prescription.attachments === 'string' ? 
            JSON.parse(data.prescription.attachments) : 
            data.prescription.attachments
          ) : []
      })
    } catch (error) {
      console.error('Error fetching prescription:', error)
      setError(`Failed to load prescription: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchMedications = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setMedications(data.medications || [])
        setFilteredMedications(data.medications || [])
      }
    } catch (error) {
      console.error('Failed to fetch medications:', error)
    }
  }

  const addPrescriptionItem = () => {
    if (!currentItem.medicationId || !currentItem.dosage || !currentItem.frequency || !currentItem.duration) {
      setError('Please fill in all required fields for the medication')
      return
    }

    const selectedMedication = medications.find(m => m.id === currentItem.medicationId)
    if (!selectedMedication) {
      setError('Selected medication not found')
      return
    }

    const newItem: PrescriptionItem = {
      ...currentItem,
      type: 'medication',
      title: selectedMedication.name,
      description: `${selectedMedication.name} (${selectedMedication.code})`,
      priority: 'normal'
    }

    setPrescriptionItems(prev => [...prev, newItem])
    setCurrentItem({
      medicationId: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    })
    setMedicationSearchTerm('')
  }

  const removePrescriptionItem = (index: number) => {
    setPrescriptionItems(prev => prev.filter((_, i) => i !== index))
  }

  const startEditingItem = (index: number) => {
    const item = prescriptionItems[index]
    setEditingItemIndex(index)
    setEditingItem({ ...item })
  }

  const cancelEditingItem = () => {
    setEditingItemIndex(null)
    setEditingItem(null)
  }

  const saveEditingItem = () => {
    if (editingItemIndex !== null && editingItem) {
      setPrescriptionItems(prev => 
        prev.map((item, index) => 
          index === editingItemIndex ? editingItem : item
        )
      )
      setEditingItemIndex(null)
      setEditingItem(null)
    }
  }

  const selectMedication = (medication: Medication) => {
    setCurrentItem(prev => ({ ...prev, medicationId: medication.id }))
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
    setSaving(true)
    setError(null)

    if (prescriptionItems.length === 0) {
      setError('Please add at least one medication')
      setSaving(false)
      return
    }

    try {
      // Send data as-is without strict validation
      const requestData = {
        status: formData.status,
        notes: formData.notes,
        items: prescriptionItems.map(item => ({
          type: item.type || 'medication',
          title: item.title || '',
          description: item.description || '',
          dosage: item.dosage || '',
          frequency: item.frequency || '',
          duration: item.duration || '',
          instructions: item.instructions || '',
          priority: item.priority || 'normal',
          dueDate: item.dueDate || null,
          medicationId: item.medicationId || null
        })),
        attachments: formData.attachments
      }

      console.log('Sending prescription data:', requestData)
      console.log('Items count:', prescriptionItems.length)
      console.log('All prescription items:', prescriptionItems)

      const response = await fetch(`/api/prescriptions/${prescriptionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      console.log('API response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('API error:', error)
        throw new Error(error.error || 'Failed to update prescription')
      }

      // Navigate back to prescriptions list to see updated data
      router.push('/prescriptions')
    } catch (error: any) {
      console.error('Submit error:', error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="container py-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading prescription...</div>
        </div>
      </main>
    )
  }

  if (!prescription) {
    return (
      <main className="container py-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">Prescription not found</div>
        </div>
      </main>
    )
  }

  return (
    <main className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link 
          href={`/prescriptions/${prescriptionId}`} 
          className="text-muted-foreground hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Prescription
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Edit Prescription</h1>
          <p className="text-muted-foreground">{prescription.prescriptionNo}</p>
        </div>
      </div>

      <div className="elevation bg-card p-6 rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Patient Info (Read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Patient</label>
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">
                {prescription.patient ? `${prescription.patient.firstName} ${prescription.patient.lastName}` : 'Unknown Patient'}
              </div>
              <div className="text-sm text-muted-foreground">
                {prescription.patient?.patientNo || 'N/A'}
              </div>
            </div>
          </div>

          {/* Prescription Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Medications</h3>
            
            {/* Add Medication Form */}
            <div className="border border-border rounded-lg p-4 space-y-4">
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
                    options={DOSAGE_OPTIONS}
                    value={currentItem.dosage || ''}
                    onChange={(value) => setCurrentItem(prev => ({ ...prev, dosage: value }))}
                    placeholder="Select dosage..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frequency *</label>
                  <BasicSelect
                    options={FREQUENCY_OPTIONS}
                    value={currentItem.frequency || ''}
                    onChange={(value) => setCurrentItem(prev => ({ ...prev, frequency: value }))}
                    placeholder="Select frequency..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration *</label>
                  <BasicSelect
                    options={DURATION_OPTIONS}
                    value={currentItem.duration || ''}
                    onChange={(value) => setCurrentItem(prev => ({ ...prev, duration: value }))}
                    placeholder="Select duration..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Instructions</label>
                  <BasicSelect
                    options={INSTRUCTIONS_OPTIONS}
                    value={currentItem.instructions || ''}
                    onChange={(value) => setCurrentItem(prev => ({ ...prev, instructions: value }))}
                    placeholder="Select instructions..."
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addPrescriptionItem}
                className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Medication
              </button>
            </div>

            {/* Added Medications */}
            {prescriptionItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Current Medications</h4>
                <div className="space-y-2">
                  {prescriptionItems.map((item, index) => {
                    const medication = medications.find(m => m.id === item.medicationId)
                    const isEditing = editingItemIndex === index
                    
                    return (
                      <div key={index} className="border border-border rounded-lg p-3">
                        {isEditing ? (
                          // Edit Mode
                          <div className="space-y-3">
                            <div className="font-medium">{medication?.name}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">Dosage</label>
                                <BasicSelect
                                  value={editingItem?.dosage || ''}
                                  onChange={(value) => setEditingItem(prev => prev ? { ...prev, dosage: value } : null)}
                                  options={DOSAGE_OPTIONS}
                                  placeholder="Select dosage..."
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">Frequency</label>
                                <BasicSelect
                                  value={editingItem?.frequency || ''}
                                  onChange={(value) => setEditingItem(prev => prev ? { ...prev, frequency: value } : null)}
                                  options={FREQUENCY_OPTIONS}
                                  placeholder="Select frequency..."
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">Duration</label>
                                <BasicSelect
                                  value={editingItem?.duration || ''}
                                  onChange={(value) => setEditingItem(prev => prev ? { ...prev, duration: value } : null)}
                                  options={DURATION_OPTIONS}
                                  placeholder="Select duration..."
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">Instructions</label>
                                <BasicSelect
                                  value={editingItem?.instructions || ''}
                                  onChange={(value) => setEditingItem(prev => prev ? { ...prev, instructions: value } : null)}
                                  options={INSTRUCTIONS_OPTIONS}
                                  placeholder="Select instructions..."
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={saveEditingItem}
                                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                <Check className="w-3 h-3" />
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditingItem}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                              >
                                <XIcon className="w-3 h-3" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Display Mode
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{medication?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.dosage} • {item.frequency} • {item.duration}
                              </div>
                              {item.instructions && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Instructions: {item.instructions}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => startEditingItem(index)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Edit medication"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removePrescriptionItem(index)}
                                className="text-destructive hover:text-destructive/80"
                                title="Remove medication"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
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
            {formData.attachments && formData.attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Current Attachments</h4>
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
              href={`/prescriptions/${prescriptionId}`}
              className="rounded-xl border border-border bg-background px-4 py-2 font-medium hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || prescriptionItems.length === 0}
              className="rounded-xl bg-primary text-primary-foreground px-4 py-2 font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
