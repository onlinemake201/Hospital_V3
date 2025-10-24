"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/modern-toast'
import { ArrowLeft, Save, Settings, Plus, Trash2, Edit } from 'lucide-react'

interface SystemSetting {
  id?: string
  key: string
  value: string
  description: string
}

export default function SystemSettingsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newSetting, setNewSetting] = useState<SystemSetting>({
    key: '',
    value: '',
    description: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || [])
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (setting: SystemSetting) => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setting),
      })

      if (response.ok) {
        const result = await response.json()
        showToast('Einstellung erfolgreich gespeichert', 'success')
        setEditingId(null)
        fetchSettings() // Refresh settings
      } else {
        const error = await response.json()
        showToast(error.error || 'Fehler beim Speichern', 'error')
      }
    } catch (error) {
      console.error('Error saving setting:', error)
      showToast('Fehler beim Speichern der Einstellung', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (settingId: string) => {
    if (!confirm('Möchten Sie diese Einstellung wirklich löschen?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/settings?id=${settingId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showToast('Einstellung erfolgreich gelöscht', 'success')
        fetchSettings() // Refresh settings
      } else {
        const error = await response.json()
        showToast(error.error || 'Fehler beim Löschen', 'error')
      }
    } catch (error) {
      console.error('Error deleting setting:', error)
      showToast('Fehler beim Löschen der Einstellung', 'error')
    }
  }

  const handleAddNew = () => {
    if (newSetting.key && newSetting.value) {
      handleSave(newSetting)
      setNewSetting({ key: '', value: '', description: '' })
    }
  }

  const handleInputChange = (field: keyof SystemSetting, value: string, settingId?: string) => {
    if (settingId) {
      setSettings(prev => prev.map(s => 
        s.id === settingId ? { ...s, [field]: value } : s
      ))
    } else {
      setNewSetting(prev => ({ ...prev, [field]: value }))
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin"
              className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                System-Einstellungen
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Verwalten Sie wichtige Systemkonfigurationen
              </p>
            </div>
          </div>
        </div>

        {/* Settings List */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Aktuelle Einstellungen</h2>
          </div>

          <div className="space-y-4">
            {settings.map((setting) => (
              <div key={setting.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Schlüssel
                    </label>
                    <input
                      type="text"
                      value={setting.key}
                      onChange={(e) => handleInputChange('key', e.target.value, setting.id)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!editingId || editingId !== setting.id}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Wert
                    </label>
                    <input
                      type="text"
                      value={setting.value}
                      onChange={(e) => handleInputChange('value', e.target.value, setting.id)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!editingId || editingId !== setting.id}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Beschreibung
                      </label>
                      <input
                        type="text"
                        value={setting.description}
                        onChange={(e) => handleInputChange('description', e.target.value, setting.id)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!editingId || editingId !== setting.id}
                      />
                    </div>
                    <div className="flex gap-2">
                      {editingId === setting.id ? (
                        <button
                          onClick={() => handleSave(setting)}
                          disabled={saving}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingId(setting.id || null)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(setting.id!)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Setting */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Neue Einstellung hinzufügen
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Schlüssel *
                  </label>
                  <input
                    type="text"
                    value={newSetting.key}
                    onChange={(e) => handleInputChange('key', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="z.B. system_currency"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Wert *
                  </label>
                  <input
                    type="text"
                    value={newSetting.value}
                    onChange={(e) => handleInputChange('value', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="z.B. EUR"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Beschreibung
                    </label>
                    <input
                      type="text"
                      value={newSetting.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Beschreibung der Einstellung"
                    />
                  </div>
                  <button
                    onClick={handleAddNew}
                    disabled={!newSetting.key || !newSetting.value || saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Hinzufügen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Available Settings
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Financial Settings</h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• <code>system_currency</code> - Default currency (EUR, USD, CHF)</li>
                <li>• <code>invoice_due_days</code> - Invoice due period in days</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-slate-900 dark:text-slate-100">System Settings</h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• <code>system_language</code> - Default language (de, en, fr)</li>
                <li>• <code>system_timezone</code> - Timezone (Europe/Berlin)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}