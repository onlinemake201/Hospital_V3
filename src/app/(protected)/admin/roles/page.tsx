"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Shield, Users, Crown, Stethoscope, UserCheck, ArrowLeft, Save, X } from 'lucide-react'

interface Role {
  id: string
  name: string
  permissions: string
  _count: {
    users: number
  }
}

interface User {
  id: string
  name: string | null
  email: string
  role: {
    name: string
  } | null
}

// Permission Matrix Component
function PermissionMatrix({ roles, onRoleUpdate, onRoleDelete }: { 
  roles: Role[], 
  onRoleUpdate: () => void,
  onRoleDelete: (roleId: string) => void 
}) {
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [permissionMatrix, setPermissionMatrix] = useState<Record<string, Record<string, boolean>>>({})

  // Define all available permissions
  const allPermissions = [
    { category: 'Patients', permissions: ['patients:read', 'patients:create', 'patients:update', 'patients:delete'] },
    { category: 'Appointments', permissions: ['appointments:read', 'appointments:create', 'appointments:update', 'appointments:delete'] },
    { category: 'Prescriptions', permissions: ['prescriptions:read', 'prescriptions:create', 'prescriptions:update', 'prescriptions:delete'] },
    { category: 'Billing', permissions: ['billing:read', 'billing:create', 'billing:update', 'billing:delete'] },
    { category: 'Inventory', permissions: ['inventory:read', 'inventory:create', 'inventory:update', 'inventory:delete'] },
    { category: 'Administration', permissions: ['admin:full', 'users:manage', 'settings:manage', 'reports:view'] }
  ]

  // Initialize permission matrix when roles change
  useEffect(() => {
    const matrix: Record<string, Record<string, boolean>> = {}
    roles.forEach(role => {
      const rolePermissions = parsePermissions(role.permissions)
      matrix[role.id] = {}
      allPermissions.forEach(category => {
        category.permissions.forEach(permission => {
          matrix[role.id][permission] = rolePermissions.includes(permission)
        })
      })
    })
    setPermissionMatrix(matrix)
  }, [roles])

  const parsePermissions = (permissions: string) => {
    try {
      return JSON.parse(permissions)
    } catch {
      return []
    }
  }

  const handlePermissionChange = async (roleId: string, permission: string, checked: boolean) => {
    const role = roles.find(r => r.id === roleId)
    if (!role) return

    const currentPermissions = parsePermissions(role.permissions)
    let newPermissions: string[]
    
    if (checked) {
      newPermissions = [...currentPermissions, permission]
    } else {
      newPermissions = currentPermissions.filter((p: string) => p !== permission)
    }

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: role.name,
          permissions: JSON.stringify(newPermissions)
        }),
      })

      if (response.ok) {
        onRoleUpdate()
      }
    } catch (error) {
      console.error('Error updating permission:', error)
    }
  }

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return <Crown className="w-4 h-4 text-purple-600" />
      case 'DOCTOR':
        return <Stethoscope className="w-4 h-4 text-blue-600" />
      case 'NURSE':
        return <UserCheck className="w-4 h-4 text-green-600" />
      default:
        return <Shield className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return 'bg-purple-100 border-purple-200'
      case 'DOCTOR':
        return 'bg-blue-100 border-blue-200'
      case 'NURSE':
        return 'bg-green-100 border-green-200'
      default:
        return 'bg-gray-100 border-gray-200'
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
            {allPermissions.map(category => (
              <th key={category.category} className="text-center py-3 px-2 font-semibold text-gray-700 min-w-[120px]">
                {category.category}
              </th>
            ))}
            <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map(role => (
            <tr key={role.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getRoleColor(role.name)}`}>
                    {getRoleIcon(role.name)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{role.name}</div>
                    <div className="text-sm text-gray-500">{role._count.users} user{role._count.users !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              </td>
              {allPermissions.map(category => (
                <td key={category.category} className="py-4 px-2">
                  <div className="flex flex-col space-y-1">
                    {category.permissions.map(permission => (
                      <label key={permission} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissionMatrix[role.id]?.[permission] || false}
                          onChange={(e) => handlePermissionChange(role.id, permission, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-xs text-gray-600">
                          {permission.split(':')[1]}
                        </span>
                      </label>
                    ))}
                  </div>
                </td>
              ))}
              <td className="py-4 px-4">
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => setEditingRole(role)}
                    className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRoleDelete(role.id)}
                    className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Role Form Component with Permission Matrix
function RoleForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  editingRole 
}: { 
  formData: { name: string; permissions: string }
  setFormData: (data: { name: string; permissions: string }) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  editingRole: Role | null
}) {
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({})

  // Define all available permissions
  const allPermissions = [
    { category: 'Patients', permissions: ['patients:read', 'patients:create', 'patients:update', 'patients:delete'] },
    { category: 'Appointments', permissions: ['appointments:read', 'appointments:create', 'appointments:update', 'appointments:delete'] },
    { category: 'Prescriptions', permissions: ['prescriptions:read', 'prescriptions:create', 'prescriptions:update', 'prescriptions:delete'] },
    { category: 'Billing', permissions: ['billing:read', 'billing:create', 'billing:update', 'billing:delete'] },
    { category: 'Inventory', permissions: ['inventory:read', 'inventory:create', 'inventory:update', 'inventory:delete'] },
    { category: 'Administration', permissions: ['admin:full', 'users:manage', 'settings:manage', 'reports:view'] }
  ]

  // Initialize selected permissions when editing
  useEffect(() => {
    if (editingRole) {
      try {
        const permissions = JSON.parse(editingRole.permissions)
        const selected: Record<string, boolean> = {}
        allPermissions.forEach(category => {
          category.permissions.forEach(permission => {
            selected[permission] = permissions.includes(permission)
          })
        })
        setSelectedPermissions(selected)
      } catch {
        setSelectedPermissions({})
      }
    } else {
      setSelectedPermissions({})
    }
  }, [editingRole])

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permission]: checked
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convert selected permissions to JSON array
    const permissionsArray = Object.entries(selectedPermissions)
      .filter(([_, selected]) => selected)
      .map(([permission, _]) => permission)
    
    setFormData({
      ...formData,
      permissions: JSON.stringify(permissionsArray)
    })
    
    // Submit the form
    onSubmit(e)
  }

  const selectAllInCategory = (category: string) => {
    const categoryPermissions = allPermissions.find(c => c.category === category)?.permissions || []
    const allSelected = categoryPermissions.every(p => selectedPermissions[p])
    
    const newSelected = { ...selectedPermissions }
    categoryPermissions.forEach(permission => {
      newSelected[permission] = !allSelected
    })
    setSelectedPermissions(newSelected)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Role Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Role Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
          placeholder="e.g., DOCTOR, NURSE, ADMIN"
          required
        />
      </div>

      {/* Permission Matrix */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-4">
          Select Permissions
        </label>
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allPermissions.map(category => (
              <div key={category.category} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{category.category}</h3>
                  <button
                    type="button"
                    onClick={() => selectAllInCategory(category.category)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {category.permissions.every(p => selectedPermissions[p]) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-2">
                  {category.permissions.map(permission => (
                    <label key={permission} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPermissions[permission] || false}
                        onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {permission.split(':')[1]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
        >
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </button>
        <button
          type="submit"
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Save className="w-4 h-4" />
          <span>{editingRole ? 'Update Role' : 'Create Role'}</span>
        </button>
      </div>
    </form>
  )
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    permissions: ''
  })

  useEffect(() => {
    fetchRoles()
    fetchUsers()
  }, [])

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingRole ? `/api/admin/roles/${editingRole.id}` : '/api/admin/roles'
      const method = editingRole ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchRoles()
        setShowCreateForm(false)
        setEditingRole(null)
        setFormData({ name: '', permissions: '' })
      } else {
        console.error('Failed to save role')
      }
    } catch (error) {
      console.error('Error saving role:', error)
    }
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      permissions: role.permissions
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchRoles()
      } else {
        console.error('Failed to delete role')
      }
    } catch (error) {
      console.error('Error deleting role:', error)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <Shield className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-4 text-lg font-medium text-gray-700">Loading roles...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white rounded-2xl shadow-lg">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Role & Permissions
                </h1>
                <p className="text-lg text-gray-600 mt-1">Configure RBAC settings and manage user roles</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/admin"
                className="flex items-center space-x-2 px-6 py-3 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Admin</span>
              </Link>
              <button
                onClick={() => {
                  setShowCreateForm(true)
                  setEditingRole(null)
                  setFormData({ name: '', permissions: '' })
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Role</span>
              </button>
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </h2>
                <p className="text-blue-100 mt-1">
                  {editingRole ? 'Update role permissions and settings' : 'Define a new role with specific permissions'}
                </p>
              </div>
              <div className="p-8">
                <RoleForm 
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowCreateForm(false)
                    setEditingRole(null)
                    setFormData({ name: '', permissions: '' })
                  }}
                  editingRole={editingRole}
                />
              </div>
            </div>
          </div>
        )}

        {/* Permission Matrix - Full Width */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-6">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">Permission Matrix</h2>
            </div>
            <p className="text-gray-300 mt-1">Configure role permissions using the matrix below</p>
          </div>
          <div className="p-6">
            <PermissionMatrix 
              roles={roles} 
              onRoleUpdate={fetchRoles}
              onRoleDelete={handleDelete}
            />
          </div>
        </div>

        {/* Users List - Full Width at Bottom */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 px-8 py-6">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">Users by Role</h2>
            </div>
            <p className="text-indigo-200 mt-1">View user assignments and role distribution</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {users.map((user) => (
                <div key={user.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{user.name || 'No Name'}</h3>
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                      <span className="inline-block px-2 py-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs font-medium rounded-full mt-1">
                        {user.role?.name || 'No Role'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}