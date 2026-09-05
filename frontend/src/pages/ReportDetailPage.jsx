import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  FileText, Download, ArrowLeft, MapPin, Calendar, Building,
  Shield, AlertTriangle, CheckCircle, ExternalLink, RefreshCw
} from 'lucide-react'
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
        setError('Incident dossier could not be located.')
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
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
        <RefreshCw size={24} className="animate-spin text-emerald-500" />
        <span>Retrieving Official Civic Dossier...</span>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-lg font-bold text-white">Incident Dossier Not Found</h3>
        <p className="text-xs text-slate-400">{error || 'Please verify the Tracking ID.'}</p>
        <Link
          to="/track"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
        >
          <ArrowLeft size={14} />
          <span>Back to Tracker</span>
        </Link>
      </div>
    )
  }

  const pdfUrl = api.getReportPdfUrl(report.id || report._id || report.tracking_id)
  const loc = report.location || {}

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/track"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Complaints</span>
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
          >
            <Download size={14} />
            <span>Download Official PDF Dossier</span>
          </a>
        </div>
      </div>

      {/* Main Dossier Header Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                {report.tracking_id}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                {report.status}
              </span>
              {report.is_escalated && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                  Priority Escalated
                </span>
              )}
              {report.cluster_id && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <span>Cluster Link: {report.cluster?.cluster_code || 'Proximity Group'}</span>
                </span>
              )}
            </div>
            <h1 className="text-xl font-black text-white pt-1">{report.title}</h1>
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
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
              <Building size={14} className="text-emerald-400" />
              <span>Department</span>
            </div>
            <p className="font-bold text-white truncate">
              {report.department_name || report.department_id || 'Municipal Authority'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
              <MapPin size={14} className="text-emerald-400" />
              <span>Location</span>
            </div>
            <p className="font-bold text-white truncate" title={loc.address || loc.city}>
              {loc.address || loc.city || 'Coordinates on record'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
              <Calendar size={14} className="text-emerald-400" />
              <span>Reported Date</span>
            </div>
            <p className="font-bold text-white">
              {report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
              <Shield size={14} className="text-emerald-400" />
              <span>Assigned Officer</span>
            </div>
            <p className="font-bold text-white truncate">
              {report.assigned_officer_name || 'Pending Dispatch'}
            </p>
          </div>
        </div>

        {/* Description / Statement */}
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5 text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
            Citizen Incident Statement
          </span>
          <p className="text-slate-200 leading-relaxed whitespace-pre-line text-sm">
            {report.description}
          </p>
        </div>
      </div>

      {/* Two Column Layout: Risk Score & Clarifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <RiskScoreGauge riskData={report.civic_risk_score} />

          {/* Evidence Card */}
          {report.evidence?.image_url && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Photographic Evidence
              </h4>
              <img
                src={report.evidence.image_url}
                alt="Incident Evidence"
                className="w-full h-48 object-cover rounded-lg border border-slate-800 shadow"
              />
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

          {/* Official Timeline & Audit Log */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText size={18} className="text-emerald-400" />
              <span>Official Lifecycle & Audit Trail</span>
            </h4>
            <TimelineView timeline={report.timeline} currentStatus={report.status} />
          </div>
        </div>
      </div>
    </div>
  )
}
