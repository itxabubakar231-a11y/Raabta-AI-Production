import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  FileText, Download, ArrowLeft, MapPin, Calendar, Building,
  Shield, AlertTriangle, CheckCircle, ExternalLink, RefreshCw, Volume2, Sparkles, Navigation
} from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import * as api from '../services/api'
import RiskScoreGauge from '../components/RiskScoreGauge'
import EvidenceQualityBadge from '../components/EvidenceQualityBadge'
import MissingInfoModal from '../components/MissingInfoModal'
import ResolutionCard from '../components/ResolutionCard'
import TimelineView from '../components/TimelineView'

export default function ReportDetailPage() {
  const params = useParams()
  const [searchParams] = useSearchParams()
  const reportId = params.id || searchParams.get('id') || searchParams.get('tracking_id')

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadReport() {
    if (!reportId) return
    setLoading(true)
    setError('')
    try {
      const res = await api.getReportById(reportId)
      if (res && res.report) {
        setReport(res.report)
      } else {
        setError('Report could not be found.')
      }
    } catch (err) {
      setError(err.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [reportId])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
        <RefreshCw size={24} className="animate-spin text-emerald-600" />
        <span>Loading report details from database...</span>
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
          to="/app/reports"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold hover:bg-slate-200 border border-slate-200 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to My Reports</span>
        </Link>
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
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to My Reports</span>
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 shadow-xs transition-colors"
          >
            <Download size={14} />
            <span>Download PDF Report</span>
          </a>
        </div>
      </div>

      {/* Main Report Header Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-bold text-emerald-800 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200">
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
              <span>Assigned Department</span>
            </div>
            <p className="font-bold text-slate-900 truncate">
              {report.department_name || report.department_id || 'CDA Municipal Authority'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
              <MapPin size={14} className="text-emerald-600" />
              <span>Reported Location</span>
            </div>
            <p className="font-bold text-slate-900 truncate" title={loc.address || loc.city}>
              {loc.address || loc.city || 'Islamabad Capital Territory'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
              <Calendar size={14} className="text-emerald-600" />
              <span>Date Submitted</span>
            </div>
            <p className="font-bold text-slate-900">
              {report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
              <Shield size={14} className="text-emerald-600" />
              <span>Duty Officer</span>
            </div>
            <p className="font-bold text-slate-900 truncate">
              {report.assigned_officer_name || 'Pending Officer Assignment'}
            </p>
          </div>
        </div>

        {/* Description / Statement */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
            Problem Description
          </span>
          <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm">
            {report.description}
          </p>
        </div>

        {/* Audio Transcript / Voice Note if available */}
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
      </div>

      {/* Two Column Layout: Risk Score & Clarifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <RiskScoreGauge riskData={report.civic_risk_score} />

          {/* Evidence Card */}
          {report.evidence?.image_url && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Photo Evidence
              </h4>
              <img
                src={report.evidence.image_url}
                alt="Problem Evidence"
                className="w-full h-48 object-cover rounded-xl border border-slate-200 shadow-xs"
              />
            </div>
          )}

          {/* Location Map Preview */}
          {hasCoordinates && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation size={13} className="text-emerald-600" />
                  <span>Problem Location</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  {lat.toFixed(4)}, {lon.toFixed(4)}
                </span>
              </div>
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

        <div className="lg:col-span-2 space-y-6">
          {/* Missing Information Assistant */}
          {report.missing_information_questions?.length > 0 &&
            (!report.missing_information_answers || report.missing_information_answers.length === 0) && (
              <MissingInfoModal
                reportId={report.id || report._id}
                questions={report.missing_information_questions}
                onAnswered={loadReport}
              />
          )}

          {/* Citizen Resolution Verification / Dispute Workflow */}
          <ResolutionCard report={report} onUpdated={loadReport} />

          {/* Official Timeline & Activity History */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-4 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-emerald-600" />
              <span>Activity History & Progress</span>
            </h4>
            <TimelineView timeline={report.timeline} currentStatus={report.status} />
          </div>
        </div>
      </div>
    </div>
  )
}
