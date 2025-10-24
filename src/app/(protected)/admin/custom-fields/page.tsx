"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Settings, User, ArrowLeft, Save, X, Type, Calendar, CheckSquare, Hash, List, FileText } from 'lucide-react'

interface CustomField {
  id: string
  name: string
  type: string
  required: boolean
  options?: string
  description?: string
  placeholder?: string
}

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'text',
    required: false,
    options: '',
    description: '',
    placeholder: ''
  })

  useEffect(() => {
    fetchFields()
  }, [])

  const fetchFields = async () => {
    try {
      const response = await fetch('/api/admin/custom-fields')
      if (!response.ok) throw new Error('Failed to fetch fields')
      const data = await response.json()
      setFields(data.fields || [])
    } catch (error) {
      console.error('Error fetching fields:', error)
      // Fallback to mock data if API fails
      const mockFields: CustomField[] = [
        {
          id: '1',
          name: 'Emergency Contact',
          type: 'text',
          required: true,
          description: 'Emergency contact person for the patient',
          placeholder: 'Enter emergency contact name'
        },
        {
          id: '2',
          name: 'Blood Type',
          type: 'select',
          required: false,
          options: 'A+,A-,B+,B-,AB+,AB-,O+,O-',
          description: 'Patient blood type'
        },
        {
          id: '3',
          name: 'Insurance Number',
          type: 'text',
          required: false,
          description: 'Health insurance policy number',
          placeholder: 'Enter insurance number'
        }
      ]
      setFields(mockFields)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to create field')

      const { field } = await response.json()
      setFields([...fields, field])
      setShowCreateForm(false)
      setFormData({ name: '', type: 'text', required: false, options: '', description: '', placeholder: '' })
    } catch (error) {
      console.error('Error creating field:', error)
      // For now, just add to local state
      const newField: CustomField = {
        id: Date.now().toString(),
        ...formData
      }
      setFields([...fields, newField])
      setShowCreateForm(false)
      setFormData({ name: '', type: 'text', required: false, options: '', description: '', placeholder: '' })
    }
  }

  const handleUpdateField = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingField) return

    try {
      const response = await fetch(`/api/admin/custom-fields/${editingField.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to update field')

      const { field } = await response.json()
      setFields(fields.map(f => f.id === editingField.id ? field : f))
      setEditingField(null)
      setFormData({ name: '', type: 'text', required: false, options: '', description: '', placeholder: '' })
    } catch (error) {
      console.error('Error updating field:', error)
      // For now, just update local state
      setFields(fields.map(f => f.id === editingField.id ? { ...f, ...formData } : f))
      setEditingField(null)
      setFormData({ name: '', type: 'text', required: false, options: '', description: '', placeholder: '' })
    }
  }

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return

    try {
      const response = await fetch(`/api/admin/custom-fields/${fieldId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete field')

      setFields(fields.filter(f => f.id !== fieldId))
    } catch (error) {
      console.error('Error deleting field:', error)
      // For now, just remove from local state
      setFields(fields.filter(f => f.id !== fieldId))
    }
  }

  const startEdit = (field: CustomField) => {
    setEditingField(field)
    setFormData({
      name: field.name,
      type: field.type,
      required: field.required,
      options: field.options || '',
      description: field.description || '',
      placeholder: field.placeholder || ''
    })
  }

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return Type
      case 'number': return Hash
      case 'email': return Type
      case 'phone': return Type
      case 'date': return Calendar
      case 'select': return List
      case 'textarea': return FileText
      default: return Type
    }
  }

  const getFieldColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-500'
      case 'number': return 'bg-green-500'
      case 'email': return 'bg-purple-500'
      case 'phone': return 'bg-orange-500'
      case 'date': return 'bg-red-500'
      case 'select': return 'bg-indigo-500'
      case 'textarea': return 'bg-pink-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <main className="container py-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading custom fields...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm border">
            <Settings className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Custom Fields</h1>
            <p className="text-gray-600 dark:text-gray-400">Define custom patient fields to collect additional information</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Field
          </button>
        </div>
      </div>

      {/* Custom Patient Fields Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <Settings className="h-8 w-8" />
          <h2 className="text-2xl font-bold">Custom Patient Fields</h2>
        </div>
        <p className="text-orange-100 text-lg">Manage custom fields for enhanced patient data collection</p>
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fields.map((field) => {
          const Icon = getFieldIcon(field.type)
          const colorClass = getFieldColor(field.type)
          
          return (
            <div key={field.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-full ${colorClass} text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(field)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{field.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 capitalize">{field.type}</p>
              
              {field.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{field.description}</p>
              )}
              
              {/* Field Preview */}
              <div className="mb-4">
                {field.type === 'select' ? (
                  <div>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                      <option>Select {field.name.toLowerCase()}</option>
                    </select>
                    {field.options && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Options:</p>
                        <div className="flex flex-wrap gap-1">
                          {field.options.split(',').map((option, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              {option.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
                    placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    disabled
                  />
                )}
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {field.required && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    Required
                  </span>
                )}
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  {field.type}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingField) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingField ? 'Edit Field' : 'Add New Field'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingField(null)
                  setFormData({ name: '', type: 'text', required: false, options: '', description: '', placeholder: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={editingField ? handleUpdateField : handleCreateField} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Field Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., Emergency Contact"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Field Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="text">Text Input</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="date">Date</option>
                  <option value="select">Dropdown</option>
                  <option value="textarea">Text Area</option>
                </select>
              </div>

              {formData.type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Options (comma-separated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., A+, A-, B+, B-, AB+, AB-, O+, O-"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Describe what this field is for..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Placeholder Text
                </label>
                <input
                  type="text"
                  value={formData.placeholder}
                  onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., Enter emergency contact name"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={formData.required}
                  onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="required" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Required field
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingField(null)
                    setFormData({ name: '', type: 'text', required: false, options: '', description: '', placeholder: '' })
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingField ? 'Update Field' : 'Create Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}