"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export default function EditInvoicePage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invoice, setInvoice] = useState<any>(null)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [currentItem, setCurrentItem] = useState<InvoiceItem>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    total: 0
  })
  
  const [formData, setFormData] = useState({
    patientId: '',
    dueDate: '',
    status: 'draft'
  })

  useEffect(() => {
    if (invoiceId) {
      loadInvoice()
    }
  }, [invoiceId])

  const loadInvoice = async () => {
    try {
      const response = await fetch(`/api/billing/${invoiceId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch invoice: ${response.status}`)
      }
      
      const data = await response.json()
      setInvoice(data.invoice)
      
      // Parse items and ensure they have all required properties
      const items = Array.isArray(data.invoice.items) ? data.invoice.items : JSON.parse(data.invoice.items || '[]')
      const processedItems = items.map((item: any) => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.price || 0,
        total: item.total || item.amount || (item.quantity || 1) * (item.unitPrice || item.price || 0)
      }))
      setInvoiceItems(processedItems)
      
      setFormData({
        patientId: data.invoice.patientId,
        dueDate: new Date(data.invoice.dueDate).toISOString().split('T')[0],
        status: data.invoice.status || 'draft'
      })
    } catch (error) {
      console.error('Error:', error)
      setError(`Failed to load invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const addItem = () => {
    if (!currentItem.description || !currentItem.quantity || !currentItem.unitPrice) {
      setError('Please fill in all item fields')
      return
    }

    const total = currentItem.quantity * currentItem.unitPrice
    const newItem = {
      ...currentItem,
      total
    }

    setInvoiceItems(prev => [...prev, newItem])
    setCurrentItem({
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    })
  }

  const removeItem = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setInvoiceItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value }
        // Recalculate total if quantity or unitPrice changed
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice
        }
        return updatedItem
      }
      return item
    }))
  }

  const getTotalAmount = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (invoiceItems.length === 0) {
      setError('Please add at least one item to the invoice')
      setLoading(false)
      return
    }

    try {
      const itemsJson = JSON.stringify(invoiceItems)
      if (itemsJson.length > 2000) {
        setError('Invoice items are too long. Please reduce the number of items or descriptions.')
        setLoading(false)
        return
      }

      const totalAmount = getTotalAmount()
      
      console.log('📝 Invoice edit data:', {
        invoiceId: invoiceId,
        originalBalance: invoice.balance,
        originalAmount: invoice.amount,
        newAmount: totalAmount,
        preservingBalance: invoice.balance,
        status: formData.status
      })

      const response = await fetch(`/api/billing/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formData.patientId,
          dueDate: formData.dueDate,
          status: formData.status,
          items: itemsJson,
          amount: totalAmount,
          // ✅ CRITICAL FIX: Preserve existing balance instead of resetting it
          balance: invoice.balance // Keep the current balance (paid amount)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update invoice')
      }

      console.log('✅ Invoice updated successfully, redirecting to invoice detail')
      
      // Redirect to invoice detail page to see updated status
      router.push(`/billing/${invoiceId}`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (error && !invoice) {
    return (
      <main className="container py-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-destructive text-lg font-semibold mb-2">Failed to load invoice</div>
            <div className="text-muted-foreground text-sm mb-4">
              {error}
            </div>
            <div className="text-muted-foreground text-xs mb-4">
              Invoice ID: {invoiceId || 'No ID provided'}
            </div>
            <Link 
              href="/billing"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Back to Billing
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (!invoice) {
    return (
      <main className="container py-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading invoice...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/billing/${invoiceId}`} className="text-muted-foreground hover:underline">
          &larr; Back to Invoice
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Edit Invoice {invoice.invoiceNo}</h1>
          <p className="text-muted-foreground">Update invoice information</p>
        </div>
      </div>

      <div className="elevation bg-card p-6 rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Patient Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Patient</label>
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">{invoice.patient?.firstName} {invoice.patient?.lastName}</div>
              <div className="text-sm text-muted-foreground">Patient No: {invoice.patient?.patientNo}</div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Invoice Items</h3>
            
            {/* Add Item Form */}
            <div className="border border-border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Add New Item</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description *</label>
                  <input
                    type="text"
                    value={currentItem.description}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g., Consultation fee, Medication"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit Price (CHF) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentItem.unitPrice}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium hover:bg-primary/90"
              >
                Add Item
              </button>
            </div>

            {/* Editable Items List */}
            {invoiceItems.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Invoice Items (Click to Edit)</h4>
                <div className="space-y-3">
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Unit Price (CHF)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Total (CHF)</label>
                          <div className="px-3 py-2 bg-muted rounded-lg font-medium">
                            {(item.total || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-destructive hover:text-destructive/80 px-3 py-1 rounded"
                        >
                          Remove Item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total Amount:</span>
                    <span>CHF {getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status, Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status *
              </label>
              <select
                id="status"
                required
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="dueDate" className="text-sm font-medium">
                Due Date *
              </label>
              <input
                id="dueDate"
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href={`/billing/${invoiceId}`}
              className="rounded-xl border border-border bg-background px-4 py-2 font-medium hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || invoiceItems.length === 0}
              className="rounded-xl bg-primary text-primary-foreground px-4 py-2 font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Invoice'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}