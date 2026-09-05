import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin, Filter, Layers, AlertTriangle, CheckCircle2,
  RefreshCw, ShieldAlert, Navigation, ArrowRight, ExternalLink
} from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import * as api from '../services/api'

// Helper component to center map when selected
function MapRecenter({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 13)
    }
  }, [center, zoom, map])
  return null
}

export default function CitizenProblemMapPage() {
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'serious', 'repeated', 'resolved'
  const [selectedPin, setSelectedPin] = useState(null)
  const [mapCenter, setMapCenter] = useState([33.6844, 73.0479]) // Islamabad default
  const [zoomLevel, setZoomLevel] = useState(13)

  async function loadMapData() {
    setLoading(true)
    try {
      const res = await api.getHotspots()
      const hotspots = res.hotspots || []
      setPins(hotspots)

      // Center map around first valid pin if available
      const firstValid = hotspots.find(p => p.latitude && p.longitude)
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

  // Filter pins based on user selection
  const filteredPins = pins.filter(p => {
    if (filter === 'serious') {
      return (p.risk_score || 0) >= 50 || ['CRITICAL', 'HIGH'].includes(p.risk_level)
    }
    if (filter === 'repeated') {
      return p.type === 'cluster' || p.cluster_id
    }
    if (filter === 'resolved') {
      return ['resolved', 'closed'].includes(p.status)
    }
    return true
  })

  // Color selection based on risk and status
  const getMarkerColor = (pin) => {
    if (['resolved', 'closed'].includes(pin.status)) {
      return { fill: '#10b981', stroke: '#047857' } // Emerald green
    }
    if (pin.type === 'cluster' || pin.cluster_id) {
      return { fill: '#6366f1', stroke: '#4338ca' } // Indigo for repeated
    }
    const score = pin.risk_score || 50
    if (score >= 75) return { fill: '#ef4444', stroke: '#b91c1c' } // Rose red
    if (score >= 50) return { fill: '#f59e0b', stroke: '#b45309' } // Amber orange
    return { fill: '#0ea5e9', stroke: '#0369a1' } // Sky blue
  }

  const counts = {
    all: pins.length,
    serious: pins.filter(p => (p.risk_score || 0) >= 50 || ['CRITICAL', 'HIGH'].includes(p.risk_level)).length,
    repeated: pins.filter(p => p.type === 'cluster' || p.cluster_id).length,
    resolved: pins.filter(p => ['resolved', 'closed'].includes(p.status)).length
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <MapPin size={13} className="text-emerald-600" />
              <span>Interactive Civic Map</span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
              Problem Map
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Explore reported civic problems, repeated hazard clusters, and resolved public works in your neighborhood.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadMapData}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Refresh Map"
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

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Reports ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilter('serious')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'serious'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
            }`}
          >
            <AlertTriangle size={13} />
            <span>Serious Problems ({counts.serious})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('repeated')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'repeated'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
            }`}
          >
            <Layers size={13} />
            <span>Repeated Problems ({counts.repeated})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('resolved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'resolved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>Resolved ({counts.resolved})</span>
          </button>
        </div>
      </section>

      {/* Main Map Canvas and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Container (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs h-[540px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/75 backdrop-blur-xs z-[1000] flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
              <RefreshCw size={16} className="animate-spin text-emerald-600" />
              <span>Loading civic coordinates...</span>
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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {filteredPins.map((pin) => {
              if (!pin.latitude || !pin.longitude) return null
              const colors = getMarkerColor(pin)
              const isCluster = pin.type === 'cluster'
              const radius = isCluster ? 14 : 9

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
                    <div className="p-1 space-y-1.5 text-xs min-w-[200px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {pin.tracking_id || pin.cluster_code || 'REPORT'}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-slate-600">
                          {pin.status || 'Active'}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 leading-snug">
                        {pin.title}
                      </h4>

                      <p className="text-[11px] text-slate-600 truncate">
                        {pin.address || 'Islamabad Capital Territory'}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                        <span className="text-slate-500">Priority Score:</span>
                        <strong className="text-slate-900">{pin.risk_score || 50}/100</strong>
                      </div>

                      {pin.id && (
                        <div className="pt-1">
                          <Link
                            to={`/app/reports/${pin.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
                          >
                            <span>View details</span>
                            <ArrowRight size={11} />
                          </Link>
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 z-[999] bg-white/95 backdrop-blur-xs border border-slate-200 p-3 rounded-xl shadow-xs text-xs space-y-1.5">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block mb-1">
              Legend
            </span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-700"></span>
              <span className="text-slate-600 text-[11px]">High / Critical Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500 border border-indigo-700"></span>
              <span className="text-slate-600 text-[11px]">Repeated Problem Cluster</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-700"></span>
              <span className="text-slate-600 text-[11px]">Resolved Works</span>
            </div>
          </div>
        </div>

        {/* Sidebar: Selected or Filtered List (1 col) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col h-[540px]">
          <div className="border-b border-slate-100 pb-3 mb-3">
            <h3 className="font-bold text-sm text-slate-900">
              {selectedPin ? 'Selected Problem' : `Nearby Reports (${filteredPins.length})`}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {selectedPin ? 'Click any card to inspect coordinates' : 'Click a marker or item below to center map'}
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
                        {pin.tracking_id || pin.cluster_code || 'REPORT'}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 capitalize">
                        {pin.status || 'active'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 line-clamp-1">
                      {pin.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {pin.address || 'Islamabad'}
                    </p>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[10px]">
                      <span className="text-slate-400">Score: {pin.risk_score || 50}/100</span>
                      {pin.id && (
                        <Link
                          to={`/app/reports/${pin.id}`}
                          className="font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>Details</span>
                          <ArrowRight size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No problems found matching filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
