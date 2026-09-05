import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Layers, MapPin, Building, ShieldAlert, ArrowRight,
  RefreshCw, CheckCircle2, AlertTriangle, Users, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import * as api from '../../services/api'

export default function GovRepeatedProblemsPage() {
  const [clusters, setClusters] = useState([])
  const [selectedCluster, setSelectedCluster] = useState(null)
  const [clusterDetail, setClusterDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  async function loadClusters() {
    setLoading(true)
    try {
      const res = await api.getClusters()
      const list = res.clusters || []
      setClusters(list)
      if (list.length > 0) {
        setSelectedCluster(list[0])
        loadClusterDetail(list[0].id || list[0]._id || list[0].cluster_code)
      }
    } catch (err) {
      console.error('Failed to load clusters:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadClusterDetail(clusterId) {
    setLoadingDetail(true)
    try {
      const res = await api.getClusterById(clusterId)
      setClusterDetail(res.cluster || null)
    } catch (err) {
      console.error('Failed to load cluster detail:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  useEffect(() => {
    loadClusters()
  }, [])

  const defaultCenter = [33.6844, 73.0479]
  const mapCenter = selectedCluster?.centroid_lat && selectedCluster?.centroid_lon
    ? [selectedCluster.centroid_lat, selectedCluster.centroid_lon]
    : defaultCenter

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Layers size={13} className="text-indigo-600" />
            <span>Geospatial Deduplication Engine (&lt; 250m)</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            Repeated Problems & Clusters
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Automatically links multiple citizen reports submitted within a 200–250 meter radius into a unified public works work order.
          </p>
        </div>

        <button
          type="button"
          onClick={loadClusters}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
          title="Refresh Clusters"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-600' : ''} />
        </button>
      </section>

      {/* Value Proposition Callout */}
      <section className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600 text-white font-black text-sm">
            4:1
          </div>
          <div>
            <h4 className="font-bold text-slate-900">
              Multiple Citizens &rarr; Same Physical Problem &rarr; One Coordinated Municipal Action
            </h4>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Prevents duplicate dispatching of field crews, pools citizen evidence, and recalculates urgency when multiple citizens flag the same hazard.
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid: Clusters List + Centroid Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Clusters List (1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-sm text-slate-900">
            Active Hazard Clusters ({clusters.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2 bg-white rounded-2xl border border-slate-200">
              <RefreshCw size={18} className="animate-spin text-emerald-600" />
              <span>Scanning repeated coordinates...</span>
            </div>
          ) : clusters.length > 0 ? (
            <div className="space-y-3">
              {clusters.map((cluster) => {
                const isSelected = (selectedCluster?.id || selectedCluster?._id) === (cluster.id || cluster._id)
                const score = Math.round(cluster.avg_risk_score || 50)
                const reportCount = cluster.report_count || cluster.report_ids?.length || 1

                return (
                  <div
                    key={cluster.id || cluster._id || cluster.cluster_code}
                    onClick={() => {
                      setSelectedCluster(cluster)
                      loadClusterDetail(cluster.id || cluster._id || cluster.cluster_code)
                    }}
                    className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all space-y-2.5 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {cluster.cluster_code || 'CLUSTER'}
                      </span>
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] border border-rose-200">
                        Master Priority: {score}/100
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                      {cluster.title || `Proximity Group: ${cluster.category || 'Road Hazard'}`}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Users size={12} className="text-indigo-600" />
                        <span>{reportCount} Citizen Reports</span>
                      </span>
                      <span className="capitalize font-medium text-slate-500">
                        {cluster.status || 'Active'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              No repeated clusters detected. All recent reports are geographically distinct (&gt; 250m).
            </div>
          )}
        </div>

        {/* Right: Centroid Map & Grouped Reports (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Centroid Map */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs h-72 relative">
            <MapContainer
              center={mapCenter}
              zoom={15}
              scrollWheelZoom={false}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              {clusters.map((c) => {
                if (!c.centroid_lat || !c.centroid_lon) return null
                const isSelected = (selectedCluster?.id || selectedCluster?._id) === (c.id || c._id)

                return (
                  <CircleMarker
                    key={c.id || c._id || c.cluster_code}
                    center={[c.centroid_lat, c.centroid_lon]}
                    radius={isSelected ? 16 : 12}
                    pathOptions={{
                      fillColor: isSelected ? '#4338ca' : '#6366f1',
                      color: '#312e81',
                      weight: 2,
                      fillOpacity: 0.85
                    }}
                    eventHandlers={{
                      click: () => {
                        setSelectedCluster(c)
                        loadClusterDetail(c.id || c._id || c.cluster_code)
                      }
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1">
                        <strong>{c.title || c.cluster_code}</strong>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {c.report_count || c.report_ids?.length || 1} Citizen Reports Grouped
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>

          {/* Grouped Reports Detail Panel */}
          {selectedCluster && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {selectedCluster.cluster_code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {selectedCluster.title || 'Civic Hazard Cluster Details'}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Radius Threshold:</span>
                  <strong className="text-xs font-mono text-slate-800">200–250 Meters</strong>
                </div>
              </div>

              {loadingDetail ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Loading grouped citizen dossiers...
                </div>
              ) : clusterDetail?.reports && clusterDetail.reports.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Linked Citizen Submissions ({clusterDetail.reports.length}):
                  </span>

                  {clusterDetail.reports.map((rep) => (
                    <div
                      key={rep.id || rep._id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {rep.tracking_id}
                          </span>
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Score: {rep.civic_risk_score?.score || 50}/100
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-900">{rep.title}</h5>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {rep.location?.address || 'Islamabad ICT'}
                        </p>
                      </div>

                      <Link
                        to={`/gov/reports/${rep.id || rep._id}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 transition-colors flex items-center gap-1"
                      >
                        <span>Open Case</span>
                        <ArrowRight size={11} />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Cluster registered with {selectedCluster.report_count || 1} report(s).
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
