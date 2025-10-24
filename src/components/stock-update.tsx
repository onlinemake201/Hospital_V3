"use client"

import { useState, useEffect } from 'react'

interface StockUpdateProps {
  medicationId: string
  currentStock: number
  onStockUpdate: (newStock: number) => void
}

export default function StockUpdate({ medicationId, currentStock, onStockUpdate }: StockUpdateProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newStock, setNewStock] = useState(currentStock)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update newStock when currentStock changes
  useEffect(() => {
    setNewStock(currentStock)
  }, [currentStock])

  const handleUpdateStock = async () => {
    if (newStock < 0) {
      setError('Stock cannot be negative')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Calculate the change needed
      const change = newStock - currentStock
      
      const response = await fetch(`/api/inventory/${medicationId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          change: change,
          reason: `Manual stock adjustment to ${newStock}`
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update stock')
      }

      const { medication } = await response.json()
      onStockUpdate(medication.currentStock)
      setIsOpen(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Update Stock
      </button>
    )
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="font-medium text-gray-900 mb-3">Update Stock</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Stock: {currentStock}
          </label>
          <input
            type="number"
            min="0"
            value={newStock}
            onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter new stock amount"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleUpdateStock}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Updating...' : 'Update Stock'}
          </button>
          <button
            onClick={() => {
              setIsOpen(false)
              setNewStock(currentStock)
              setError(null)
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
