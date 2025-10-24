"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import StockUpdate from '@/components/stock-update'

interface Medication {
  id: string
  code: string
  name: string
  form?: string
  strength?: string
  minStock: number
  currentStock: number
  barcode?: string
  imageUrl?: string
  description?: string
  pricePerUnit: number
  supplier?: {
    name: string
  }
}

export default function MedicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [medication, setMedication] = useState<Medication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchMedication() {
      try {
        const response = await fetch(`/api/inventory/${params.id}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        if (!response.ok) {
          throw new Error('Failed to fetch medication')
        }
        const data = await response.json()
        setMedication(data.medication)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchMedication()
    }
  }, [params.id])

  const handleStockUpdate = (newStock: number) => {
    if (medication) {
      setMedication({ ...medication, currentStock: newStock })
    }
  }

  const handleDelete = async () => {
    if (!medication) return
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${medication.name}"? This action cannot be undone.`
    )
    
    if (!confirmed) return
    
    setDeleting(true)
    try {
      const response = await fetch(`/api/inventory/${medication.id}/delete`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete medication')
      }
      
      // Redirect to inventory page
      router.push('/inventory')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (error || !medication) {
    return (
      <div className="container py-8">
        <div className="text-center text-red-600">
          {error || 'Medication not found'}
        </div>
      </div>
    )
  }

  const currentStock = medication.currentStock || 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            <Link href="/inventory" className="hover:text-slate-700 dark:hover:text-slate-300">
              Inventory
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-900 dark:text-slate-100">{medication.name}</span>
          </nav>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {medication.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Code: {medication.code}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Link
                href={`/inventory/${medication.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Edit Medication
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Medication'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><span className="font-medium">Name:</span> {medication.name}</p>
                  <p><span className="font-medium">Code:</span> {medication.code}</p>
                  {medication.form && <p><span className="font-medium">Form:</span> {medication.form}</p>}
                  {medication.strength && <p><span className="font-medium">Strength:</span> {medication.strength}</p>}
                </div>
                <div>
                  <p><span className="font-medium">Min Stock:</span> {medication.minStock}</p>
                  <p><span className="font-medium">Price per Unit:</span> ${medication.pricePerUnit}</p>
                  {medication.barcode && <p><span className="font-medium">Barcode:</span> {medication.barcode}</p>}
                </div>
              </div>
              {medication.description && (
                <div className="mt-4">
                  <p><span className="font-medium">Description:</span></p>
                  <p className="text-slate-600 dark:text-slate-400">{medication.description}</p>
                </div>
              )}
            </div>

            {/* Stock Management */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Stock Management
              </h2>
              <StockUpdate 
                medicationId={medication.id}
                currentStock={currentStock}
                onStockUpdate={handleStockUpdate}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stock Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Stock Summary
              </h3>
              <div className="space-y-2">
                <p><span className="font-medium">Current Stock:</span> {currentStock}</p>
                <p><span className="font-medium">Min Stock:</span> {medication.minStock}</p>
                <p className={`font-medium ${currentStock <= medication.minStock ? 'text-red-600' : 'text-green-600'}`}>
                  Status: {currentStock <= medication.minStock ? 'Low Stock' : 'In Stock'}
                </p>
              </div>
            </div>

            {/* Supplier */}
            {medication.supplier && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Supplier
                </h3>
                <p>{medication.supplier.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}