import { useState, useEffect } from 'react'
import {
  Users, Shield, UserCheck, RefreshCw, Check, AlertCircle, Building, Search
} from 'lucide-react'
import * as api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function GovUsersPage() {
  const { currentUser, role } = useAuth()
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  async function loadData() {
    setLoading(true)
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api.getAdminUsers().catch(() => ({ users: [] })),
        api.getDepartments().catch(() => ({ departments: [] }))
      ])
      setUsers(usersRes.users || [])
      setDepartments(deptsRes.departments || [])
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleRoleUpdate(userId, newRole, deptId) {
    setUpdatingId(userId)
    try {
      await api.updateUserRole(userId, { role: newRole, department_id: deptId })
      setUsers(prev => prev.map(u => {
        if ((u.id || u._id) === userId) {
          return { ...u, role: newRole, department_id: deptId }
        }
        return u
      }))
    } catch (err) {
      alert(err.message || 'Failed to update user role')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      (u.email || '').toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Shield size={13} className="text-emerald-600" />
            <span>Admin Governance</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            Users & Role Allocations
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage system access, assign municipal field roles, and allocate staff to specific civic departments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-2.5 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user by name or email..."
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:border-emerald-600 outline-none w-64 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            title="Refresh Users"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-600' : ''} />
          </button>
        </div>
      </section>

      {/* Users Table */}
      <section className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw size={20} className="animate-spin text-emerald-600" />
            <span>Loading user registry from database...</span>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Assigned Department</th>
                  <th className="py-3 px-4 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const uid = user.id || user._id
                  const isCurrent = (currentUser?.id || currentUser?._id) === uid

                  return (
                    <tr key={uid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{user.full_name || 'Anonymous Citizen'}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {user.email}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          user.role === 'officer' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {user.role || 'citizen'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {user.role === 'officer' ? (
                          <select
                            value={user.department_id || ''}
                            onChange={(e) => handleRoleUpdate(uid, user.role, e.target.value)}
                            disabled={updatingId === uid}
                            className="p-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                          >
                            <option value="">Unassigned Department</option>
                            {departments.map((d) => (
                              <option key={d.id || d._id || d.name} value={d.id || d._id || d.name}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">N/A (Citizen)</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <select
                          value={user.role || 'citizen'}
                          onChange={(e) => handleRoleUpdate(uid, e.target.value, user.department_id)}
                          disabled={updatingId === uid}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-semibold text-xs focus:outline-none focus:border-emerald-600"
                        >
                          <option value="citizen">Citizen</option>
                          <option value="officer">Duty Officer</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500">
            No users found.
          </div>
        )}
      </section>
    </div>
  )
}
