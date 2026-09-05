import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search, MapPin, Building, AlertTriangle, Clock,
  FileText, Download, ExternalLink, RefreshCw, CheckCircle2, ShieldAlert, Filter, Calendar
} from 'lucide-react'
import * as api from '../services/api'
import { useAuth } from '../context/AuthContext'
import RiskScoreGauge from '../components/RiskScoreGauge'
import EmptyState from '../components/EmptyState'

export default function TrackComplaintPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('tracking_id') || searchParams.get('id') || ''
  const tabParam = searchParams.get('tab') || 'all'

  const { currentUser, token } = useAuth()
  const [activeTab, setActiveTab] = useState(tabParam)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadReports() {
    setLoading(true)
    try {
      const res = await api.getReports({ limit: 100 })
      setReports(res.reports || [])
    } catch (err) {
      console.error('Failed to load reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [token])

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchParams(prev => {
      const n = new URLSearchParams(prev)
      if (tab === 'all') n.delete('tab')
      else n.set('tab', tab)
      return n
    })
  }

  // Filter by Tab and Search Query
  const filteredReports = reports.filter(item => {
    // 1. Tab filter
    if (activeTab === 'active') {
      if (['resolved', 'closed'].includes(item.status)) return false
    } else if (activeTab === 'resolved') {
      if (!['resolved', 'closed'].includes(item.status)) return false
    } else if (activeTab === 'needs_response') {
      const needsReview = item.status === 'resolved' || item.needs_citizen_response === true || (item.missing_information_questions?.length > 0 && !item.missing_information_answers?.length)
      if (!needsReview) return false
    }

    // 2. Search query filter
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      (item.tracking_id || '').toLowerCase().includes(q) ||
      (item.title || '').toLowerCase().includes(q) ||
      (item.department_name || item.department_id || '').toLowerCase().includes(q) ||
      (item.location?.address || item.location?.city || item.location?.area || '').toLowerCase().includes(q)
    )
  })

  // Counts for tabs
  const activeCount = reports.filter(r => !['resolved', 'closed'].includes(r.status)).length
  const resolvedCount = reports.filter(r => ['resolved', 'closed'].includes(r.status)).length
  const needsResponseCount = reports.filter(r => r.status === 'resolved' || r.needs_citizen_response === true || (r.missing_information_questions?.length > 0 && !r.missing_information_answers?.length)).length

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Clock size={13} className="text-emerald-600" />
              <span>Civic Activity Tracker</span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
              My Reports
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Track status updates, duty officer responses, and verify completed field work.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:max-w-md">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-2.5 text-slate-400">
                <Search size={15} />
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 outline-none text-xs transition-all"
                placeholder="Search by Tracking ID (e.g. RA-2026-1000), issue, or area..."
              />
            </div>
            <button
              type="button"
              onClick={loadReports}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Refresh Reports"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-600' : ''} />
            </button>
            <Link
              to="/app/report"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 shadow-xs transition-colors"
            >
              + Report Problem
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Reports ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'active'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('needs_response')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'needs_response'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            <AlertTriangle size={13} />
            <span>Needs My Response ({needsResponseCount})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('resolved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'resolved'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </section>

      {/* Reports List */}
      <section className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
            <RefreshCw size={20} className="animate-spin text-emerald-600" />
            <span>Loading your reports from database...</span>
          </div>
        ) : filteredReports.length > 0 ? (
          filteredReports.map((item) => {
            const risk = item.civic_risk_score || {}
            const pdfUrl = api.getReportPdfUrl(item.id || item._id || item.tracking_id)
            const isResolved = item.status === 'resolved'
            const isDisputed = item.status === 'disputed'
            const isClosed = item.status === 'closed'
            const isAssigned = item.status === 'assigned' || item.status === 'in_progress'

            const statusText =
              isClosed ? 'Verified & Closed' :
              isDisputed ? 'Resolution Disputed' :
              isResolved ? 'Marked Fixed — Please Confirm' :
              isAssigned ? 'Officer Working' :
              item.status === 'in_review' ? 'In Review' : 'New Report'

            const statusBadgeClass =
              isClosed ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              isDisputed ? 'bg-rose-50 text-rose-800 border-rose-200' :
              isResolved ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400/30' :
              isAssigned ? 'bg-blue-50 text-blue-800 border-blue-200' :
              'bg-slate-100 text-slate-700 border-slate-200'

            const updatedDate = item.updated_at || item.created_at

            return (
              <article
                key={item.id || item._id}
                className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-500/40 hover:shadow-sm transition-all space-y-4 shadow-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Summary */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-800 px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200">
                        {item.tracking_id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadgeClass}`}>
                        {statusText}
                      </span>
                      {item.cluster_id && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Repeated Problem Linked
                        </span>
                      )}
                      <RiskScoreGauge riskData={item.civic_risk_score} compact={true} />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      <Link to={`/app/reports/${item.id || item._id}`} className="hover:text-emerald-700 transition-colors">
                        {item.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Building size={13} className="text-emerald-600" />
                        <span>{item.department_name || item.department_id || 'CDA Municipal Authority'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-emerald-600" />
                        <span>{item.location?.address || item.location?.area || item.location?.city || 'Islamabad Capital Territory'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400" />
                        <span>Updated: {updatedDate ? new Date(updatedDate).toLocaleDateString() : 'Recent'}</span>
                      </span>
                    </div>

                    {isResolved && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
                        <div>
                          <p className="font-bold flex items-center gap-1.5 text-amber-900">
                            <CheckCircle2 size={15} className="text-emerald-600" />
                            <span>Your problem has been marked as fixed!</span>
                          </p>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            Please check the site and confirm if the work was completed properly.
                          </p>
                        </div>
                        <Link
                          to={`/app/reports/${item.id || item._id}`}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-xs transition-colors"
                        >
                          Confirm or Dispute
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 min-w-[180px] shrink-0">
                    <Link
                      to={`/app/reports/${item.id || item._id}`}
                      className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <FileText size={14} />
                      <span>View Details</span>
                    </Link>

                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
                    >
                      <Download size={14} />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </div>
              </article>
            )
          })
        ) : (
          <EmptyState
            title={searchQuery ? 'No matching reports' : activeTab === 'needs_response' ? 'No reports need your response' : 'You haven\'t reported any problems yet'}
            description={
              searchQuery
                ? `No reports found matching "${searchQuery}". Try a different keyword or tracking ID.`
                : activeTab === 'needs_response'
                ? 'All your reports are either being processed or have already been confirmed.'
                : 'Report potholes, broken streetlights, or waste in your area. Raabta AI will categorize and route it directly to the right municipal department.'
            }
            actionText={searchQuery ? 'Clear Search' : '+ Report a Problem'}
            actionLink={searchQuery ? undefined : '/app/report'}
            onAction={searchQuery ? () => setSearchQuery('') : undefined}
          />
        )}
      </section>
    </div>
  )
}
