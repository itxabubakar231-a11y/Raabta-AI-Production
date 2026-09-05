import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert, Clock, CheckCircle2, AlertTriangle, Layers,
  TrendingUp, Users, ArrowRight, RefreshCw, Filter, Building, MapPin, ShieldCheck
} from 'lucide-react'
import * as api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import RiskScoreGauge from '../../components/RiskScoreGauge'

export default function GovDashboardPage() {
  const { currentUser, role } = useAuth()
  const [loading, setLoading] = useState(true)
  const [trends, setTrends] = useState(null)
  const [queueStats, setQueueStats] = useState({})
  const [recentReports, setRecentReports] = useState([])
  const [clusters, setClusters] = useState([])

  async function loadDashboardData() {
    setLoading(true)
    try {
      const isOfficer = role === 'officer'
      const dept = currentUser?.department_id
      const queueParams = { limit: 8 }
      const trendsParams = {}
      if (isOfficer && dept) {
        queueParams.department_id = dept
        trendsParams.department_id = dept
      }

      const [trendsRes, queueRes, clustersRes] = await Promise.all([
        api.getTrends(trendsParams).catch(() => ({ metrics: {} })),
        api.getOperationsQueue(queueParams).catch(() => ({ queue: [], stats: {} })),
        api.getClusters().catch(() => ({ clusters: [] }))
      ])
      setTrends(trendsRes)
      setQueueStats(queueRes.stats || {})
      setRecentReports(queueRes.queue || [])
      setClusters(clustersRes.clusters || [])
    } catch (err) {
      console.error('Failed to load operations data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [role, currentUser?.department_id])

  const metrics = trends?.metrics || {}
  
  // Real database metrics with queue synchronization to guarantee zero 0-count discrepancies
  const totalReports = Math.max(queueStats.total || 0, metrics.total_reports || 0, recentReports.length)
  const criticalCount = Math.max(queueStats.critical || 0, metrics.critical_count || 0)
  const waitingActionCount = Math.max(queueStats.waiting_action || 0, queueStats.pending || 0, metrics.waiting_action_count || 0, metrics.active_open || 0)
  const inProgressCount = Math.max(queueStats.in_progress || 0, metrics.in_progress_count || 0)
  const resolvedCount = Math.max(queueStats.resolved || 0, metrics.resolved_count || 0)
  const disputedCount = Math.max(queueStats.disputed || 0, metrics.disputed_count || 0)

  const isOfficer = role === 'officer'
  const deptName = currentUser?.department_name || currentUser?.department_id || 'Assigned Department'

  return (
    <div className="space-y-6 pb-12">
      {/* Operations Header - Role Differentiated */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>{isOfficer ? `Duty Officer Desk • ${deptName}` : 'Live Civic Operations • ICT Master Command'}</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {isOfficer ? `${deptName} Operations Desk` : 'Raabta AI Operations Dashboard'}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {isOfficer
              ? `Operational queue, field dispatch, and proof-of-work resolution oversight for ${deptName}.`
              : 'System-wide government oversight: monitor reports, oversee department response, and track municipal field resolutions across ICT.'
            }
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadDashboardData}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-600' : ''} />
          </button>
          <Link
            to="/gov/queue"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            {isOfficer ? 'Open Department Queue' : 'Open Attention Queue'}
          </Link>
        </div>
      </section>

      {/* Real Database Metrics Cards (Strictly No Hardcoded Numbers) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-slate-500 font-semibold block">Reports Received</span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {loading ? '-' : totalReports}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {isOfficer ? `Total in ${deptName}` : 'Total logged in ICT'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-xs">
          <span className="text-rose-700 font-semibold flex items-center gap-1">
            <ShieldAlert size={14} />
            <span>High Priority</span>
          </span>
          <p className="text-2xl font-black text-rose-700 mt-1">
            {loading ? '-' : criticalCount}
          </p>
          <span className="text-[10px] text-rose-600/80 mt-0.5 block">Score &ge; 75 / 100</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
          <span className="text-amber-800 font-semibold flex items-center gap-1">
            <Clock size={14} />
            <span>Waiting Action</span>
          </span>
          <p className="text-2xl font-black text-amber-800 mt-1">
            {loading ? '-' : waitingActionCount}
          </p>
          <span className="text-[10px] text-amber-700/80 mt-0.5 block">New or unassigned</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 shadow-xs">
          <span className="text-blue-800 font-semibold flex items-center gap-1">
            <span>In Progress</span>
          </span>
          <p className="text-2xl font-black text-blue-800 mt-1">
            {loading ? '-' : inProgressCount}
          </p>
          <span className="text-[10px] text-blue-600/80 mt-0.5 block">Field teams deployed</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs">
          <span className="text-emerald-800 font-semibold flex items-center gap-1">
            <CheckCircle2 size={14} />
            <span>Resolved</span>
          </span>
          <p className="text-2xl font-black text-emerald-800 mt-1">
            {loading ? '-' : resolvedCount}
          </p>
          <span className="text-[10px] text-emerald-600/80 mt-0.5 block">Completed works</span>
        </div>

        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 shadow-xs">
          <span className="text-orange-800 font-semibold flex items-center gap-1">
            <AlertTriangle size={14} />
            <span>Citizen Disputed</span>
          </span>
          <p className="text-2xl font-black text-orange-800 mt-1">
            {loading ? '-' : disputedCount}
          </p>
          <span className="text-[10px] text-orange-700/80 mt-0.5 block">Citizen rejected fix</span>
        </div>
      </section>

      {/* Operational Highlights & Repeated Problems Banner */}
      {clusters.length > 0 && (
        <section className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {clusters.length} Repeated Civic Problem Clusters Detected (&lt; 250m Proximity)
              </h3>
              <p className="text-slate-600 mt-0.5 text-xs">
                Multiple citizens reported identical physical hazards in the same sector. Coordinate unified municipal response.
              </p>
            </div>
          </div>
          <Link
            to="/gov/repeated"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>View Repeated Clusters</span>
            <ArrowRight size={13} />
          </Link>
        </section>
      )}

      {/* Reports Needing Immediate Attention (Triage Table) */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-bold text-base text-slate-900">
              Urgent Reports Needing Officer Action
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked deterministically by AI Civic Risk Engine (Safety Risk + Severity + Location + Public Impact).
            </p>
          </div>
          <Link
            to="/gov/queue"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Full Priority Queue</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw size={18} className="animate-spin text-emerald-600" />
            <span>Loading priority queue...</span>
          </div>
        ) : recentReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Priority Score</th>
                  <th className="py-2.5 px-3">Tracking ID & Problem</th>
                  <th className="py-2.5 px-3">Location / Sector</th>
                  <th className="py-2.5 px-3">Assigned Department</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentReports.map((report) => {
                  const score = report.civic_risk_score?.score || 50
                  const isCritical = score >= 75
                  const isHigh = score >= 50 && score < 75

                  return (
                    <tr key={report.id || report._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md text-xs ${
                          isCritical ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          isHigh ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {score}/100
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-[10px] text-slate-400 font-bold">
                          {report.tracking_id}
                        </div>
                        <div className="font-bold text-slate-900 line-clamp-1 max-w-xs">
                          {report.title}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div className="flex items-center gap-1 truncate max-w-xs">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span>{report.location?.address || report.location?.area || 'Islamabad ICT'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div className="flex items-center gap-1 font-medium">
                          <Building size={12} className="text-emerald-600 shrink-0" />
                          <span className="truncate">{report.department_name || report.department_id || 'CDA'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {report.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/gov/reports/${report.tracking_id || report.id || report._id}`}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors inline-block"
                        >
                          Triage & Manage
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No pending reports requiring attention. All caught up!
          </div>
        )}
      </section>
    </div>
  )
}
