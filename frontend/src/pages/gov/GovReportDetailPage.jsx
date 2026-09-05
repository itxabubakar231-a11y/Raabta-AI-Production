import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Building, MapPin, Calendar, Shield, Clock,
  CheckCircle2, AlertTriangle, MessageSquare, Sparkles,
  Volume2, RefreshCw, Download, FileText, UserCheck, Edit3, X, Camera
} from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import * as api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import RiskScoreGauge from '../../components/RiskScoreGauge'
import EvidenceQualityBadge from '../../components/EvidenceQualityBadge'
import TimelineView from '../../components/TimelineView'

export default function GovReportDetailPage() {
  const { id } = useParams()
  const { currentUser, role } = useAuth()

  const [report, setReport] = useState(null)
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modals & Drawers
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [overrideDept, setOverrideDept] = useState('')
  const [overrideSeverity, setOverrideSeverity] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideSubmitting, setOverrideSubmitting] = useState(false)
  const [overrideError, setOverrideError] = useState('')

  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false)
  const [requestInfoNote, setRequestInfoNote] = useState('')
  const [requestInfoSubmitting, setRequestInfoSubmitting] = useState(false)

  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [afterImageUrl, setAfterImageUrl] = useState('')
  const [resolveSubmitting, setResolveSubmitting] = useState(false)

  // Internal Notes
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  async function loadData() {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [repRes, deptRes, notesRes] = await Promise.all([
        api.getReportById(id),
        api.getDepartments().catch(() => ({ departments: [] })),
        api.getInternalNotes(id).catch(() => ({ notes: [] }))
      ])

      if (repRes && repRes.report) {
        setReport(repRes.report)
        setOverrideDept(repRes.report.department_id || '')
        setOverrideSeverity(repRes.report.severity || 'HIGH')
      } else {
        setError('Report could not be found.')
      }
      setDepartments(deptRes.departments || [])
      setNotes(notesRes.notes || [])
    } catch (err) {
      setError(err.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  // Officer Actions
  async function handleAssignOfficer(officerId, officerName) {
    try {
      await api.assignOfficer(report.id || report._id, {
        officer_id: officerId,
        officer_name: officerName
      })
      await loadData()
    } catch (err) {
      alert(err.message || 'Assignment failed')
    }
  }

  async function handleStatusUpdate(newStatus) {
    try {
      await api.updateReportStatus(report.id || report._id, {
        status: newStatus,
        notes: `Duty Officer updated status to ${newStatus}`
      })
      await loadData()
    } catch (err) {
      alert(err.message || 'Status update failed')
    }
  }

  async function handleOverrideSubmit(e) {
    e.preventDefault()
    if (!overrideReason.trim()) {
      setOverrideError('A clear justification reason is mandatory when overriding AI assessments.')
      return
    }

    setOverrideSubmitting(true)
    setOverrideError('')
    try {
      await api.overrideReport(report.id || report._id, {
        department_id: overrideDept,
        severity: overrideSeverity,
        reason: overrideReason
      })
      setShowOverrideModal(false)
      setOverrideReason('')
      await loadData()
    } catch (err) {
      setOverrideError(err.message || 'Override failed')
    } finally {
      setOverrideSubmitting(false)
    }
  }

  async function handleRequestInfoSubmit(e) {
    e.preventDefault()
    if (!requestInfoNote.trim()) {
      alert('Please enter a note explaining what information the citizen should provide.')
      return
    }

    setRequestInfoSubmitting(true)
    try {
      await api.requestMoreInfo(report.id || report._id, {
        note: requestInfoNote
      })
      setShowRequestInfoModal(false)
      setRequestInfoNote('')
      await loadData()
    } catch (err) {
      alert(err.message || 'Request failed')
    } finally {
      setRequestInfoSubmitting(false)
    }
  }

  async function handleResolveSubmit(e) {
    e.preventDefault()
    if (!resolutionNotes.trim()) {
      alert('Please describe the field repairs completed.')
      return
    }

    setResolveSubmitting(true)
    try {
      await api.resolveReportWithProof(report.id || report._id, {
        resolution_notes: resolutionNotes,
        resolution_image_url: afterImageUrl || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600'
      })
      setShowResolveModal(false)
      setResolutionNotes('')
      setAfterImageUrl('')
      await loadData()
    } catch (err) {
      alert(err.message || 'Resolution submission failed')
    } finally {
      setResolveSubmitting(false)
    }
  }

  async function handleAddNote(e) {
    e.preventDefault()
    if (!newNote.trim()) return

    setAddingNote(true)
    try {
      await api.addInternalNote(report.id || report._id, {
        note: newNote,
        author: currentUser?.full_name || 'Duty Officer'
      })
      setNewNote('')
      const res = await api.getInternalNotes(report.id || report._id)
      setNotes(res.notes || [])
    } catch (err) {
      alert(err.message || 'Failed to add note')
    } finally {
      setAddingNote(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
        <RefreshCw size={24} className="animate-spin text-emerald-600" />
        <span>Retrieving case file from database...</span>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        <div className="inline-flex p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Report Not Found</h3>
        <p className="text-xs text-slate-500">{error || 'Please check the Tracking ID.'}</p>
        <Link
          to="/gov/queue"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold hover:bg-slate-200 border border-slate-200 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Attention Queue</span>
        </Link>
      </div>
    )
  }

  const loc = report.location || {}
  const hasCoordinates = loc.latitude && loc.longitude && !isNaN(parseFloat(loc.latitude)) && !isNaN(parseFloat(loc.longitude))
  const lat = hasCoordinates ? parseFloat(loc.latitude) : 33.6844
  const lon = hasCoordinates ? parseFloat(loc.longitude) : 73.0479

  const isResolved = report.status === 'resolved'
  const isClosed = report.status === 'closed'
  const isDisputed = report.status === 'disputed'
  const risk = report.civic_risk_score || {}

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/gov/queue"
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Attention Queue</span>
        </Link>

        {/* Officer Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!report.assigned_officer_id && (
            <button
              type="button"
              onClick={() => handleAssignOfficer(currentUser?.id || currentUser?._id, currentUser?.full_name || 'Duty Officer')}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 shadow-xs transition-colors flex items-center gap-1.5"
            >
              <UserCheck size={14} />
              <span>Assign to Me</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowOverrideModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Edit3 size={14} />
            <span>Override AI Assessment</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRequestInfoModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Clock size={14} />
            <span>Request Info</span>
          </button>

          {!['resolved', 'closed'].includes(report.status) && (
            <button
              type="button"
              onClick={() => setShowResolveModal(true)}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              <span>Mark Resolved</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Report Header Card */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-bold text-emerald-800 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200">
                {report.tracking_id}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                {report.status}
              </span>
              {report.cluster_id && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                  <span>Proximity Cluster Linked (&lt; 250m)</span>
                </span>
              )}
            </div>
            <h1 className="text-xl font-black text-slate-900 pt-1">{report.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <EvidenceQualityBadge
              qualityLabel={report.evidence?.quality_label}
              qualityScore={report.evidence?.quality_score}
              reason={report.evidence?.quality_reason}
            />
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
              <Building size={14} className="text-emerald-600" />
              <span>Routing Department</span>
            </div>
            <p className="font-bold text-slate-900 truncate">
              {report.department_name || report.department_id || 'CDA Municipal'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
              <MapPin size={14} className="text-emerald-600" />
              <span>Reported Location</span>
            </div>
            <p className="font-bold text-slate-900 truncate" title={loc.address || loc.city}>
              {loc.address || loc.city || 'Islamabad ICT'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
              <Calendar size={14} className="text-emerald-600" />
              <span>Submitted Time</span>
            </div>
            <p className="font-bold text-slate-900">
              {report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
              <Shield size={14} className="text-emerald-600" />
              <span>Assigned Officer</span>
            </div>
            <p className="font-bold text-slate-900 truncate">
              {report.assigned_officer_name || 'Unassigned'}
            </p>
          </div>
        </div>

        {/* AI Language Rule Banner */}
        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-900 font-bold">
            <Sparkles size={16} className="text-indigo-600" />
            <span>AI Assessment & Recommendation</span>
          </div>
          <p className="text-indigo-950 leading-relaxed">
            <strong>AI recommends:</strong> Routing this incident to <strong>{report.department_name || 'CDA Roads'}</strong> with a severity estimation of <strong>{report.severity || 'HIGH'}</strong>. Note: Final authority rests entirely with the duty officer; you may override this recommendation with justification below.
          </p>
        </div>

        {/* Citizen Statement */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
            Citizen Problem Description
          </span>
          <p className="text-slate-800 leading-relaxed whitespace-pre-line text-sm">
            {report.description}
          </p>
        </div>

        {/* Voice Note Audio & Transcript if present */}
        {report.evidence?.transcript && (
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <Volume2 size={16} className="text-emerald-600" />
              <span>Voice Note Audio Transcript</span>
            </div>
            <p className="text-slate-700 italic bg-white p-3 rounded-xl border border-emerald-100">
              "{report.evidence.transcript}"
            </p>
          </div>
        )}
      </section>

      {/* Two Column Layout: Risk & Map vs Timeline & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Risk & Location */}
        <div className="lg:col-span-1 space-y-6">
          <RiskScoreGauge riskData={report.civic_risk_score} />

          {/* Photo Evidence */}
          {report.evidence?.image_url && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Field Photo Evidence
              </h4>
              <img
                src={report.evidence.image_url}
                alt="Problem Evidence"
                className="w-full h-48 object-cover rounded-xl border border-slate-200 shadow-xs"
              />
            </div>
          )}

          {/* Location Map */}
          {hasCoordinates && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Geospatial Coordinates
              </h4>
              <div className="h-44 rounded-xl overflow-hidden border border-slate-200">
                <MapContainer
                  center={[lat, lon]}
                  zoom={15}
                  scrollWheelZoom={false}
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  <CircleMarker
                    center={[lat, lon]}
                    radius={10}
                    pathOptions={{
                      fillColor: '#16a34a',
                      color: '#14532d',
                      weight: 2,
                      fillOpacity: 0.8
                    }}
                  >
                    <Popup>
                      <div className="text-xs">
                        <strong>{report.title}</strong>
                        <p className="text-[11px] text-slate-600 mt-0.5">{loc.address}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                </MapContainer>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Workflow, Notes & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Quick Update */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Operational Status Workflow
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {['assigned', 'in_progress', 'in_review'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusUpdate(st)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    report.status === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Mark as {st.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Internal Notes Section (Private to Government) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={14} className="text-emerald-600" />
              <span>Private Internal Notes (Confidential)</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Notes recorded here are private to municipal staff and are never exposed to citizens.
            </p>

            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add confidential field observation, work order reference, or team directive..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none"
                rows={2}
              />
              <button
                type="submit"
                disabled={addingNote || !newNote.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs disabled:opacity-50 transition-colors"
              >
                {addingNote ? 'Saving Note...' : 'Save Internal Note'}
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-100 max-h-48 overflow-y-auto">
              {notes.length > 0 ? (
                notes.map((n, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <strong className="text-slate-700">{n.author || 'Officer'}</strong>
                      <span>{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</span>
                    </div>
                    <p className="text-slate-700">{n.note}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No internal notes added yet.</p>
              )}
            </div>
          </div>

          {/* Official Timeline & Audit Log */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-4 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-emerald-600" />
              <span>Official Lifecycle & Audit Trail</span>
            </h4>
            <TimelineView timeline={report.timeline} currentStatus={report.status} />
          </div>
        </div>
      </div>

      {/* Override AI Modal (Mandatory Reason Required) */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit3 size={18} className="text-emerald-600" />
                <span>Override AI Assessment</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Every officer override is logged in the permanent audit trail as <code>OFFICER_OVERRIDE</code> with your mandatory justification.
            </p>

            <form onSubmit={handleOverrideSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reassign Department:</label>
                <select
                  value={overrideDept}
                  onChange={(e) => setOverrideDept(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id || d._id || d.name} value={d.id || d._id || d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Override Severity:</label>
                <select
                  value={overrideSeverity}
                  onChange={(e) => setOverrideSeverity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mandatory Justification Reason <span className="text-rose-600">*</span>:
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why the department or severity is being overridden..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none"
                  rows={3}
                  required
                />
              </div>

              {overrideError && (
                <p className="text-xs text-rose-600 font-semibold">{overrideError}</p>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={overrideSubmitting}
                  className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
                >
                  {overrideSubmitting ? 'Saving Override...' : 'Confirm Override'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Information Modal */}
      {showRequestInfoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Clock size={18} className="text-amber-600" />
                <span>Request Additional Information</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRequestInfoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              This will notify the citizen and place the report into <code>waiting_for_citizen</code> status.
            </p>

            <form onSubmit={handleRequestInfoSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  What additional information or clarification is needed? <span className="text-rose-600">*</span>:
                </label>
                <textarea
                  value={requestInfoNote}
                  onChange={(e) => setRequestInfoNote(e.target.value)}
                  placeholder="e.g. Please provide the nearest pole number or house number..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none"
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={requestInfoSubmitting}
                  className="flex-1 py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
                >
                  {requestInfoSubmitting ? 'Sending Request...' : 'Send Request to Citizen'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestInfoModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Resolved Modal with After-Photo Proof */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>Mark Problem as Resolved</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Submitting completion proof will change status to <code>resolved</code> and automatically notify the citizen for final physical inspection and confirmation.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Field Completion Notes <span className="text-rose-600">*</span>:
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe the asphalt patch applied, transformer repaired, or waste cleared..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Camera size={13} className="text-emerald-600" />
                  <span>After-Photo Proof URL (Optional):</span>
                </label>
                <input
                  type="url"
                  value={afterImageUrl}
                  onChange={(e) => setAfterImageUrl(e.target.value)}
                  placeholder="https://example.com/repaired_road.jpg"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={resolveSubmitting}
                  className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
                >
                  {resolveSubmitting ? 'Resolving...' : 'Submit Resolution Proof'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
