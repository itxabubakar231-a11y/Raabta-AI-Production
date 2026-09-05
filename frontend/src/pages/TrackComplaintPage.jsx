import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search, MapPin, Building, AlertTriangle, Clock,
  FileText, Download, ExternalLink, RefreshCw, CheckCircle2, ShieldAlert
} from 'lucide-react'
import * as api from '../services/api'
import { useAuth } from '../context/AuthContext'
import RiskScoreGauge from '../components/RiskScoreGauge'
import EmptyState from '../components/EmptyState'

export default function TrackComplaintPage() {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('tracking_id') || searchParams.get('id') || ''

  const { currentUser, token } = useAuth()
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadReports() {
    setLoading(true)
    try {
      // If logged in citizen, try to get my reports, otherwise list recent
      const res = await api.getReports({ limit: 50 })
      setReports(res.reports || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [token])

  const filteredReports = reports.filter(item => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      (item.tracking_id || '').toLowerCase().includes(q) ||
      (item.title || '').toLowerCase().includes(q) ||
      (item.department_name || item.department_id || '').toLowerCase().includes(q) ||
      (item.location?.address || item.location?.city || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <section className="glass-panel border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5">
              <Clock size={14} />
              <span>Citizen Case Tracking & Auditing</span>
            </span>
            <h1 className="mt-2 text-2xl font-black text-white tracking-tight">
              Track Civic Incident Dossiers
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Real-time audit records, calculated Civic Risk Scores, and official downloadable Government dossiers.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:max-w-md">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-2.5 text-slate-500">
                <Search size={16} />
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:border-emerald-500 outline-none text-xs transition-all"
                placeholder="Search by Tracking ID (e.g. RA-2026-1000), issue, or city..."
              />
            </div>
            <button
              type="button"
              onClick={loadReports}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-400' : ''} />
            </button>
          </div>
        </div>
      </section>

      {/* Reports List */}
      <section className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <RefreshCw size={20} className="animate-spin text-emerald-400" />
            <span>Loading active civic dossiers...</span>
          </div>
        ) : filteredReports.length > 0 ? (
          filteredReports.map((item) => {
            const risk = item.civic_risk_score || {}
            const pdfUrl = api.getReportPdfUrl(item.id || item._id || item.tracking_id)
            const isResolved = item.status === 'resolved'
            const isDisputed = item.status === 'disputed'
            const isClosed = item.status === 'closed'

            return (
              <article
                key={item.id || item._id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Summary */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400 px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                        {item.tracking_id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        isClosed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        isDisputed ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        isResolved ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse' :
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {item.status}
                      </span>
                      {item.cluster_id && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          PROXIMITY CLUSTER LINKED
                        </span>
                      )}
                      <RiskScoreGauge riskData={item.civic_risk_score} compact={true} />
                    </div>

                    <h3 className="text-lg font-bold text-white leading-tight">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Building size={13} className="text-emerald-400" />
                        <span>{item.department_name || item.department_id || 'Municipal Authority'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-emerald-400" />
                        <span>{item.location?.address || item.location?.city || 'Location on record'}</span>
                      </span>
                    </div>

                    {isResolved && (
                      <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/40 text-xs text-indigo-200 flex items-center justify-between gap-3 mt-2">
                        <span className="font-semibold">
                          Duty Officer marked this issue resolved. Your verification is required!
                        </span>
                        <Link
                          to={`/report/${item.id || item._id}`}
                          className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 shadow"
                        >
                          Verify Resolution
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 min-w-[200px] shrink-0">
                    <Link
                      to={`/report/${item.id || item._id}`}
                      className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
                    >
                      <FileText size={14} />
                      <span>View Full Dossier</span>
                    </Link>

                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                    >
                      <Download size={14} />
                      <span>Download PDF Dossier</span>
                    </a>
                  </div>
                </div>
              </article>
            )
          })
        ) : (
          <EmptyState
            title={searchQuery ? 'No matching records' : 'No activity yet'}
            description={
              searchQuery
                ? `No records found matching "${searchQuery}". Please check the Tracking ID or filter criteria.`
                : 'Your first practice session or civic dossier will appear here once you get started.'
            }
            actionText={searchQuery ? 'Clear Search' : 'File Incident Report'}
            actionLink={searchQuery ? undefined : '/submit'}
            onAction={searchQuery ? () => setSearchQuery('') : undefined}
          />
        )}
      </section>
    </div>
  )
}
