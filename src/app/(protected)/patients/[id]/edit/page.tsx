"use client"
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Patient {
  id: string
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
}

export default function EditPatientPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPatient() {
      try {
        const response = await fetch(`/api/patients/${patientId}`)
        if (!response.ok) throw new Error('Patient not found')
        const data = await response.json()
        setPatient(data.patient)
      } catch (err) {
        setError('Failed to load patient')
      } finally {
        setLoading(false)
      }
    }
    
    if (patientId) {
      fetchPatient()
    }
  }, [patientId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const updateData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        dob: formData.get('dob'),
        gender: formData.get('gender'),
        address: formData.get('address'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        insurance: formData.get('insurance'),
        weight: formData.get('weight'),
        allergies: formData.get('allergies')
      }
      
      console.log('Update data:', updateData)

      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('API Error:', error)
        throw new Error(error.error || 'Failed to update patient')
      }
      
      router.push(`/patients/${patientId}`)
    } catch (err) {
      setError('Failed to update patient')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeletePatient() {
    if (!patient) return
    
    if (!confirm(`Are you sure you want to delete patient "${patient.firstName} ${patient.lastName}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete patient')
      }

      router.push('/patients')
    } catch (error) {
      console.error('Error deleting patient:', error)
      setError('Failed to delete patient. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <main className="container py-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </main>
    )
  }

  if (!patient) {
    return (
      <main className="container py-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">Patient not found</div>
        </div>
      </main>
    )
  }

  return (
    <main className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-sm text-muted-foreground mb-2">
            <Link href="/patients" className="hover:text-foreground">Patients</Link> / 
            <Link href={`/patients/${patientId}`} className="hover:text-foreground"> {patient.firstName} {patient.lastName}</Link> / Edit
          </nav>
          <h1 className="text-3xl font-semibold tracking-tight">Edit Patient</h1>
          <p className="text-muted-foreground">Update patient information</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="elevation bg-card p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">First Name *</label>
              <input 
                type="text" 
                name="firstName"
                required 
                defaultValue={patient.firstName}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name *</label>
              <input 
                type="text" 
                name="lastName"
                required 
                defaultValue={patient.lastName}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" 
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Date of Birth *</label>
              <input 
                type="date" 
                name="dob"
                required 
                defaultValue={patient.dob.split('T')[0]}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Gender *</label>
              <select 
                name="gender"
                required 
                defaultValue={patient.gender}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select 
                name="dbStatus"
                defaultValue={patient.dbStatus || 'active'}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="active">Aktiv</option>
                <option value="inactive">Inaktiv</option>
                <option value="archived">Archiviert</option>
                <option value="pending">Ausstehend</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <textarea 
              name="address"
              defaultValue={patient.address || ''}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" 
              rows={3}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input 
                type="tel" 
                name="phone"
                defaultValue={patient.phone || ''}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input 
                type="email" 
                name="email"
                defaultValue={patient.email || ''}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" 
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Insurance</label>
              <input 
                type="text" 
                name="insurance"
                defaultValue={patient.insurance || ''}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Weight (kg)</label>
              <input 
                type="number" 
                name="weight"
                step="0.1"
                min="0"
                placeholder="e.g., 70.5"
                defaultValue={patient.weight || ''}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Allergies</label>
            <input 
              type="text" 
              name="allergies"
              placeholder="Comma-separated list (e.g., Penicillin, Latex)"
              defaultValue={patient.allergies || ''}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" 
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button 
              type="submit" 
              disabled={saving}
              className="rounded-xl bg-primary text-primary-foreground px-6 py-2 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Patient'}
            </button>
            <Link 
              href={`/patients/${patientId}`}
              className="rounded-xl border border-border bg-background px-6 py-2 font-medium hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleDeletePatient}
              disabled={deleting || saving}
              className="rounded-xl bg-red-600 text-white px-6 py-2 font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? 'Deleting...' : 'Delete Patient'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
