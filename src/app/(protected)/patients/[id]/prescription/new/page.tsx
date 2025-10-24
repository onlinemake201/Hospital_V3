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

interface Medication {
  id: string
  code: string
  name: string
  form?: string
  strength?: string
}

export default function NewPrescriptionPage() {
  const params = useParams()
  const patientId = params.id as string
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([])
  const [medicationSearchTerm, setMedicationSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    medicationId: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    quantity: 1
  })

  useEffect(() => {
    fetchPatient()
    fetchMedications()
  }, [patientId])

  const fetchPatient = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}`)
      if (!response.ok) throw new Error('Failed to fetch patient')
      const data = await response.json()
      setPatient(data.patient)
    } catch (error) {
      console.error('Error fetching patient:', error)
      setError('Failed to load patient')
    }
  }

  const fetchMedications = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (!response.ok) throw new Error('Failed to fetch medications')
      const data = await response.json()
      setMedications(data.medications || [])
      setFilteredMedications(data.medications || [])
    } catch (error) {
      console.error('Error fetching medications:', error)
    }
  }

  useEffect(() => {
    if (!medicationSearchTerm) {
      setFilteredMedications(medications)
    } else {
      setFilteredMedications(medications.filter(med => 
        med.name.toLowerCase().includes(medicationSearchTerm.toLowerCase()) ||
        med.code.toLowerCase().includes(medicationSearchTerm.toLowerCase())
      ))
    }
  }, [medications, medicationSearchTerm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: patientId,
          ...formData
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create prescription')
      }

      router.push(`/patients/${patientId}`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!patient) {
    return (
      <main className="container py-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading patient...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="container py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/patients/${patientId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Back to Patient
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">New Prescription</h1>
          <p className="text-muted-foreground">Prescribe medication for {patient.firstName} {patient.lastName}</p>
        </div>
      </div>

      <div className="elevation bg-card p-6 rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="medication" className="text-sm font-medium">
                Medication *
              </label>
              <div className="relative">
                <input
                  id="medication"
                  type="text"
                  placeholder="Search medications..."
                  value={medicationSearchTerm}
                  onChange={(e) => setMedicationSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                />
                {medicationSearchTerm && filteredMedications.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredMedications.map((med) => (
                      <button
                        key={med.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, medicationId: med.id }))
                          setMedicationSearchTerm(`${med.name} (${med.code})`)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-muted border-b border-border last:border-b-0"
                      >
                        <div className="font-medium">{med.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {med.code} • {med.form} • {med.strength}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-medium">
                Quantity *
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="dosage" className="text-sm font-medium">
                Dosage *
              </label>
              <input
                id="dosage"
                type="text"
                required
                value={formData.dosage}
                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="e.g., 1 tablet, 5ml"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="frequency" className="text-sm font-medium">
                Frequency *
              </label>
              <select
                id="frequency"
                required
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select frequency</option>
                <option value="Once daily">Once daily</option>
                <option value="Twice daily">Twice daily</option>
                <option value="Three times daily">Three times daily</option>
                <option value="Four times daily">Four times daily</option>
                <option value="Every 6 hours">Every 6 hours</option>
                <option value="Every 8 hours">Every 8 hours</option>
                <option value="Every 12 hours">Every 12 hours</option>
                <option value="As needed">As needed</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="duration" className="text-sm font-medium">
                Duration *
              </label>
              <input
                id="duration"
                type="text"
                required
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 7 days, 2 weeks, 1 month"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="instructions" className="text-sm font-medium">
                Instructions
              </label>
              <textarea
                id="instructions"
                rows={3}
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Additional instructions for the patient..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href={`/patients/${patientId}`}
              className="rounded-xl border border-border bg-background px-4 py-2 font-medium hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.medicationId}
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
