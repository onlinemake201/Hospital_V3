"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
  supplier?: {
    name: string
  }
}

export default function InventoryPage() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'lowStock'>('all')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    fetchMedications()
  }, [mounted])

  const fetchMedications = async () => {
    try {
      const response = await fetch('/api/inventory', {
        cache: 'force-cache',
        next: { revalidate: 300 }, // 5 Minuten Cache
        headers: {
          'Cache-Control': 'max-age=300, stale-while-revalidate=600'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch medications')
      const data = await response.json()
      
      // Use medications with stock data from the main API call
      // The API should include currentStock in the response
      const medicationsWithStock = (data.medications || []).map((med: Medication) => ({
        ...med,
        currentStock: med.currentStock || 0
      }))
      
      setMedications(medicationsWithStock)
      setFilteredMedications(medicationsWithStock)
    } catch (error) {
      console.error('Error fetching medications:', error)
      // Set empty array on error to prevent crashes
      setMedications([])
      setFilteredMedications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = medications

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(med => 
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.form?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.strength?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply type filter
    if (filterType === 'lowStock') {
      filtered = filtered.filter(med => 
        (med.currentStock || 0) < med.minStock
      )
    }

    setFilteredMedications(filtered)
  }, [medications, searchTerm, filterType])

  const lowStockItems = medications.filter(med => 
    (med.currentStock || 0) < med.minStock
  )

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500 dark:text-slate-400">Loading medications...</div>
          </div>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500 dark:text-slate-400">Loading medications...</div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Modern Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Inventory</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">Manage medications and stock levels</p>
          </div>
          <Link 
            href="/inventory/new"
            className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 font-medium text-center min-h-[44px] flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Add Medication
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-sm text-slate-500 dark:text-slate-400">Total Medications</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{medications.length}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-sm text-slate-500 dark:text-slate-400">Low Stock</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{lowStockItems.length}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-sm text-slate-500 dark:text-slate-400">In Stock</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{medications.length - lowStockItems.length}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-sm text-slate-500 dark:text-slate-400">Stock Value</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">-</div>
          </div>
        </div>

        {/* Alerts */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-xl">
            <h3 className="font-medium">Low Stock Alert</h3>
            <p className="text-sm opacity-80">
              {lowStockItems.length} medication(s) below minimum stock level
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg">
          <div className="p-6">
            <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <input 
                type="text" 
                placeholder="Search medications..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'lowStock')}
                className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 text-slate-900 dark:text-slate-100 min-h-[44px] sm:w-auto outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="lowStock">Low Stock</option>
              </select>
            </div>

            {/* Modern Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMedications.map((med) => {
                const isLowStock = (med.currentStock || 0) < med.minStock
                // Calculate stock level as percentage of minimum stock requirement
                // Cap at 200% for display purposes (anything above 200% shows as 200%)
                const stockPercentage = med.minStock > 0 
                  ? Math.min(((med.currentStock || 0) / med.minStock) * 100, 200) 
                  : 100
                
                return (
                  <div key={med.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-200">
                    {/* Image */}
                    <div className="h-48 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      {med.imageUrl ? (
                        <img 
                          src={med.imageUrl} 
                          alt={med.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                            if (nextElement) {
                              nextElement.style.display = 'flex'
                            }
                          }}
                        />
                      ) : null}
                      <div className={`${med.imageUrl ? 'hidden' : 'flex'} w-full h-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-700 dark:to-slate-800`}>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl font-bold text-white">{med.name.charAt(0)}</span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">No Image</p>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{med.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{med.code}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isLowStock 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {med.currentStock || 0} in stock
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        {med.form && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            <span className="font-medium">Form:</span> {med.form}
                          </p>
                        )}
                        {med.strength && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            <span className="font-medium">Strength:</span> {med.strength}
                          </p>
                        )}
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          <span className="font-medium">Min Stock:</span> {med.minStock}
                        </p>
                      </div>

                      {/* Stock Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                          <span>Stock Level</span>
                          <span>{Math.round(stockPercentage)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              stockPercentage < 100 ? 'bg-red-500' : 
                              stockPercentage < 150 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link 
                          href={`/inventory/${med.id}`}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 px-3 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                        >
                          View Details
                        </Link>
                        <Link 
                          href={`/inventory/${med.id}/edit`}
                          className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-100 py-2 px-3 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-200"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredMedications.length === 0 && (
              <div className="text-center py-12">
                <div className="text-slate-400 text-lg">No medications found</div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  {searchTerm ? 'Try adjusting your search terms' : 'Add your first medication to get started'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}