import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin, Filter, Layers, AlertTriangle, CheckCircle2,
  RefreshCw, ShieldAlert, ArrowRight, Building, Clock
} from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import * as api from '../../services/api'

function MapRecenter({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 13)
    }
  }, [center, zoom, map])
  return null
}

export default function GovProblemMapPage() {
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'critical', 'high', 'medium', 'low', 'repeated', 'resolved', 'disputed'
  const [selectedPin, setSelectedPin] = useState(null)
  const [mapCenter, setMapCenter] = useState([33.6844, 73.0479])
  const [zoomLevel, setZoomLevel] = useState(13)

  async function loadMapData() {
    setLoading(true)
    try {
      const res = await api.getHotspots()
      const list = res.hotspots || []
      setPins(list)
      const firstValid = list.find(p => p.latitude && p.longitude)
      if (firstValid) {
        setMapCenter([firstValid.latitude, firstValid.longitude])
      }
    } catch (err) {
      console.error('Failed to load map data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMapData()
  }, [])

  const filteredPins = pins.filter(p => {
    const score = p.risk_score || 50
    if (filter === 'critical') return score >= 75 || p.risk_level === 'CRITICAL'
    if (filter === 'high') return score >= 50 && score < 75 || p.risk_level === 'HIGH'
    if (filter === 'medium') return score >= 25 && score < 50 || p.risk_level === 'MEDIUM'
    if (filter === 'low') return score < 25 || p.risk_level === 'LOW'
    if (filter === 'repeated') return p.type === 'cluster' || !!p.cluster_id
    if (filter === 'resolved') return ['resolved', 'closed'].includes(p.status)
    if (filter === 'disputed') return p.status === 'disputed'
    return true
  })

  const getMarkerColor = (pin) => {
    if (pin.status === 'disputed') return { fill: '#ea580c', stroke: '#9a3412' } // Orange/red
    if (['resolved', 'closed'].includes(pin.status)) return { fill: '#10b981', stroke: '#047857' }
    if (pin.type === 'cluster' || pin.cluster_id) return { fill: '#6366f1', stroke: '#4338ca' }
    const score = pin.risk_score || 50
    if (score >= 75) return { fill: '#ef4444', stroke: '#b91c1c' }
    if (score >= 50) return { fill: '#f59e0b', stroke: '#b45309' }
    return { fill: '#0ea5e9', stroke: '#0369a1' }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <MapPin size={13} className="text-emerald-600" />
            <span>Government Geospatial Command</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            Government Problem Map
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Real-time geospatial hazard pins, cluster centroids (&lt; 250m), and priority distribution across Islamabad Capital Territory.
          </p>
        </div>

        <button
          type="button"
          onClick={loadMapData}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
          title="Refresh Map Coordinates"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-600' : ''} />
        </button>
      </section>

      {/* Filter Tabs */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { key: 'all', label: `All (${pins.length})` },
            { key: 'critical', label: 'Critical (≥ 75)' },
            { key: 'high', label: 'High Priority (50-74)' },
            { key: 'medium', label: 'Medium' },
            { key: 'repeated', label: 'Repeated Clusters' },
            { key: 'disputed', label: 'Citizen Disputed' },
            { key: 'resolved', label: 'Resolved' }
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                filter === item.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* Map Canvas and Operational Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Map (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs h-[560px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/75 backdrop-blur-xs z-[1000] flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
              <RefreshCw size={16} className="animate-spin text-emerald-600" />
              <span>Updating geospatial coordinates...</span>
            </div>
          )}

          <MapContainer
            center={mapCenter}
            zoom={zoomLevel}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <MapRecenter center={mapCenter} zoom={zoomLevel} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />

            {filteredPins.map((pin) => {
              if (!pin.latitude || !pin.longitude) return null
              const colors = getMarkerColor(pin)
              const isCluster = pin.type === 'cluster'
              const radius = isCluster ? 15 : 10

              return (
                <CircleMarker
                  key={pin.id || `${pin.latitude}-${pin.longitude}`}
                  center={[pin.latitude, pin.longitude]}
                  radius={radius}
                  pathOptions={{
                    fillColor: colors.fill,
                    color: colors.stroke,
                    weight: 2,
                    fillOpacity: 0.85
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedPin(pin)
                      setMapCenter([pin.latitude, pin.longitude])
                      setZoomLevel(15)
                    }
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-1.5 text-xs min-w-[220px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                          {pin.tracking_id || pin.cluster_code || 'CASE'}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-slate-600">
                          {pin.status || 'Active'}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 leading-snug">
                        {pin.title}
                      </h4>

                      <p className="text-[11px] text-slate-600 truncate">
                        {pin.address || 'Islamabad ICT'}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                        <span className="text-slate-500">Risk Score:</span>
                        <strong className="text-slate-900 font-mono">{pin.risk_score || 50}/100</strong>
                      </div>

                      {pin.id && (
                        <div className="pt-1.5">
                          <Link
                            to={pin.type === 'cluster' ? `/gov/repeated` : `/gov/reports/${pin.id}`}
                            className="w-full py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] text-center block shadow-xs transition-colors"
                          >
                            Open Case Dossier
                          </Link>
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>

          {/* Operational Legend */}
          <div className="absolute bottom-4 left-4 z-[999] bg-white/95 backdrop-blur-xs border border-slate-200 p-3.5 rounded-xl shadow-xs text-xs space-y-1.5">
            <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider block mb-1">
              Risk Hierarchy
            </span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-700"></span>
              <span className="text-slate-700 text-[11px]">Critical (&ge; 75)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-700"></span>
              <span className="text-slate-700 text-[11px]">High (50 - 74)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500 border border-indigo-700"></span>
              <span className="text-slate-700 text-[11px]">Repeated Cluster (&lt; 250m)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-700"></span>
              <span className="text-slate-700 text-[11px]">Resolved Works</span>
            </div>
          </div>
        </div>

        {/* Operational Inspector Sidebar (1 col) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col h-[560px]">
          <div className="border-b border-slate-100 pb-3 mb-3">
            <h3 className="font-bold text-sm text-slate-900">
              {selectedPin ? 'Selected Pin Dossier' : `Filtered Pins (${filteredPins.length})`}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select any pin on the map to view field coordinates and operational status.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredPins.length > 0 ? (
              filteredPins.map((pin) => {
                const isSelected = selectedPin?.id === pin.id
                return (
                  <div
                    key={pin.id || `${pin.latitude}-${pin.longitude}`}
                    onClick={() => {
                      setSelectedPin(pin)
                      if (pin.latitude && pin.longitude) {
                        setMapCenter([pin.latitude, pin.longitude])
                        setZoomLevel(15)
                      }
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {pin.tracking_id || pin.cluster_code || 'CASE'}
                      </span>
                      <span className="text-[10px] font-bold text-rose-700">
                        {pin.risk_score || 50}/100
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 line-clamp-1">
                      {pin.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {pin.address || 'Islamabad ICT'}
                    </p>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[10px]">
                      <span className="text-slate-400 capitalize">{pin.status || 'Active'}</span>
                      {pin.id && (
                        <Link
                          to={pin.type === 'cluster' ? `/gov/repeated` : `/gov/reports/${pin.id}`}
                          className="font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>Manage</span>
                          <ArrowRight size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No pins match the active filter criteria.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
