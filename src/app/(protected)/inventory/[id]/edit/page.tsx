"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getCurrency } from '@/lib/system-settings'

interface Medication {
  id: string
  code: string
  name: string
  form?: string
  strength?: string
  minStock: number
  currentStock: number
  barcode?: string
  supplierId?: string
  imageUrl?: string
  description?: string
  pricePerUnit?: number
}

export default function EditMedicationPage() {
  const params = useParams()
  const inventoryId = params.id as string
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [medication, setMedication] = useState<Medication | null>(null)
  const [mounted, setMounted] = useState(false)
  const [currency, setCurrency] = useState('CHF')
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    form: '',
    strength: '',
    minStock: 0,
    currentStock: 0,
    barcode: '',
    imageUrl: '',
    description: '',
    pricePerUnit: 0
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }))
      setImagePreview(data.imageUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      handleImageUpload(file)
    }
  }

  useEffect(() => {
    setMounted(true)
    // Load currency
    getCurrency().then(setCurrency)
  }, [])

  useEffect(() => {
    if (!mounted) return
    fetchMedication()
  }, [mounted, inventoryId])

  const fetchMedication = async () => {
    try {
      const response = await fetch(`/api/inventory/${inventoryId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch medication')
      const data = await response.json()
      setMedication(data.medication)
      setFormData({
        code: data.medication.code,
        name: data.medication.name,
        form: data.medication.form || '',
        strength: data.medication.strength || '',
        minStock: data.medication.minStock,
        currentStock: data.medication.currentStock || 0,
        barcode: data.medication.barcode || '',
        imageUrl: data.medication.imageUrl || '',
        description: data.medication.description || '',
        pricePerUnit: data.medication.pricePerUnit || 0
      })
      setImagePreview(data.medication.imageUrl || null)
    } catch (error) {
      console.error('Error fetching medication:', error)
      setError('Failed to load medication')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/inventory/${inventoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update medication')
      }

      router.push('/inventory')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <main className="container py-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading medication...</div>
        </div>
      </main>
    )
  }

  if (!medication) {
    return (
      <main className="container py-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading medication...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="container py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/inventory/${inventoryId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Edit Medication</h1>
          <p className="text-muted-foreground">Update medication information</p>
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
              <label htmlFor="code" className="text-sm font-medium">
                Code *
              </label>
              <input
                id="code"
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="form" className="text-sm font-medium">
                Form
              </label>
              <select
                id="form"
                value={formData.form}
                onChange={(e) => setFormData(prev => ({ ...prev, form: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select form</option>
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Cream">Cream</option>
                <option value="Ointment">Ointment</option>
                <option value="Drops">Drops</option>
                <option value="Patch">Patch</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="strength" className="text-sm font-medium">
                Strength
              </label>
              <input
                id="strength"
                type="text"
                value={formData.strength}
                onChange={(e) => setFormData(prev => ({ ...prev, strength: e.target.value }))}
                placeholder="e.g., 500mg, 10ml"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="minStock" className="text-sm font-medium">
                Minimum Stock
              </label>
              <input
                id="minStock"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="currentStock" className="text-sm font-medium">
                Current Stock
              </label>
              <input
                id="currentStock"
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={(e) => setFormData(prev => ({ ...prev, currentStock: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="barcode" className="text-sm font-medium">
                Barcode
              </label>
              <input
                id="barcode"
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="pricePerUnit" className="text-sm font-medium">
                Price per Unit ({currency})
              </label>
              <input
                id="pricePerUnit"
                type="number"
                min="0"
                step="0.01"
                value={formData.pricePerUnit}
                onChange={(e) => setFormData(prev => ({ ...prev, pricePerUnit: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="image" className="text-sm font-medium">
              Medication Image
            </label>
            <div className="space-y-3">
              {/* Image Preview */}
              {imagePreview && (
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    <img 
                      src={imagePreview} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Current image
                  </div>
                </div>
              )}
              
              {/* Upload Button */}
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="image-upload"
                  disabled={uploadingImage}
                />
                <label
                  htmlFor="image-upload"
                  className={`px-4 py-2 rounded-lg border border-border cursor-pointer hover:bg-muted transition-colors ${
                    uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingImage ? 'Uploading...' : 'Change Image'}
                </label>
                
                {/* Manual URL Input */}
                <div className="flex-1">
                  <input
                    type="url"
                    placeholder="Or enter image URL manually"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional information about the medication..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href={`/inventory/${inventoryId}`}
              className="rounded-xl border border-border bg-background px-4 py-2 font-medium hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-primary text-primary-foreground px-4 py-2 font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Medication'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
