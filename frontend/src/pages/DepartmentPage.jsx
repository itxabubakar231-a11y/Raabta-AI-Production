import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Landmark, ShieldAlert, CheckCircle2, Clock, Filter,
  UserCheck, AlertTriangle, ExternalLink, RefreshCw, Send,
  FileCheck, Sparkles, MessageSquare, X
} from 'lucide-react'
import * as api from '../services/api'
import { useAuth } from '../context/AuthContext'
import RiskScoreGauge from '../components/RiskScoreGauge'

export default function DepartmentPage() {
  const { currentUser, role } = useAuth()
  const [queue, setQueue] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDept, setSelectedDept] = useState(currentUser?.department_id || 'all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [minRisk, setMinRisk] = useState('')

  // Resolve Modal state
  const [resolvingReport, setResolvingReport] = useState(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [resolutionImage, setResolutionImage] = useState('')
  const [submittingResolution, setSubmittingResolution] = useState(false)
  const [resolveSuccessMsg, setResolveSuccessMsg] = useState('')

  // Internal Notes Drawer
  const [activeNotesReport, setActiveNotesReport] = useState(null)
  const [newNote, setNewNote] = useState('')
  const [notesList, setNotesList] = useState([])
  const [savingNote, setSavingNote] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const [deptRes, queueRes] = await Promise.all([
        api.getDepartments().catch(() => ({ departments: [] })),
        api.getOperationsQueue({
          department_id: selectedDept === 'all' ? '' : selectedDept,
          status: selectedStatus === 'all' ? '' : selectedStatus,
          min_risk: minRisk
        }).catch(() => ({ queue: [] }))
      ])

      setDepartments(deptRes.departments || [])
      setQueue(queueRes.queue || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedDept, selectedStatus, minRisk])

  async function handleAssignMe(reportId) {
    try {
      await api.assignOfficer(reportId, {
        officer_id: currentUser?.id || currentUser?._id,
        officer_name: currentUser?.full_name || 'Duty Officer'
      })
      loadData()
    } catch (err) {
      alert(err.message || 'Assignment failed')
    }
  }

  async function handleStatusChange(reportId, newStatus) {
    try {
      await api.updateReportStatus(reportId, {
        status: newStatus,
        notes: `Status changed to ${newStatus} by ${currentUser?.full_name || 'Officer'}`
      })
      loadData()
    } catch (err) {
      alert(err.message || 'Status update failed')
    }
  }

  async function handleResolveSubmit(e) {
    e.preventDefault()
    if (!resolutionNotes.trim()) {
      alert('Please enter completion notes describing the repairs completed.')
      return
    }

    setSubmittingResolution(true)
    try {
      const res = await api.resolveReportWithProof(resolvingReport.id || resolvingReport._id, {
        resolution_notes: resolutionNotes,
        resolution_image_url: resolutionImage || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600'
      })
      setResolveSuccessMsg('Report resolved! Citizen has been notified to verify.')
      setTimeout(() => {
        setResolvingReport(null)
        setResolutionNotes('')
        setResolutionImage('')
        setResolveSuccessMsg('')
        loadData()
      }, 1200)
    } catch (err) {
      alert(err.message || 'Failed to submit resolution')
    } finally {
      setSubmittingResolution(false)
    }
  }

  async function openNotesDrawer(rep) {
    setActiveNotesReport(rep)
    try {
      const detail = await api.getReportById(rep.id || rep._id)
      setNotesList(detail?.report?.internal_notes || [])
    } catch {
      setNotesList([])
    }
  }

  async function handleAddNote(e) {
    e.preventDefault()
    if (!newNote.trim()) return
    setSavingNote(true)
    try {
      await api.addInternalNote(activeNotesReport.id || activeNotesReport._id, {
        note: newNote,
        is_private: true
      })
      setNewNote('')
      // Refresh notes list
      const detail = await api.getReportById(activeNotesReport.id || activeNotesReport._id)
      setNotesList(detail?.report?.internal_notes || [])
    } catch (err) {
      alert(err.message || 'Failed to add note')
    } finally {
      setSavingNote(false)
    }
  }

  // Calculate metrics
  const totalCount = queue.length
  const criticalCount = queue.filter(r => (r.civic_risk_score?.score ?? 0) >= 75).length
  const disputedCount = queue.filter(r => r.status === 'disputed').length
  const assignedToMe = queue.filter(r => r.assigned_to === currentUser?.id || r.assigned_to === currentUser?._id).length

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Role Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel border-slate-800 bg-slate-900/60 p-6">
        <div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5">
            <Landmark size={14} />
            <span>Operations Command Center</span>
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight mt-2">
            Civic Operations & Dispatch Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic risk-ranked triage, rapid municipal dispatch, and resolution verification enforcement.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-400' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow">
          <span className="text-slate-400 font-semibold">Active In Queue</span>
          <p className="text-2xl font-black text-white mt-1">{totalCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 shadow">
          <span className="text-red-300 font-semibold flex items-center gap-1">
            <ShieldAlert size={14} />
            <span>Critical Risks (75+)</span>
          </span>
          <p className="text-2xl font-black text-red-400 mt-1">{criticalCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 shadow">
          <span className="text-amber-300 font-semibold flex items-center gap-1">
            <AlertTriangle size={14} />
            <span>Disputed / Escalated</span>
          </span>
          <p className="text-2xl font-black text-amber-400 mt-1">{disputedCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow">
          <span className="text-slate-400 font-semibold">Assigned To Me</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{assignedToMe}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
            <Filter size={14} />
            <span>Filters:</span>
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} — {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Active Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="in_review">In Review</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved (Verification Pending)</option>
            <option value="disputed">Disputed / Escalated</option>
          </select>

          {/* Risk Filter */}
          <select
            value={minRisk}
            onChange={(e) => setMinRisk(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Risk Levels</option>
            <option value="75">Critical Risks Only (Score ≥ 75)</option>
            <option value="50">High & Critical (Score ≥ 50)</option>
          </select>
        </div>

        <span className="text-slate-400 text-xs">
          Showing <strong>{queue.length}</strong> prioritized incidents
        </span>
      </div>

      {/* Risk-First Queue List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <RefreshCw size={20} className="animate-spin text-emerald-400" />
            <span>Loading operations queue...</span>
          </div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
            No incidents matching filter criteria. All clear!
          </div>
        ) : (
          queue.map((rep) => {
            const risk = rep.civic_risk_score || {}
            const isAssignedToMe = rep.assigned_to === currentUser?.id || rep.assigned_to === currentUser?._id
            const isCritical = (risk.score ?? 0) >= 75

            return (
              <div
                key={rep.id || rep._id}
                className={`p-5 rounded-2xl border transition-all ${
                  rep.status === 'disputed'
                    ? 'border-red-500/50 bg-red-950/10'
                    : isCritical
                    ? 'border-red-500/30 bg-slate-900/90'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                        {rep.tracking_id}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                        {rep.status}
                      </span>
                      {rep.cluster_id && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          PROXIMITY CLUSTER LINKED
                        </span>
                      )}
                      {rep.is_escalated && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                          PRIORITY ESCALATED
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white leading-tight">
                      {rep.title}
                    </h3>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {rep.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span>Agency: <strong className="text-slate-200">{rep.department_name || rep.department_id}</strong></span>
                      <span>Location: <strong className="text-slate-200">{rep.location?.address || rep.location?.city || 'Coordinates'}</strong></span>
                      <span>Assigned: <strong className="text-slate-200">{rep.assigned_officer_name || 'Unassigned'}</strong></span>
                    </div>
                  </div>

                  {/* Right: Risk Gauge & Action Center */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[240px]">
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Risk Score</span>
                        <span className={`text-sm font-black ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
                          {risk.score ?? 50}/100 ({risk.level || 'MEDIUM'})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        SLA: <strong className="text-slate-200">{risk.recommended_sla_hours || 48}h Target</strong>
                      </div>
                    </div>

                    {/* Officer Actions */}
                    <div className="flex flex-wrap gap-2">
                      {!rep.assigned_to && (
                        <button
                          type="button"
                          onClick={() => handleAssignMe(rep.id || rep._id)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow transition-colors"
                        >
                          <UserCheck size={13} />
                          <span>Assign to Me</span>
                        </button>
                      )}

                      {rep.status !== 'resolved' && rep.status !== 'closed' && (
                        <button
                          type="button"
                          onClick={() => setResolvingReport(rep)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow transition-colors"
                        >
                          <FileCheck size={13} />
                          <span>Resolve with Proof</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openNotesDrawer(rep)}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                        title="Internal Officer Notes"
                      >
                        <MessageSquare size={13} />
                        <span>Notes</span>
                      </button>

                      <Link
                        to={`/report/${rep.id || rep._id}`}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                        title="Full Dossier & PDF"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Resolve Issue Modal */}
      {resolvingReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck size={20} className="text-emerald-400" />
                <h3 className="text-base font-bold text-white">Submit Field Resolution</h3>
              </div>
              <button
                type="button"
                onClick={() => setResolvingReport(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Reporting resolution for: <strong className="text-white">{resolvingReport.tracking_id}</strong> — {resolvingReport.title}
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Officer Completion Notes (Required)
                </label>
                <textarea
                  required
                  placeholder="Detail the technical rectification performed (e.g. replaced 11kV conductor, compacted pothole, cleared drain)..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Field Proof Photo URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={resolutionImage}
                  onChange={(e) => setResolutionImage(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400">
                  AI will cross-verify this photo against original citizen evidence before prompting citizen for confirmation.
                </span>
              </div>

              {resolveSuccessMsg && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                  {resolveSuccessMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingReport(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResolution}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow"
                >
                  <Sparkles size={14} />
                  <span>{submittingResolution ? 'Verifying & Submitting...' : 'Submit Resolution Proof'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Internal Notes Drawer */}
      {activeNotesReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 h-full flex flex-col justify-between shadow-2xl">
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Internal Department Notes</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveNotesReport(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="text-xs text-slate-400">
                Case: <strong className="text-slate-200">{activeNotesReport.tracking_id}</strong>
              </div>

              {/* Notes List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {notesList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-8">
                    No internal notes yet. Use the form below to collaborate with dispatch staff.
                  </p>
                ) : (
                  notesList.map((n) => (
                    <div key={n.id || n._id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-bold text-slate-300">{n.officer_name || 'Officer'}</span>
                        <span>{n.created_at ? new Date(n.created_at).toLocaleTimeString() : ''}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{n.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Note Input */}
            <form onSubmit={handleAddNote} className="pt-4 border-t border-slate-800 space-y-2">
              <textarea
                placeholder="Write private operational note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                rows={2}
              />
              <button
                type="submit"
                disabled={savingNote}
                className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send size={13} />
                <span>{savingNote ? 'Saving...' : 'Post Internal Note'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
