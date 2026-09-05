import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin, Activity, ShieldAlert, CheckCircle2, TrendingUp,
  Layers, RefreshCw, BarChart3, ExternalLink
} from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import * as api from '../services/api'

export default function InsightsPage() {
  const [hotspots, setHotspots] = useState([])
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState('all')

  async function loadData() {
    setLoading(true)
    try {
      const [hotRes, trendRes] = await Promise.all([
        api.getHotspots().catch(() => ({ hotspots: [] })),
        api.getTrends().catch(() => ({ metrics: {} }))
      ])
      setHotspots(hotRes.hotspots || [])
      setTrends(trendRes)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredHotspots = hotspots.filter(h => {
    if (selectedFilter === 'critical') return (h.risk_score || 0) >= 75
    if (selectedFilter === 'clusters') return h.type === 'cluster'
    return true
  })

  const metrics = trends?.metrics || {
    total_reports: hotspots.length,
    active_open: hotspots.length,
    resolved_count: 0,
    critical_count: hotspots.filter(h => (h.risk_score || 0) >= 75).length,
    citizen_satisfaction_rate: 0,
    sla_compliance_rate: 0,
    clusters_formed: 0,
    duplicate_reports_merged: 0
  }

  const categoryBreakdown = trends?.category_breakdown || {}

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="glass-panel border-slate-800 bg-slate-900/60 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5">
            <TrendingUp size={14} />
            <span>Civic Intelligence Analytics</span>
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight mt-2">
            Civic Hotspots & Strategic Trends
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time geospatial hazard clustering, departmental response SLAs, and citizen satisfaction index.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-400' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow">
          <span className="text-slate-400 font-semibold">Total Reports</span>
          <p className="text-2xl font-black text-white mt-1">{metrics.total_reports}</p>
        </div>
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 shadow">
          <span className="text-red-300 font-semibold flex items-center gap-1">
            <ShieldAlert size={14} />
            <span>Critical Incidents</span>
          </span>
          <p className="text-2xl font-black text-red-400 mt-1">{metrics.critical_count}</p>
        </div>
        <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 shadow">
          <span className="text-indigo-300 font-semibold flex items-center gap-1">
            <Layers size={14} />
            <span>Active Clusters</span>
          </span>
          <p className="text-2xl font-black text-indigo-400 mt-1">{metrics.clusters_formed}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow">
          <span className="text-slate-400 font-semibold">Duplicates Saved</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{metrics.duplicate_reports_merged}</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 shadow">
          <span className="text-emerald-300 font-semibold flex items-center gap-1">
            <CheckCircle2 size={14} />
            <span>Citizen Satisfaction</span>
          </span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{metrics.citizen_satisfaction_rate}%</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow">
          <span className="text-slate-400 font-semibold">SLA Compliance</span>
          <p className="text-2xl font-black text-white mt-1">{metrics.sla_compliance_rate}%</p>
        </div>
      </div>

      {/* Geospatial Hotspots Map Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Geospatial Civic Hazard Hotspot Map</h3>
              <p className="text-xs text-slate-400">Islamabad & Rawalpindi Metropolitan Region</p>
            </div>
          </div>

          {/* Map Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                selectedFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Pins ({hotspots.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('critical')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                selectedFilter === 'critical' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Critical Risks Only
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('clusters')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                selectedFilter === 'clusters' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Proximity Clusters
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="h-[420px] w-full rounded-xl overflow-hidden border border-slate-800 relative z-10 shadow-inner bg-slate-950">
          <MapContainer
            center={[33.6938, 73.0489]}
            zoom={12}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredHotspots.map((pin) => {
              const score = pin.risk_score || 50
              const isCluster = pin.type === 'cluster'
              const color = score >= 75 ? '#ef4444' : score >= 50 ? '#f59e0b' : score >= 25 ? '#eab308' : '#10b981'
              const radius = isCluster ? 16 : (score >= 75 ? 12 : 9)

              return (
                <CircleMarker
                  key={pin.id}
                  center={[pin.latitude, pin.longitude]}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: isCluster ? 0.8 : 0.6,
                    weight: 2
                  }}
                  radius={radius}
                >
                  <Popup>
                    <div className="text-xs p-1 space-y-1 text-slate-900">
                      <div className="font-bold flex items-center justify-between gap-2">
                        <span>{pin.tracking_id || pin.cluster_code || 'Incident'}</span>
                        <span style={{ color }} className="font-black">
                          {score}/100 Risk
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800">{pin.title}</p>
                      <p className="text-[11px] text-slate-600">{pin.category}</p>
                      {pin.address && <p className="text-[10px] text-slate-500">{pin.address}</p>}
                      {pin.report_count && (
                        <p className="text-[10px] font-bold text-indigo-700">
                          {pin.report_count} complaints merged in this proximity cluster
                        </p>
                      )}
                      {pin.type === 'report' && (
                        <Link
                          to={`/report/${pin.id}`}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold hover:underline pt-1"
                        >
                          <span>Open Case Dossier</span>
                          <ExternalLink size={11} />
                        </Link>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span>Critical Risk (75-100)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span>High Risk (50-74)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-yellow-500" />
              <span>Medium Risk (25-49)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span>Low Risk (0-24)</span>
            </div>
          </div>
          <span>Proximity Radius: 250m Deduplication</span>
        </div>
      </div>

      {/* Category Breakdown & Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Category Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Incident Category Distribution</h3>
          </div>

          <div className="space-y-3">
            {Object.keys(categoryBreakdown).length > 0 ? (
              Object.entries(categoryBreakdown).map(([cat, count]) => {
                const pct = Math.round((count / (metrics.total_reports || 1)) * 100)
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-slate-300 font-medium">
                      <span>{cat}</span>
                      <span className="font-bold text-white">{count} cases ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                No categorized incidents recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Agency SLA Compliance */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Departmental SLA Compliance</h3>
          </div>

          <div className="divide-y divide-slate-800/80">
            {[
              { name: 'IESCO (Electricity / Power)', target: '12h', resolved: '94%', active: 2 },
              { name: 'CDA (Roads & Infrastructure)', target: '48h', resolved: '88%', active: 3 },
              { name: 'WASA (Water & Drainage)', target: '24h', resolved: '91%', active: 1 },
              { name: 'SNGPL (Gas & Energy)', target: '6h', resolved: '98%', active: 1 },
              { name: 'IWMC (Waste Management)', target: '36h', resolved: '89%', active: 1 }
            ].map((agency) => (
              <div key={agency.name} className="py-2.5 flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-200 block">{agency.name}</span>
                  <span className="text-[11px] text-slate-400">Target SLA: {agency.target}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-400">{agency.resolved} on time</span>
                  <span className="text-[10px] text-slate-500 block">{agency.active} active incidents</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
