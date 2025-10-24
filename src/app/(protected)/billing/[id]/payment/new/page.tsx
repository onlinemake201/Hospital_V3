"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/a11y'
import { getCurrency } from '@/lib/system-settings'

interface Invoice {
  $id: string
  invoiceNo: string
  amount: number
  balance: number
  currency: string
  patient: {
    firstName: string
    lastName: string
    patientNo: string
  }
}

export default function NewPaymentPage() {
  const params = useParams()
  const invoiceId = params.id as string
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [currency, setCurrency] = useState('CHF')
  
  const [formData, setFormData] = useState({
    amount: 0,
    method: 'cash',
    reference: '',
    paidAt: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchInvoice()
    getCurrency().then(setCurrency)
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      console.log('Fetching invoice for payment with ID:', invoiceId)
      const response = await fetch(`/api/billing/${invoiceId}`)
      console.log('Payment page response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Payment page API Error:', errorText)
        throw new Error(`Failed to fetch invoice: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Payment page invoice data:', data)
      setInvoice(data.invoice)
      setFormData(prev => ({ ...prev, amount: Number(data.invoice?.balance) }))
    } catch (error) {
      console.error('Error fetching invoice:', error)
      setError(`Failed to load invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/billing/${invoiceId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount.toString()),
          paidAt: formData.paidAt
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Payment error:', error)
        throw new Error(error.error || 'Failed to record payment')
      }

      router.push(`/billing/${invoiceId}`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!invoice && !error) {
    return (
      <main className="container py-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading invoice...</div>
        </div>
      </main>
    )
  }

  if (error) {
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

  return (
    <main className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/billing/${invoice?.$id}`} className="text-muted-foreground hover:underline">
          &larr; Back to Invoice
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Record Payment</h1>
          <p className="text-muted-foreground">Invoice #{invoice?.invoiceNo} - {invoice?.patient?.firstName} {invoice?.patient?.lastName}</p>
        </div>
      </div>

      <div className="elevation bg-card p-6 rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Invoice Summary */}
          <div className="bg-muted/20 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Invoice Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Amount:</span>
                <div className="font-medium">{formatCurrency(Number(invoice?.amount), invoice?.currency)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Balance Due:</span>
                <div className="font-medium text-destructive">{formatCurrency(Number(invoice?.balance), invoice?.currency)}</div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Payment Amount ({invoice?.currency}) *
              </label>
              <input
                id="amount"
                type="number"
                min="0.01"
                max={invoice?.balance}
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Maximum: {formatCurrency(Number(invoice?.balance), invoice?.currency)}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="method" className="text-sm font-medium">
                Payment Method *
              </label>
              <select
                id="method"
                required
                value={formData.method}
                onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="mpesa">M-Pesa</option>
                <option value="card">Credit/Debit Card</option>
                <option value="insurance">Insurance</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="reference" className="text-sm font-medium">
                Reference/Transaction ID
              </label>
              <input
                id="reference"
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="e.g., TXN123456789"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="paidAt" className="text-sm font-medium">
                Payment Date *
              </label>
              <input
                id="paidAt"
                type="date"
                required
                value={formData.paidAt}
                onChange={(e) => setFormData(prev => ({ ...prev, paidAt: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-muted/20 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Payment Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Payment Amount:</span>
                <span className="font-medium">{formatCurrency(formData.amount, invoice?.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining Balance:</span>
                <span className="font-medium">
                  {formatCurrency(Number(invoice?.balance) - formData.amount, invoice?.currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href={`/billing/${invoice?.$id}`}
              className="rounded-xl border border-border bg-background px-4 py-2 font-medium hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || formData.amount <= 0 || formData.amount > Number(invoice?.balance)}
              className="rounded-xl bg-primary text-primary-foreground px-4 py-2 font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
