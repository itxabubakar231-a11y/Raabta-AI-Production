import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ShieldAlert, Clock, Filter, Search, RefreshCw,
  Building, MapPin, Layers, CheckCircle2, AlertTriangle, ExternalLink, ArrowUpDown
} from 'lucide-react'
import * as api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import EvidenceQualityBadge from '../../components/EvidenceQualityBadge'

export default function GovQueuePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { currentUser } = useAuth()

  const [reports, setReports] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)

  const isOfficer = currentUser?.role === 'officer'
  const officerDept = currentUser?.department_id || currentUser?.department || ''

  // Filter states
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all')
  const [deptFilter, setDeptFilter] = useState(
    isOfficer && officerDept ? officerDept : (searchParams.get('department') || 'all')
  )
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [assignedFilter, setAssignedFilter] = useState(searchParams.get('assigned') || 'all')
  const [repeatedFilter, setRepeatedFilter] = useState(searchParams.get('repeated') || 'all')
  const [areaFilter, setAreaFilter] = useState(searchParams.get('area') || '')
  const [searchQuery, setSearchQuery] = useState('')

  // Sync department filter if currentUser loads asynchronously
  useEffect(() => {
    if (isOfficer && officerDept && deptFilter !== officerDept) {
      setDeptFilter(officerDept)
    }
  }, [isOfficer, officerDept])

  async function loadData() {
    setLoading(true)
    try {
      const activeDept = isOfficer && officerDept ? officerDept : deptFilter
      const [deptRes, reportsRes] = await Promise.all([
        api.getDepartments().catch(() => ({ departments: [] })),
        api.getReports({
          limit: 150,
          sort_by: 'priority_desc',
          department_id: activeDept === 'all' ? '' : activeDept,
          department: activeDept === 'all' ? '' : activeDept,
          status: statusFilter === 'all' ? '' : statusFilter,
          priority: priorityFilter === 'all' ? '' : priorityFilter,
          repeated: repeatedFilter === 'true' ? 'true' : repeatedFilter === 'false' ? 'false' : '',
          area: areaFilter
        }).catch(() => ({ reports: [] }))
      ])

      setDepartments(deptRes.departments || [])
      setReports(reportsRes.reports || [])
    } catch (err) {
      console.error('Failed to load queue data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [priorityFilter, deptFilter, statusFilter, repeatedFilter, areaFilter])

  // Client-side text & assignment search
  const filteredReports = reports.filter((r) => {
    if (assignedFilter === 'me') {
      const myId = String(currentUser?.id || currentUser?._id || '')
      const myName = String(currentUser?.full_name || '').toLowerCase()
      const assignedId = String(r.assigned_to || r.assigned_officer_id || '')
      const assignedName = String(r.assigned_officer_name || '').toLowerCase()
      if (assignedId !== myId && (!myName || !assignedName.includes(myName))) {
        return false
      }
    } else if (assignedFilter === 'unassigned') {
      if (r.assigned_to || r.assigned_officer_name) return false
    }

    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      (r.tracking_id || '').toLowerCase().includes(q) ||
      (r.title || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.assigned_officer_name || '').toLowerCase().includes(q) ||
      (r.location?.address || r.location?.area || r.location?.city || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldAlert size={13} className="text-emerald-600" />
            <span>
              {isOfficer
                ? `Operational Queue — ${currentUser?.department_name || officerDept || 'Duty Officer Desk'}`
                : 'System-Wide Triage Queue'}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {isOfficer ? 'Department Priority Queue' : 'Reports Needing Attention'}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {isOfficer
              ? `Operational incidents assigned to ${currentUser?.department_name || officerDept}. Sorted by Risk Priority.`
              : 'Sorted strictly by Risk Priority (Descending) and Submission Time (Ascending) for compliant SLA resolution.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-2.5 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracking ID or keyword..."
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:border-emerald-600 outline-none w-64 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-600' : ''} />
          </button>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        {/* Quick Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick View:</span>
          {[
            { id: 'all', label: 'All Incidents' },
            { id: 'submitted', label: 'New / Unassigned' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'in_review', label: 'Needs Info' },
            { id: 'disputed', label: 'Citizen Disputed' },
            { id: 'resolved', label: 'Resolved' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <Filter size={13} />
            <span>Filters:</span>
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:border-emerald-600"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical (≥ 75)</option>
            <option value="high">High (50 - 74)</option>
            <option value="medium">Medium (25 - 49)</option>
            <option value="low">Low (&lt; 25)</option>
          </select>

          {/* Department Filter (Locked for Officer) */}
          {isOfficer ? (
            <div className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold flex items-center gap-1.5 text-xs">
              <Building size={12} className="text-emerald-600" />
              <span>Dept: {currentUser?.department_name || officerDept || 'Assigned'}</span>
              <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold">Locked</span>
            </div>
          ) : (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:border-emerald-600"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id || d._id || d.code || d.name} value={d.code || d.name || d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:border-emerald-600"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">New Reports</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">More Info Needed</option>
            <option value="resolved">Resolved</option>
            <option value="disputed">Citizen Disputed</option>
            <option value="closed">Closed / Verified</option>
          </select>

          {/* Assignment Filter */}
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:border-emerald-600"
          >
            <option value="all">All Assignments</option>
            <option value="me">Assigned to Me</option>
            <option value="unassigned">Unassigned / Needs Officer</option>
          </select>

          {/* Repeated Filter */}
          <select
            value={repeatedFilter}
            onChange={(e) => setRepeatedFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:border-emerald-600"
          >
            <option value="all">All Incident Types</option>
            <option value="true">Repeated Problems Only</option>
            <option value="false">Individual Incidents Only</option>
          </select>

          {/* Clear Filter button if filters active */}
          {(priorityFilter !== 'all' || deptFilter !== 'all' || statusFilter !== 'all' || assignedFilter !== 'all' || repeatedFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setPriorityFilter('all')
                setDeptFilter('all')
                setStatusFilter('all')
                setAssignedFilter('all')
                setRepeatedFilter('all')
                setSearchQuery('')
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Queue Table */}
      <section className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw size={20} className="animate-spin text-emerald-600" />
            <span>Loading priority queue from database...</span>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Tracking & Problem</th>
                  <th className="py-3 px-4">Area / Sector</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Assigned Officer</th>
                  <th className="py-3 px-4">Photo Quality</th>
                  <th className="py-3 px-4">Repeated</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => {
                  const score = report.civic_risk_score?.score || 50
                  const isCritical = score >= 75
                  const isHigh = score >= 50 && score < 75
                  const isRepeated = !!report.cluster_id || report.is_duplicate

                  const isResolved = report.status === 'resolved'
                  const isDisputed = report.status === 'disputed'
                  const isClosed = report.status === 'closed'
                  const isAssigned = report.status === 'assigned' || report.status === 'in_progress'

                  const statusClass =
                    isClosed ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    isDisputed ? 'bg-rose-50 text-rose-800 border-rose-200 font-bold' :
                    isResolved ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    isAssigned ? 'bg-blue-50 text-blue-800 border-blue-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'

                  return (
                    <tr key={report.id || report._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Priority Score Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-lg text-xs ${
                          isCritical ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          isHigh ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {score}/100
                        </span>
                      </td>

                      {/* Tracking ID & Problem */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-mono text-[10px] text-slate-400 font-bold block">
                          {report.tracking_id}
                        </span>
                        <Link
                          to={`/gov/reports/${report.tracking_id || report.id || report._id}`}
                          className="font-bold text-slate-900 hover:text-emerald-700 line-clamp-1 transition-colors"
                        >
                          {report.title}
                        </Link>
                      </td>

                      {/* Area / Sector */}
                      <td className="py-3.5 px-4 text-slate-600 max-w-[180px]">
                        <div className="flex items-center gap-1 truncate">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{report.location?.address || report.location?.area || 'Islamabad ICT'}</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-slate-600 max-w-[160px]">
                        <div className="flex items-center gap-1 font-medium truncate">
                          <Building size={12} className="text-emerald-600 shrink-0" />
                          <span className="truncate">{report.department_name || report.department_id || 'CDA Municipal'}</span>
                        </div>
                      </td>

                      {/* Assigned Officer */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {report.assigned_officer_name ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium text-xs bg-slate-100 text-slate-800 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="truncate max-w-[120px]">{report.assigned_officer_name}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-semibold italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Information Quality */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <EvidenceQualityBadge
                          qualityLabel={report.evidence?.quality_label}
                          qualityScore={report.evidence?.quality_score}
                          compact={true}
                        />
                      </td>

                      {/* Repeated */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isRepeated ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Layers size={11} />
                            <span>Cluster Linked</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Single</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusClass}`}>
                          {report.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          to={`/gov/reports/${report.tracking_id || report.id || report._id}`}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors inline-block"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500">
            No reports found matching selected filters.
          </div>
        )}
      </section>
    </div>
  )
}
