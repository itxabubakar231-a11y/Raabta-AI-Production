import { useState, useEffect } from 'react'
import {
  Shield, Users, Activity, Layers, RefreshCw,
  Check, UserCheck, AlertCircle, FileText
} from 'lucide-react'
import * as api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function AdminPage() {
  const { role } = useAuth()
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('users') // 'users' or 'audit'
  const [updatingUser, setUpdatingUser] = useState(null)

  async function loadAdminData() {
    setLoading(true)
    try {
      const [overRes, usersRes, logsRes] = await Promise.all([
        api.getAdminOverview().catch(() => ({ overview: {} })),
        api.getAdminUsers().catch(() => ({ users: [] })),
        api.getAuditLogs().catch(() => ({ logs: [] }))
      ])
      setOverview(overRes.overview || {})
      setUsers(usersRes.users || [])
      setAuditLogs(logsRes.logs || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  async function handleRoleChange(userId, newRole) {
    try {
      await api.updateUserRole(userId, { role: newRole })
      setUsers(prev => prev.map(u => (u.id === userId || u._id === userId ? { ...u, role: newRole } : u)))
    } catch (err) {
      alert(err.message || 'Failed to update user role')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
            <Shield size={14} className="text-emerald-600" />
            <span>Platform Administration</span>
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
            Raabta AI Command Center & Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            System administration, staff role allocations, and security audit log monitoring.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAdminData}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-600' : ''} />
          <span>Refresh Admin View</span>
        </button>
      </div>

      {/* Admin KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <Users size={14} className="text-emerald-600" />
            <span>Registered Users</span>
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{overview?.total_users || users.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <UserCheck size={14} className="text-blue-600" />
            <span>Duty Officers</span>
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {overview?.active_officers || users.filter(u => u.role === 'officer').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <FileText size={14} className="text-indigo-600" />
            <span>Total Civic Reports</span>
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{overview?.total_reports ?? 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <Layers size={14} className="text-amber-600" />
            <span>Proximity Clusters</span>
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{overview?.active_clusters ?? 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          type="button"
          onClick={() => setSelectedTab('users')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            selectedTab === 'users' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          User Governance & Roles ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedTab('audit')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            selectedTab === 'audit' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          System Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: User Management */}
      {selectedTab === 'users' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="pb-3 font-semibold">User Name</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Current Role</th>
                  <th className="pb-3 font-semibold">Assigned Dept</th>
                  <th className="pb-3 font-semibold text-right">Role Allocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => {
                  const uid = u.id || u._id
                  return (
                    <tr key={uid} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-bold text-slate-900">{u.full_name || 'Citizen'}</td>
                      <td className="py-3 text-slate-500 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : u.role === 'officer'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{u.department_id || '—'}</td>
                      <td className="py-3 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(uid, e.target.value)}
                          className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:bg-white focus:border-emerald-600 outline-none transition-all"
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
        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {selectedTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.length === 0 ? (
              <p className="text-slate-400 text-center py-6">No audit records available.</p>
            ) : (
              auditLogs.map((log) => {
                const lid = log.id || log._id
                const dt = log.timestamp ? new Date(log.timestamp).toLocaleString() : ''
                return (
                  <div key={lid} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-emerald-800">
                          {log.action}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {log.actor_role || 'SYSTEM'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400">{dt}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
