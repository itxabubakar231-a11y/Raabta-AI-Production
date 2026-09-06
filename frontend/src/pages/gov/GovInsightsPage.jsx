import { useState, useEffect } from 'react'
import {
  TrendingUp, Building, MapPin, CheckCircle2, AlertTriangle,
  Clock, ShieldAlert, Layers, RefreshCw, BarChart3, PieChart
} from 'lucide-react'
import * as api from '../../services/api'

export default function GovInsightsPage() {
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    try {
      const res = await api.getTrends()
      setTrends(res)
    } catch (err) {
      console.error('Failed to load insights:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const metrics = trends?.metrics || {}
  const statusDist = trends?.status_distribution || {}
  const catBreakdown = trends?.category_breakdown || {}
  const deptWorkload = trends?.department_workload || {}
  const riskDist = trends?.risk_distribution || {}
  const topAreas = trends?.top_areas || []

  // Safe formatting for metrics that might be null due to lack of real historical data
  const formatPercentage = (val) => {
    if (val === null || val === undefined) return 'Not enough data yet'
    return `${val}%`
  }

  const formatHours = (val) => {
    if (val === null || val === undefined) return 'Not enough data yet'
    return `${val} hours`
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <section className="bg-white border border-[#0c1824]/8 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-display">
            <TrendingUp size={13} className="text-emerald-700" />
            <span>Empirical Intelligence</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-[#0c1824] tracking-tight font-display">
            Area Insights & Strategic Analytics
          </h1>
          <p className="mt-1 text-xs text-[#627282]">
            Real performance telemetry derived from database records. Zero hardcoded or estimated numbers.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="p-2.5 rounded-xl bg-[#faf8f5] hover:bg-slate-100 text-[#3e4c59] border border-[#0c1824]/8 transition-colors cursor-pointer"
          title="Refresh Analytics"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-700' : ''} />
        </button>
      </section>

      {/* Top Level Real Metrics */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-5 rounded-2xl bg-white border border-[#0c1824]/8 shadow-sm space-y-1">
          <span className="text-[#627282] font-semibold block font-display">Citizen Confirmation Rate</span>
          <p className="text-2xl font-black text-[#0c1824] font-display">
            {loading ? '...' : formatPercentage(metrics.citizen_satisfaction_rate)}
          </p>
          <span className="text-[10px] text-[#627282] block">
            Confirmed / (Confirmed + Disputed)
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#0c1824]/8 shadow-sm space-y-1">
          <span className="text-[#627282] font-semibold block font-display">Average Response Time</span>
          <p className="text-2xl font-black text-[#0c1824] font-display">
            {loading ? '...' : formatHours(metrics.avg_resolution_hours)}
          </p>
          <span className="text-[10px] text-[#627282] block">
            Calculated between submission & resolution
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#0c1824]/8 shadow-sm space-y-1">
          <span className="text-[#627282] font-semibold block font-display">SLA Compliance Rate</span>
          <p className="text-2xl font-black text-[#0c1824] font-display">
            {loading ? '...' : formatPercentage(metrics.sla_compliance_rate)}
          </p>
          <span className="text-[10px] text-[#627282] block">
            Resolved within target window
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#0c1824]/8 shadow-sm space-y-1">
          <span className="text-[#627282] font-semibold block font-display">Duplicate Reports Saved</span>
          <p className="text-2xl font-black text-indigo-700 font-display">
            {loading ? '...' : metrics.duplicate_reports_merged ?? 0}
          </p>
          <span className="text-[10px] text-[#627282] block font-mono">
            Merged via proximity clustering (&lt; 250m)
          </span>
        </div>
      </section>

      {/* Grid: Categories, Departments & Top Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Most Reported Problems (Category Breakdown) */}
        <div className="p-6 rounded-3xl bg-white border border-[#0c1824]/8 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#0c1824]/6 pb-3">
            <h3 className="font-bold text-sm text-[#0c1824] flex items-center gap-2 font-display">
              <BarChart3 size={16} className="text-emerald-700" />
              <span>Most Reported Problems</span>
            </h3>
          </div>

          {Object.keys(catBreakdown).length > 0 ? (
            <div className="space-y-3 text-xs">
              {Object.entries(catBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => {
                  const pct = metrics.total_reports > 0 ? Math.round((count / metrics.total_reports) * 100) : 0
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#0c1824]">{category}</span>
                        <span className="font-mono text-[#627282]">{count} reports ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#faf8f5] overflow-hidden border border-[#0c1824]/6">
                        <div
                          className="h-full bg-emerald-700 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="text-xs text-[#627282] py-6 text-center italic">Not enough data yet</p>
          )}
        </div>

        {/* Department Workload */}
        <div className="p-6 rounded-3xl bg-white border border-[#0c1824]/8 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#0c1824]/6 pb-3">
            <h3 className="font-bold text-sm text-[#0c1824] flex items-center gap-2 font-display">
              <Building size={16} className="text-blue-700" />
              <span>Department Workload</span>
            </h3>
          </div>

          {Object.keys(deptWorkload).length > 0 ? (
            <div className="space-y-3 text-xs">
              {Object.entries(deptWorkload)
                .sort((a, b) => b[1] - a[1])
                .map(([dept, count]) => {
                  const pct = metrics.total_reports > 0 ? Math.round((count / metrics.total_reports) * 100) : 0
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#0c1824] truncate max-w-[180px]">{dept}</span>
                        <span className="font-mono text-[#627282]">{count} cases</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#faf8f5] overflow-hidden border border-[#0c1824]/6">
                        <div
                          className="h-full bg-blue-700 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="text-xs text-[#627282] py-6 text-center italic">Not enough data yet</p>
          )}
        </div>

        {/* Areas With Most Reports */}
        <div className="p-6 rounded-3xl bg-white border border-[#0c1824]/8 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#0c1824]/6 pb-3">
            <h3 className="font-bold text-sm text-[#0c1824] flex items-center gap-2 font-display">
              <MapPin size={16} className="text-rose-700" />
              <span>Areas with Most Reports</span>
            </h3>
          </div>

          {topAreas.length > 0 ? (
            <div className="space-y-3 text-xs">
              {topAreas.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/6 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center font-display">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-[#0c1824]">{item.area}</span>
                  </div>
                  <span className="font-mono font-bold text-[#3e4c59] bg-white px-2 py-0.5 rounded-lg border border-[#0c1824]/8">
                    {item.count} reports
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#627282] py-6 text-center italic">Not enough data yet</p>
          )}
        </div>
      </div>

      {/* Priority Distribution & Resolution Outcomes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-[#0c1824]/8 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[#0c1824] flex items-center gap-2 font-display">
            <ShieldAlert size={16} className="text-amber-700" />
            <span>Priority Distribution (Calculated Risk)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80">
              <span className="text-rose-700 font-semibold block font-display">Critical (≥ 75)</span>
              <p className="text-xl font-black text-rose-700 mt-1 font-display">{riskDist.CRITICAL ?? 0}</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
              <span className="text-amber-700 font-semibold block font-display">High (50-74)</span>
              <p className="text-xl font-black text-amber-700 mt-1 font-display">{riskDist.HIGH ?? 0}</p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80">
              <span className="text-blue-700 font-semibold block font-display">Medium (25-49)</span>
              <p className="text-xl font-black text-blue-700 mt-1 font-display">{riskDist.MEDIUM ?? 0}</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-600 font-semibold block font-display">Low (&lt; 25)</span>
              <p className="text-xl font-black text-[#0c1824] mt-1 font-display">{riskDist.LOW ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Resolution vs Citizen Disputed Breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-[#0c1824]/8 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[#0c1824] flex items-center gap-2 font-display">
            <CheckCircle2 size={16} className="text-emerald-700" />
            <span>Resolution & Citizen Verification Status</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
              <span className="text-emerald-800 font-semibold block font-display">Citizen Confirmed</span>
              <p className="text-xl font-black text-emerald-800 mt-1 font-display">{metrics.verified_confirmed_count ?? 0}</p>
            </div>
            <div className="p-3 rounded-2xl bg-orange-50/70 border border-orange-200/80">
              <span className="text-orange-800 font-semibold block font-display">Citizen Disputed</span>
              <p className="text-xl font-black text-orange-800 mt-1 font-display">{metrics.disputed_count ?? 0}</p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80">
              <span className="text-blue-800 font-semibold block font-display">Total Completed</span>
              <p className="text-xl font-black text-blue-800 mt-1 font-display">{metrics.resolved_count ?? 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
