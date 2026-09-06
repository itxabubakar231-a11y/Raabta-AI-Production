import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  FileText, Download, ArrowLeft, MapPin, Calendar, Building,
  Shield, AlertTriangle, CheckCircle, ExternalLink, RefreshCw, Volume2, Sparkles, Navigation,
  HelpCircle, MessageSquare, Clock, Send, ShieldAlert
} from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import * as api from '../services/api'
import RiskScoreGauge from '../components/RiskScoreGauge'
import EvidenceQualityBadge from '../components/EvidenceQualityBadge'
import ResolutionCard from '../components/ResolutionCard'
import TimelineView from '../components/TimelineView'

export default function ReportDetailPage() {
  const params = useParams()
  const [searchParams] = useSearchParams()
  const rawId = params.id || params.reportId || params.trackingId || searchParams.get('id') || searchParams.get('tracking_id') || ''
  const reportId = decodeURIComponent(String(rawId).trim())

  const [report, setReport] = useState(null)
  const [viewState, setViewState] = useState('loading') // 'loading' | 'success' | 'notFound' | 'forbidden' | 'serverError' | 'networkError'
  const [error, setError] = useState('')

  // Officer Request-Info Response State
  const [officerReply, setOfficerReply] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [replySuccess, setReplySuccess] = useState('')
  const [replyError, setReplyError] = useState('')

  const isCurrentRef = useRef(true)

  async function loadReport() {
    if (!reportId) {
      setViewState('notFound')
      setError('No tracking ID provided.')
      return
    }

    setViewState('loading')
    setError('')
    try {
      const res = await api.getReportById(reportId)
      if (!isCurrentRef.current) return

      if (res && res.report) {
        setReport(res.report)
        setViewState('success')
      } else {
        setViewState('notFound')
        setError('Report could not be found.')
      }
    } catch (err) {
      if (!isCurrentRef.current) return
      const status = err.status || (err.data && err.data.status)
      const msg = err.message || ''
      const lower = msg.toLowerCase()

      if (status === 403 || lower.includes('403') || lower.includes('forbidden')) {
        setViewState('forbidden')
        setError(msg || 'You do not have permission to view this report.')
      } else if (status === 404 || lower.includes('404') || lower.includes('not found')) {
        setViewState('notFound')
        setError('No report record was found matching this tracking ID.')
      } else if (status >= 500 || lower.includes('500') || lower.includes('server error')) {
        setViewState('serverError')
        setError(msg || 'Server encountered an error processing this report.')
      } else {
        setViewState('networkError')
        setError(msg || 'Failed to connect to backend server. Please check your internet connection.')
      }
    }
  }

  useEffect(() => {
    isCurrentRef.current = true
    loadReport()
    return () => {
      isCurrentRef.current = false
    }
  }, [reportId])

  async function handleOfficerReplySubmit(e) {
    e.preventDefault()
    if (!officerReply.trim()) return
    setSubmittingReply(true)
    setReplyError('')
    setReplySuccess('')
    try {
      await api.respondToInfoRequest(report.id || report._id, officerReply.trim())
      setReplySuccess('Your response has been submitted to the duty officer.')
      setOfficerReply('')
      await loadReport()
    } catch (err) {
      setReplyError(err.message || 'Failed to submit response')
    } finally {
      setSubmittingReply(false)
    }
  }

  if (viewState === 'loading') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-[#627282] text-xs">
        <RefreshCw size={24} className="animate-spin text-emerald-700" />
        <span>Loading report details from database...</span>
      </div>
    )
  }

  if (viewState !== 'success' || !report) {
    const isNetwork = viewState === 'networkError' || viewState === 'serverError'
    const isForbidden = viewState === 'forbidden'

    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 bg-white border border-[#0c1824]/8 rounded-3xl shadow-sm">
        <div className={`inline-flex p-3 rounded-2xl ${
          isForbidden ? 'bg-amber-50 text-amber-600 border border-amber-200' :
          isNetwork ? 'bg-blue-50 text-blue-600 border border-blue-200' :
          'bg-rose-50 text-rose-600 border border-rose-200'
        }`}>
          {isForbidden ? <ShieldAlert size={32} /> : isNetwork ? <RefreshCw size={32} /> : <AlertTriangle size={32} />}
        </div>
        <h3 className="text-lg font-bold text-[#0c1824] font-display">
          {isForbidden ? 'Access Restricted' : isNetwork ? 'Unable to Connect to Server' : 'Report Not Found'}
        </h3>
        <p className="text-xs text-[#627282]">{error || 'Please check the Tracking ID.'}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          {isNetwork && (
            <button
              type="button"
              onClick={() => loadReport()}
              className="btn-primary inline-flex items-center gap-1.5 py-2 px-4 text-xs rounded-xl"
            >
              <RefreshCw size={14} />
              <span>Retry Loading</span>
            </button>
          )}
          <Link
            to="/track"
            className="btn-secondary inline-flex items-center gap-1.5 py-2 px-4 text-xs rounded-xl"
          >
            <span>Track by ID</span>
          </Link>
          <Link
            to="/app/reports"
            className="btn-secondary inline-flex items-center gap-1.5 py-2 px-4 text-xs rounded-xl"
          >
            <ArrowLeft size={14} />
            <span>My Reports</span>
          </Link>
        </div>
      </div>
    )
  }

  const pdfUrl = api.getReportPdfUrl(report.id || report._id || report.tracking_id)
  const loc = report.location || {}
  const hasCoordinates = loc.latitude && loc.longitude && !isNaN(parseFloat(loc.latitude)) && !isNaN(parseFloat(loc.longitude))
  const lat = hasCoordinates ? parseFloat(loc.latitude) : 33.6844
  const lon = hasCoordinates ? parseFloat(loc.longitude) : 73.0479

  const isResolved = report.status === 'resolved'
  const isClosed = report.status === 'closed'
  const isDisputed = report.status === 'disputed'

  const statusBadgeClass =
    isClosed ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
    isDisputed ? 'bg-rose-50 text-rose-800 border-rose-200' :
    isResolved ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400/30' :
    report.status === 'in_progress' ? 'bg-blue-50 text-blue-800 border-blue-200' :
    report.status === 'assigned' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
    'bg-slate-100 text-slate-700 border-slate-200'

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/app/reports"
          className="inline-flex items-center gap-1.5 text-xs text-[#3e4c59] hover:text-[#0c1824] font-semibold transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to My Reports</span>
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-flex items-center gap-2 py-1.5 px-3.5 text-xs rounded-xl"
          >
            <Download size={14} />
            <span>Download PDF Report</span>
          </a>
        </div>
      </div>

      {/* Main Report Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#0c1824]/8 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#0c1824]/6 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-bold text-emerald-900 px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200/80">
                {report.tracking_id}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${statusBadgeClass}`}>
                {report.status}
              </span>
              {report.is_escalated && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                  Priority Escalated
                </span>
              )}
              {report.cluster_id && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                  <span>Repeated Problem: {report.cluster?.cluster_code || 'Proximity Group'}</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0c1824] pt-1 font-display">{report.title}</h1>
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
          <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#0c1824]/6">
            <div className="flex items-center gap-1.5 text-[#627282] font-semibold mb-1">
              <Building size={14} className="text-emerald-700" />
              <span>Assigned Department</span>
            </div>
            <p className="font-bold text-[#0c1824] truncate font-display">
              {report.department_name || report.department_id || 'CDA Municipal Authority'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#0c1824]/6">
            <div className="flex items-center gap-1.5 text-[#627282] font-semibold mb-1">
              <MapPin size={14} className="text-emerald-700" />
              <span>Reported Location</span>
            </div>
            <p className="font-bold text-[#0c1824] truncate" title={loc.address || loc.city}>
              {loc.address || loc.city || 'Islamabad Capital Territory'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#0c1824]/6">
            <div className="flex items-center gap-1.5 text-[#627282] font-semibold mb-1">
              <Calendar size={14} className="text-emerald-700" />
              <span>Date Submitted</span>
            </div>
            <p className="font-bold text-[#0c1824] font-display">
              {report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#0c1824]/6">
            <div className="flex items-center gap-1.5 text-[#627282] font-semibold mb-1">
              <Shield size={14} className="text-emerald-700" />
              <span>Duty Officer</span>
            </div>
            <p className="font-bold text-[#0c1824] truncate font-display">
              {report.assigned_officer_name || 'Pending Officer Assignment'}
            </p>
          </div>
        </div>

        {/* Problem Description */}
        <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#0c1824]/6 space-y-1.5 text-xs">
          <span className="font-bold uppercase tracking-wider text-[#627282] text-[11px] font-display">
            Problem Description
          </span>
          <p className="text-[#3e4c59] leading-relaxed whitespace-pre-line text-sm">
            {report.description}
          </p>
        </div>

        {/* Audio Transcript / Voice Note if available */}
        {(report.evidence?.transcript || report.evidence?.audio_base64 || report.evidence?.audio_url) && (
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold font-display">
              <Volume2 size={16} className="text-emerald-700" />
              <span>Voice Note Audio Recording</span>
            </div>
            {report.evidence?.transcript && (
              <p className="text-[#3e4c59] italic bg-white p-3 rounded-xl border border-emerald-100 font-editorial">
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
      </div>

      {/* Two Column Layout: Risk Score & Clarifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <RiskScoreGauge riskData={report.civic_risk_score} />

          {/* Evidence Card */}
          {(report.evidence?.image_url || report.evidence?.image_base64) && (
            <div className="p-4 rounded-3xl bg-white border border-[#0c1824]/8 space-y-2 shadow-sm">
              <h4 className="text-xs font-bold text-[#0c1824] uppercase tracking-wider font-display">
                Photo Evidence
              </h4>
              <img
                src={report.evidence.image_base64 || report.evidence.image_url}
                alt="Problem Evidence"
                className="w-full h-48 object-cover rounded-2xl border border-[#0c1824]/8 shadow-xs"
              />
            </div>
          )}

          {/* Location Map Preview */}
          {hasCoordinates && (
            <div className="p-4 rounded-3xl bg-white border border-[#0c1824]/8 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#0c1824] uppercase tracking-wider flex items-center gap-1.5 font-display">
                  <Navigation size={13} className="text-emerald-700" />
                  <span>Problem Location</span>
                </h4>
                <span className="text-[10px] text-[#627282] font-mono">
                  {lat.toFixed(4)}, {lon.toFixed(4)}
                </span>
              </div>
              <div className="h-44 rounded-2xl overflow-hidden border border-[#0c1824]/8">
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
                      fillColor: '#059669',
                      color: '#064e3b',
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

        <div className="lg:col-span-2 space-y-6">
          {/* Officer Request-Info Alert & Citizen Response Form */}
          {report.needs_citizen_response && report.citizen_info_request && (
            <div className="p-5 sm:p-6 rounded-3xl bg-amber-50/90 border-2 border-amber-300 shadow-sm space-y-3.5">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                  <Clock size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-950 font-display">
                    The assigned officer has requested additional details
                  </h4>
                  <p className="text-xs text-amber-900 leading-relaxed bg-white/80 p-3 rounded-xl border border-amber-200">
                    "{report.citizen_info_request.note}"
                  </p>
                  <p className="text-[11px] text-amber-800 font-mono">
                    Requested by <strong>{report.citizen_info_request.requested_by || 'Assigned Officer'}</strong>
                    {report.citizen_info_request.requested_at && ` on ${new Date(report.citizen_info_request.requested_at).toLocaleString()}`}
                  </p>
                </div>
              </div>

              {replySuccess && (
                <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle size={15} />
                  <span>{replySuccess}</span>
                </div>
              )}

              {replyError && (
                <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle size={15} />
                  <span>{replyError}</span>
                </div>
              )}

              <form onSubmit={handleOfficerReplySubmit} className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-amber-950 font-display">
                  Your Response:
                </label>
                <textarea
                  value={officerReply}
                  onChange={(e) => setOfficerReply(e.target.value)}
                  placeholder="Provide the specific information, measurements, or context requested by the officer..."
                  className="w-full text-xs p-3 rounded-xl border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-400"
                  rows={3}
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReply || !officerReply.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Send size={13} />
                    <span>{submittingReply ? 'Submitting...' : 'Submit Response'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Historical Additional Information Provided */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#0c1824]/8 space-y-3 shadow-sm">
            <h4 className="text-sm font-bold text-[#0c1824] flex items-center gap-2 font-display">
              <HelpCircle size={16} className="text-emerald-700" />
              <span>Additional Information</span>
            </h4>
            {report.missing_information_answers && report.missing_information_answers.length > 0 ? (
              <div className="space-y-2.5">
                <p className="text-xs text-[#627282]">
                  The following clarifications were recorded during submission to refine priority triage:
                </p>
                {report.missing_information_answers.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-[#faf8f5] border border-[#0c1824]/6 space-y-1">
                    <p className="text-xs font-semibold text-[#3e4c59]">{item.question}</p>
                    <p className="text-xs font-bold text-emerald-900 pl-2.5 border-l-2 border-emerald-600">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#627282] italic">
                No additional information was required.
              </p>
            )}

            {/* Previously submitted responses to officer inquiries */}
            {report.citizen_responses && report.citizen_responses.length > 0 && (
              <div className="pt-3 border-t border-[#0c1824]/6 space-y-2">
                <span className="text-[11px] font-bold text-[#627282] uppercase tracking-wider block font-display">
                  Responses Provided to Duty Officer
                </span>
                <div className="space-y-2">
                  {report.citizen_responses.map((cr, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-xs space-y-1">
                      <p className="text-[#0c1824]">{cr.response || cr.note || JSON.stringify(cr)}</p>
                      <span className="text-[10px] text-[#627282] block font-mono">
                        {cr.created_at ? new Date(cr.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Citizen Resolution Verification / Dispute Workflow */}
          <ResolutionCard report={report} onUpdated={loadReport} />

          {/* Official Timeline & Activity History */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#0c1824]/8 space-y-4 shadow-sm">
            <h4 className="text-sm font-bold text-[#0c1824] flex items-center gap-2 font-display">
              <FileText size={18} className="text-emerald-700" />
              <span>Activity History & Progress</span>
            </h4>
            <TimelineView timeline={report.timeline} currentStatus={report.status} />
          </div>
        </div>
      </div>
    </div>
  )
}
