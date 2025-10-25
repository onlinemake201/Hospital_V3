"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrency } from '@/lib/system-settings'
import { useToast } from '@/components/modern-toast'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  User,
  Receipt,
  Calendar,
  CreditCard,
  Search,
  FileText
} from 'lucide-react'

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
  pricePerUnit?: number
  form?: string
  strength?: string
}

interface InvoiceItem {
  type: 'medication' | 'service'
  medicationId?: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [medicationSearchTerm, setMedicationSearchTerm] = useState('')
  const [currency, setCurrency] = useState('CHF')
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [currentItem, setCurrentItem] = useState<Partial<InvoiceItem>>({
    type: 'service',
    description: '',
    quantity: 1,
    unitPrice: 0
  })
  
  const [formData, setFormData] = useState({
    patientId: '',
    dueDate: '',
    paymentMethod: 'cash',
    notes: ''
  })

  const { showToast } = useToast()

  useEffect(() => {
    fetchPatients()
    fetchMedications()
    getCurrency().then(setCurrency)
  }, [])

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients')
      if (!response.ok) throw new Error('Failed to fetch patients')
      const data = await response.json()
      setPatients(data.patients || [])
      setFilteredPatients(data.patients || [])
    } catch (error) {
      console.error('Error fetching patients:', error)
      setError('Failed to load patients')
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
      setError('Failed to load medications')
    }
  }

  useEffect(() => {
    if (!searchTerm) {
      setFilteredPatients(patients)
    } else {
      const filtered = patients.filter(patient => 
        patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientNo.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPatients(filtered)
    }
  }, [searchTerm, patients])

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

  const addItem = () => {
    if (!currentItem.description || !currentItem.quantity || !currentItem.unitPrice) {
      setError('Please fill in all item fields')
      return
    }

    const totalPrice = currentItem.quantity! * currentItem.unitPrice!
    const newItem: InvoiceItem = {
      type: currentItem.type!,
      medicationId: currentItem.medicationId,
      description: currentItem.description!,
      quantity: currentItem.quantity!,
      unitPrice: currentItem.unitPrice!,
      totalPrice
    }

    setInvoiceItems(prev => [...prev, newItem])
    setCurrentItem({
      type: 'service',
      description: '',
      quantity: 1,
      unitPrice: 0
    })
    setMedicationSearchTerm('')
  }

  const removeItem = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index))
  }

  const selectMedication = (medication: Medication) => {
    setCurrentItem(prev => ({
      ...prev,
      type: 'medication',
      medicationId: medication.id,
      description: `${medication.name} (${medication.code})`,
      unitPrice: medication.pricePerUnit || 0
    }))
    setMedicationSearchTerm(`${medication.name} (${medication.code})`)
  }

  const getTotalAmount = () => {
    return invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0)
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
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formData.patientId,
          dueDate: formData.dueDate,
          items: invoiceItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.totalPrice
          })),
          subtotal: getTotalAmount(),
          total: getTotalAmount(),
          issueDate: new Date().toISOString().split('T')[0],
          notes: formData.notes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create invoice')
      }

      const result = await response.json()
      showToast(`Invoice ${result.invoice?.invoiceNo || 'created'} successfully!`, 'success')
      router.push('/billing')
    } catch (error: any) {
      console.error('Error creating invoice:', error)
      setError(error.message)
      showToast(`Failed to create invoice: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <nav className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              <Link href="/billing" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Billing
              </Link>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create Invoice
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Create a new invoice for a patient</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Patient Selection */}
            <div className="space-y-3">
              <label htmlFor="patient" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4" />
                Patient *
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-10 py-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                {searchTerm && (
                  <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-700 shadow-lg">
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, patientId: patient.id }))
                          setSearchTerm(`${patient.firstName} ${patient.lastName} (${patient.patientNo})`)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-600 border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-slate-900 dark:text-slate-100">{patient.firstName} {patient.lastName}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Patient No: {patient.patientNo}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Items */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Invoice Items
              </h3>
              
              {/* Add Item Form */}
              <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                    <select
                      value={currentItem.type}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, type: e.target.value as 'medication' | 'service' }))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="service">Service</option>
                      <option value="medication">Medication</option>
                    </select>
                  </div>

                  {currentItem.type === 'medication' && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Medication</label>
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search medications..."
                            value={medicationSearchTerm}
                            onChange={(e) => setMedicationSearchTerm(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-10 py-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        {medicationSearchTerm && (
                          <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-700 shadow-lg">
                            {filteredMedications.map((medication) => (
                              <button
                                key={medication.id}
                                type="button"
                                onClick={() => selectMedication(medication)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-600 border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors"
                              >
                                <div className="font-medium text-slate-900 dark:text-slate-100">{medication.name}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                  {medication.code} • {currency} {(medication.pricePerUnit || 0).toFixed(2)}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description *</label>
                    <input
                      type="text"
                      value={currentItem.description}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g., Consultation fee, Medication"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Unit Price ({currency}) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentItem.unitPrice}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="w-full rounded-xl bg-blue-600 text-white px-6 py-3 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>

              {/* Items List */}
              {invoiceItems.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">Added Items</h4>
                  <div className="space-y-3">
                    {invoiceItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-700 shadow-sm">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{item.description}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            Qty: {item.quantity} × {currency} {item.unitPrice.toFixed(2)} = {currency} {item.totalPrice.toFixed(2)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors p-2"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <div className="flex justify-between font-semibold text-lg text-slate-900 dark:text-slate-100">
                      <span>Total Amount:</span>
                      <span>{currency} {getTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label htmlFor="paymentMethod" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Method *
                </label>
                <select
                  id="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="insurance">Insurance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-3">
                <label htmlFor="dueDate" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Due Date *
                </label>
                <input
                  id="dueDate"
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <label htmlFor="notes" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or comments for this invoice..."
                rows={4}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Link
                href="/billing"
                className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-6 py-3 font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !formData.patientId || invoiceItems.length === 0}
                className="rounded-xl bg-blue-600 text-white px-6 py-3 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Create Invoice
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
