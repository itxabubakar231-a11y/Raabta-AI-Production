import { useState, useEffect } from 'react'
import {
  FileText, Shield, Clock, RefreshCw, AlertCircle, CheckCircle2,
  Filter, Search, UserCheck, Edit3
} from 'lucide-react'
import * as api from '../../services/api'

export default function GovActivityLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  async function loadData() {
    setLoading(true)
    try {
      const res = await api.getAuditLogs()
      setLogs(res.logs || [])
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const formatUser = (log) => {
    if (log.user_email) return log.user_email
    if (typeof log.user === 'object' && log.user !== null) {
      return log.user.email || log.user.full_name || log.user.name || log.user.id || 'User'
    }
    if (typeof log.user === 'string' && log.user) return log.user
    if (log.author) return typeof log.author === 'object' ? (log.author.name || log.author.email || 'Author') : log.author
    return 'System Agent'
  }

  const formatDetails = (log) => {
    if (typeof log.details === 'object' && log.details !== null) {
      if (log.details.email) return `Email: ${log.details.email}`
      if (log.details.reason) return `Reason: ${log.details.reason}`
      if (log.details.tracking_id) return `Tracking ID: ${log.details.tracking_id}`
      if (log.details.note) return log.details.note
      return JSON.stringify(log.details)
    }
    if (log.details) return String(log.details)
    if (log.notes) return typeof log.notes === 'object' ? JSON.stringify(log.notes) : String(log.notes)
    if (log.reason) return typeof log.reason === 'object' ? JSON.stringify(log.reason) : String(log.reason)
    if (log.payload) return JSON.stringify(log.payload)
    return '-'
  }

  const filteredLogs = logs.filter(log => {
    if (actionFilter !== 'all') {
      const act = (log.action || log.event || '').toLowerCase()
      if (!act.includes(actionFilter.toLowerCase())) return false
    }

    const q = searchQuery.toLowerCase().trim()
    if (!q) return true

    const userStr = formatUser(log).toLowerCase()
    const detailStr = formatDetails(log).toLowerCase()
    const trackingStr = (log.tracking_id || log.report_id || '').toLowerCase()
    const actStr = (log.action || log.event || '').toLowerCase()

    return (
      actStr.includes(q) ||
      userStr.includes(q) ||
      trackingStr.includes(q) ||
      detailStr.includes(q)
    )
  })

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Clock size={13} className="text-emerald-600" />
            <span>Immutable Governance Audit</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            System Activity & Audit Log
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Chronological record of logins, report creation, officer assignments, AI overrides, resolutions, and citizen confirmations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-2.5 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:border-emerald-600 outline-none w-64 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            title="Refresh Audit Logs"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-600' : ''} />
          </button>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { key: 'all', label: `All Events (${logs.length})` },
            { key: 'override', label: 'AI Overrides' },
            { key: 'report', label: 'Report Submissions' },
            { key: 'status', label: 'Status Updates' },
            { key: 'assign', label: 'Officer Assignments' },
            { key: 'resolve', label: 'Resolutions' },
            { key: 'verification', label: 'Citizen Confirmations' }
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActionFilter(item.key)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                actionFilter === item.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* Audit Log Table */}
      <section className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw size={20} className="animate-spin text-emerald-600" />
            <span>Loading activity ledger from database...</span>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event / Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Record</th>
                  <th className="py-3 px-4">Audit Details / Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log, idx) => {
                  const actionName = log.action || log.event || 'SYSTEM_EVENT'
                  const isOverride = actionName.includes('OVERRIDE')
                  const isResolve = actionName.includes('RESOLVE') || actionName.includes('VERIF')

                  return (
                    <tr key={log.id || log._id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.timestamp || log.created_at ? new Date(log.timestamp || log.created_at).toLocaleString() : 'Recent'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] uppercase border ${
                          isOverride ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          isResolve ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {actionName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {formatUser(log)}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {log.tracking_id || log.report_id || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-md break-words">
                        {formatDetails(log)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500">
            No audit records match the current filter.
          </div>
        )}
      </section>
    </div>
  )
}
