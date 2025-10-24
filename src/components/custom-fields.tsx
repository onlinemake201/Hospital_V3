"use client"

import { useState, useEffect } from 'react'
import { Type, Hash, Calendar, List, FileText } from 'lucide-react'

interface CustomField {
  id: string
  name: string
  type: string
  required: boolean
  options?: string
  description?: string
  placeholder?: string
}

interface CustomFieldsProps {
  values?: Record<string, any>
  onChange?: (values: Record<string, any>) => void
  className?: string
}

export default function CustomFields({ values = {}, onChange, className = '' }: CustomFieldsProps) {
  const [fields, setFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [fieldValues, setFieldValues] = useState<Record<string, any>>(values)

  useEffect(() => {
    fetchCustomFields()
  }, [])

  useEffect(() => {
    if (onChange) {
      onChange(fieldValues)
    }
  }, [fieldValues, onChange])

  const fetchCustomFields = async () => {
    try {
      const response = await fetch('/api/admin/custom-fields')
      if (!response.ok) throw new Error('Failed to fetch custom fields')
      const data = await response.json()
      setFields(data.fields || [])
    } catch (error) {
      console.error('Error fetching custom fields:', error)
      // Fallback to mock data
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

  const handleFieldChange = (fieldId: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }))
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

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-sm text-gray-500">Loading custom fields...</div>
      </div>
    )
  }

  if (fields.length === 0) {
    return null
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field) => {
            const Icon = getFieldIcon(field.type)
            const fieldValue = fieldValues[field.id] || ''
            
            return (
              <div key={field.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
                )}

                {field.type === 'select' ? (
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      required={field.required}
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select {field.name.toLowerCase()}</option>
                      {field.options?.split(',').map((option, index) => (
                        <option key={index} value={option.trim()}>
                          {option.trim()}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : field.type === 'textarea' ? (
                  <div className="relative">
                    <Icon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      required={field.required}
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
                      rows={3}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
                      required={field.required}
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
