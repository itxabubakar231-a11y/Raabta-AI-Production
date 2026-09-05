import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Building, MapPin, Calendar, Shield, Clock,
  CheckCircle2, AlertTriangle, MessageSquare, Sparkles,
  Volume2, RefreshCw, Download, FileText, UserCheck, Edit3, X, Camera, HelpCircle, ShieldAlert
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
  const [errorType, setErrorType] = useState('')

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

  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignDept, setAssignDept] = useState('')
  const [assignOfficerId, setAssignOfficerId] = useState('')
  const [assignOfficerName, setAssignOfficerName] = useState('')
  const [assignReason, setAssignReason] = useState('')
  const [assignSubmitting, setAssignSubmitting] = useState(false)
  const [assignError, setAssignError] = useState('')
  const [officers, setOfficers] = useState([])

  // Resolve Modal & Proof File Upload
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [afterImageUrl, setAfterImageUrl] = useState('')
  const [afterImageBase64, setAfterImageBase64] = useState('')
  const [resolveSubmitting, setResolveSubmitting] = useState(false)
  const [resolveError, setResolveError] = useState('')

  // Internal Notes
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  async function loadData() {
    if (!id) return
    setLoading(true)
    setError('')
    setErrorType('')
    try {
      const [repRes, deptRes, notesRes, officersRes] = await Promise.all([
        api.getReportById(id),
        api.getDepartments().catch(() => ({ departments: [] })),
        api.getInternalNotes(id).catch(() => ({ notes: [] })),
        api.getOfficers().catch(() => ({ officers: [] }))
      ])

      if (repRes && repRes.report) {
        setReport(repRes.report)
        setOverrideDept(repRes.report.department_id || '')
        setOverrideSeverity(repRes.report.severity || 'HIGH')
        setAssignDept(repRes.report.department_id || '')
        setAssignOfficerId(repRes.report.assigned_officer_id || '')
        setAssignOfficerName(repRes.report.assigned_officer_name || '')
      } else {
        setErrorType('not_found')
        setError(`No report record was found matching ID "${id}".`)
      }
      setDepartments(deptRes.departments || [])
      setNotes(notesRes.notes || [])
      setOfficers(officersRes.officers || [])
    } catch (err) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('forbidden') || msg.includes('403')) {
        setErrorType('unauthorized')
        setError(msg || 'You do not have authorization to view this departmental report.')
      } else if (msg.toLowerCase().includes('not found') || msg.includes('404')) {
        setErrorType('not_found')
        setError(`No report record was found matching tracking ID or record ID "${id}".`)
      } else {
        setErrorType('network')
        setError(msg || 'Failed to communicate with database server. Please verify backend status.')
      }
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
        officer_name: officerName,
        department_id: report.department_id,
        department_name: report.department_name,
        reason: 'Direct assignment by duty officer'
      })
      await loadData()
    } catch (err) {
      alert(err.message || 'Assignment failed')
    }
  }

  async function handleAssignSubmit(e) {
    e.preventDefault()
    if (!assignOfficerId) {
      setAssignError('Please select a duty officer.')
      return
    }
    const selectedOfficer = officers.find(o => String(o.id) === String(assignOfficerId) || String(o._id) === String(assignOfficerId))
    const finalOfficerName = selectedOfficer ? selectedOfficer.full_name : assignOfficerName
    const selectedDept = departments.find(d => d.id === assignDept || d.code === assignDept)
    const deptName = selectedDept ? selectedDept.name : assignDept

    setAssignSubmitting(true)
    setAssignError('')
    try {
      await api.assignOfficer(report.id || report._id, {
        officer_id: assignOfficerId,
        officer_name: finalOfficerName,
        department_id: assignDept,
        department_name: deptName,
        reason: assignReason || 'Officer reassignment'
      })
      setShowAssignModal(false)
      setAssignReason('')
      await loadData()
    } catch (err) {
      setAssignError(err.message || 'Assignment failed')
    } finally {
      setAssignSubmitting(false)
    }
  }

  function handleAfterImageFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP).')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setAfterImageBase64(reader.result)
    }
    reader.readAsDataURL(file)
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
      setResolveError('Field completion notes are mandatory.')
      return
    }

    setResolveSubmitting(true)
    setResolveError('')
    try {
      await api.resolveReportWithProof(report.id || report._id, {
        resolution_notes: resolutionNotes.trim(),
        resolution_image_url: afterImageUrl.trim(),
        resolution_image_base64: afterImageBase64
      })
      setShowResolveModal(false)
      setResolutionNotes('')
      setAfterImageUrl('')
      setAfterImageBase64('')
      await loadData()
    } catch (err) {
      setResolveError(err.message || 'Resolution submission failed')
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
    const isUnauth = errorType === 'unauthorized'
    const isNetwork = errorType === 'network'

    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        <div className={`inline-flex p-3 rounded-2xl ${
          isUnauth ? 'bg-amber-50 text-amber-600 border border-amber-200' :
          isNetwork ? 'bg-blue-50 text-blue-600 border border-blue-200' :
          'bg-rose-50 text-rose-600 border border-rose-200'
        }`}>
          {isUnauth ? <ShieldAlert size={32} /> : isNetwork ? <RefreshCw size={32} /> : <AlertTriangle size={32} />}
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          {isUnauth ? 'Access Restricted' : isNetwork ? 'Unable to Load Case File' : 'Report Not Found'}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          {error || 'The requested civic report could not be retrieved from the database.'}
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          {isNetwork && (
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Retry Loading</span>
            </button>
          )}
          <Link
            to="/gov/queue"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Queue</span>
          </Link>
        </div>
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
            onClick={() => {
              setAssignDept(report.department_id || '')
              setAssignOfficerId(report.assigned_officer_id || '')
              setAssignOfficerName(report.assigned_officer_name || '')
              setShowAssignModal(true)
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <UserCheck size={14} />
            <span>{report.assigned_officer_id ? 'Reassign Officer' : 'Assign Officer'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOverrideModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Edit3 size={14} />
            <span>Override AI</span>
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
        {(report.evidence?.transcript || report.evidence?.audio_base64 || report.evidence?.audio_url) && (
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <Volume2 size={16} className="text-emerald-600" />
              <span>Voice Note Audio Recording</span>
            </div>
            {report.evidence?.transcript && (
              <p className="text-slate-700 italic bg-white p-3 rounded-xl border border-emerald-100">
                "{report.evidence.transcript}"
              </p>
            )}
            {(report.evidence?.audio_base64 || report.evidence?.audio_url) && (
              <audio
                controls
                src={report.evidence.audio_base64 || report.evidence.audio_url}
                className="w-full mt-2"
              />
            )}
          </div>
        )}

        {/* Citizen Clarifications & Follow-up Information */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <HelpCircle size={15} className="text-emerald-600" />
            <span>Clarifying Questions & Follow-up Information</span>
          </div>

          {report.missing_information_answers && report.missing_information_answers.length > 0 ? (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] text-slate-500">
                The citizen provided the following clarifications during initial triage:
              </p>
              {report.missing_information_answers.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5">
                  <p className="font-semibold text-slate-700">Q: {item.question}</p>
                  <p className="font-bold text-emerald-800 pl-2 border-l-2 border-emerald-500">
                    A: {item.answer}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic">
              No additional information was required.
            </p>
          )}

          {/* Pending Officer Request Status */}
          {report.needs_citizen_response && report.citizen_info_request && (
            <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <Clock size={14} />
                <span>Awaiting Citizen Response to Information Request</span>
              </div>
              <p className="text-[11px] italic bg-white/70 p-2 rounded border border-amber-200">
                "{report.citizen_info_request.note}"
              </p>
              <p className="text-[10px] text-amber-700">
                Requested by {report.citizen_info_request.requested_by || 'Officer'}
                {report.citizen_info_request.requested_at && ` on ${new Date(report.citizen_info_request.requested_at).toLocaleString()}`}
              </p>
            </div>
          )}

          {/* Citizen Responses to Officer */}
          {report.citizen_responses && report.citizen_responses.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 block">
                Citizen Responses Received:
              </span>
              {report.citizen_responses.map((cr, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs">
                  <p className="text-slate-800 font-medium">{cr.response || cr.note || JSON.stringify(cr)}</p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {cr.created_at ? new Date(cr.created_at).toLocaleString() : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Resolution & Verification Proof Card */}
      {(report.resolution || ['resolved', 'closed', 'disputed'].includes(report.status)) && (
        <section className={`p-6 rounded-2xl border shadow-xs space-y-4 ${
          report.status === 'disputed'
            ? 'bg-rose-50/70 border-rose-200'
            : report.status === 'closed'
            ? 'bg-emerald-50/70 border-emerald-200'
            : 'bg-amber-50/70 border-amber-200'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
            <div className="flex items-center gap-2">
              {report.status === 'disputed' ? (
                <AlertTriangle size={20} className="text-rose-600 shrink-0" />
              ) : report.status === 'closed' ? (
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              ) : (
                <Clock size={20} className="text-amber-600 shrink-0" />
              )}
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  {report.status === 'disputed'
                    ? 'Citizen Disputed Resolution — Action Required'
                    : report.status === 'closed'
                    ? 'Resolution Inspected & Verified by Citizen'
                    : 'Field Work Completed — Awaiting Citizen Verification'}
                </h3>
                <p className="text-xs text-slate-600">
                  {report.status === 'disputed'
                    ? 'The reporting citizen disputed field completion. Review feedback below and dispatch follow-up crew.'
                    : report.status === 'closed'
                    ? 'Citizen verified and accepted field work. Case is successfully concluded.'
                    : 'Duty Officer logged resolution proof. Citizen notification sent for physical on-site inspection.'}
                </p>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              report.status === 'disputed'
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : report.status === 'closed'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {report.status}
            </span>
          </div>

          {/* Before & After Photo Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before Photo */}
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 block">
                Original Incident Photo (Before)
              </span>
              {report.evidence?.image_base64 || report.evidence?.image_url ? (
                <img
                  src={report.evidence.image_base64 || report.evidence.image_url}
                  alt="Citizen Incident Photo (Before)"
                  className="w-full h-48 object-cover rounded-lg border border-slate-200"
                />
              ) : (
                <div className="w-full h-48 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs italic">
                  No initial photo attached
                </div>
              )}
            </div>

            {/* After Photo */}
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
              <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-700 block">
                Field Completion Proof (After)
              </span>
              {report.resolution?.after_image_base64 || report.resolution?.after_image_url ? (
                <img
                  src={report.resolution.after_image_base64 || report.resolution.after_image_url}
                  alt="Resolution Proof (After)"
                  className="w-full h-48 object-cover rounded-lg border border-emerald-200"
                />
              ) : (
                <div className="w-full h-48 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs italic">
                  No completion photo attached
                </div>
              )}
            </div>
          </div>

          {/* Resolution Notes & Metadata */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500">
              <span>
                <strong>Resolved By:</strong> {report.resolution?.resolved_by || report.assigned_officer_name || 'Duty Officer'}
              </span>
              <span>
                <strong>Timestamp:</strong> {report.resolution?.resolved_at ? new Date(report.resolution.resolved_at).toLocaleString() : 'Recent'}
              </span>
            </div>
            {report.resolution?.resolution_notes && (
              <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed font-medium">
                "{report.resolution.resolution_notes}"
              </p>
            )}
          </div>

          {/* Citizen Verification Feedback if any */}
          {report.citizen_verification && (
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                Citizen Inspection Feedback & Rating
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900">
                  Status: {report.citizen_verification.status === 'closed' ? 'Verified & Approved' : 'Disputed'}
                </span>
                {report.citizen_verification.rating && (
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                    {report.citizen_verification.rating} / 5 Stars
                  </span>
                )}
                {report.citizen_verification.verified_at && (
                  <span className="text-[11px] text-slate-400">
                    on {new Date(report.citizen_verification.verified_at).toLocaleString()}
                  </span>
                )}
              </div>
              {report.citizen_verification.feedback && (
                <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  "{report.citizen_verification.feedback}"
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Two Column Layout: Risk & Map vs Timeline & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Risk & Location */}
        <div className="lg:col-span-1 space-y-6">
          <RiskScoreGauge riskData={report.civic_risk_score} />

          {/* Photo Evidence */}
          {(report.evidence?.image_url || report.evidence?.image_base64) && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Field Photo Evidence
              </h4>
              <img
                src={report.evidence.image_base64 || report.evidence.image_url}
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

      {/* Assign / Reassign Officer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserCheck size={18} className="text-indigo-600" />
                <span>{report.assigned_officer_id ? 'Reassign Duty Officer' : 'Assign Duty Officer'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {assignError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {assignError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Department:
                </label>
                <select
                  value={assignDept}
                  onChange={(e) => {
                    setAssignDept(e.target.value)
                    setAssignOfficerId('')
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none font-semibold text-slate-800"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id || d._id || d.code} value={d.id || d.code}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Duty Officer <span className="text-rose-600">*</span>:
                </label>
                <select
                  value={assignOfficerId}
                  onChange={(e) => {
                    setAssignOfficerId(e.target.value)
                    const off = officers.find(o => String(o.id) === e.target.value || String(o._id) === e.target.value)
                    if (off) setAssignOfficerName(off.full_name)
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none font-semibold text-slate-800"
                  required
                >
                  <option value="">Select Duty Officer</option>
                  {officers
                    .filter((off) => !assignDept || off.department_id === assignDept || off.department_code === assignDept)
                    .map((off) => (
                      <option key={off.id || off._id} value={off.id || off._id}>
                        {off.full_name} ({off.role_title || off.role || 'Officer'}) - {off.email}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Handover Reason / Instructions <span className="text-rose-600">*</span>:
                </label>
                <textarea
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  placeholder="Explain why this case is assigned or reassigned to this officer..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none"
                  rows={2}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
                >
                  {assignSubmitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Resolved Modal with Real Photo Upload Proof */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
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
              Submitting completion proof changes report status to <code>resolved</code> and automatically requests physical on-site inspection from the reporting citizen.
            </p>

            {resolveError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {resolveError}
              </div>
            )}

            <form onSubmit={handleResolveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Field Completion Notes <span className="text-rose-600">*</span>:
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe the physical repairs completed on site (e.g. patched asphalt with 50mm bitumen layer, replaced 25kVA transformer fuse, cleared 3 tons of debris)..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none"
                  rows={3}
                  required
                />
              </div>

              {/* Resolution Image Upload / URL */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Camera size={13} className="text-emerald-600" />
                  <span>After-Photo Proof (Field Completion Evidence):</span>
                </label>

                {afterImageBase64 ? (
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden group">
                    <img
                      src={afterImageBase64}
                      alt="Resolution Proof Preview"
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setAfterImageBase64('')}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-xs flex items-center gap-1"
                    >
                      <X size={14} />
                      <span>Remove</span>
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 text-center transition-colors bg-slate-50">
                    <input
                      type="file"
                      id="after-photo-file"
                      accept="image/*"
                      onChange={handleAfterImageFile}
                      className="hidden"
                    />
                    <label htmlFor="after-photo-file" className="cursor-pointer flex flex-col items-center gap-1">
                      <Camera size={22} className="text-slate-400" />
                      <span className="font-bold text-slate-700">Upload Field Completion Photo</span>
                      <span className="text-[10px] text-slate-400">PNG, JPG, WEBP</span>
                    </label>
                  </div>
                )}

                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 block mb-1">Or enter image URL:</span>
                  <input
                    type="url"
                    value={afterImageUrl}
                    onChange={(e) => setAfterImageUrl(e.target.value)}
                    placeholder="https://example.com/repaired_site.jpg"
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={resolveSubmitting}
                  className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
                >
                  {resolveSubmitting ? 'Submitting Proof...' : 'Submit Resolution Proof'}
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
