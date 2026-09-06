import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  PlusCircle, Camera, Mic, FileText, MapPin, CheckCircle2,
  Clock, AlertTriangle, ArrowRight, Shield, RefreshCw, Sparkles
} from 'lucide-react'
import * as api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [myReports, setMyReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCitizenStats() {
      setLoading(true)
      try {
        const res = await api.getMyReports()
        setMyReports(res?.reports || [])
      } catch (err) {
        console.error('[Citizen Home] Error loading my reports:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCitizenStats()
  }, [])

  // Calculate real DB metrics for the logged-in citizen
  const totalCount = myReports.length
  const activeCount = myReports.filter((r) =>
    ['submitted', 'in_review', 'assigned', 'in_progress', 'disputed'].includes(r.status)
  ).length
  const resolvedCount = myReports.filter((r) =>
    ['resolved', 'closed'].includes(r.status)
  ).length
  const needsResponseCount = myReports.filter((r) => r.status === 'resolved').length

  const recentReports = myReports.slice(0, 4)

  return (
    <div className="space-y-8 pb-12">
      {/* 1. WELCOME HERO BANNER */}
      <section className="bg-white border border-[#0c1824]/8 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/8 via-teal-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-2xl space-y-3.5 relative z-10">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-200/80 inline-flex items-center gap-1.5 shadow-2xs font-display">
            <span>🇵🇰 Public Civic Service Platform</span>
          </span>

          <h1 className="text-3xl sm:text-4xl font-black text-[#0c1824] tracking-tight leading-tight font-display">
            Welcome to Raabta AI
          </h1>

          <p className="text-sm sm:text-base text-[#3e4c59] leading-relaxed font-normal">
            Report a municipal problem in your area. Our multimodal AI analyzes photo, voice, and GPS coordinates to triage directly to the responsible authority.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/app/report')}
              className="btn-primary py-3.5 px-8 text-sm rounded-xl font-bold"
            >
              <PlusCircle size={18} />
              <span>+ Report a Problem</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. CITIZEN DASHBOARD METRICS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0c1824] font-display">
            My Activity Overview
          </h2>
          <Link
            to="/app/reports"
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 rounded-2xl bg-white border border-[#0c1824]/8 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-5 rounded-2xl bg-white border border-[#0c1824]/8 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[#627282] font-semibold block text-[11px] uppercase tracking-wider font-display">Active Reports</span>
                <p className="text-3xl font-black text-[#0c1824] mt-1 font-display">{activeCount}</p>
                <p className="text-[10px] text-[#627282] mt-0.5">Being processed by departments</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center justify-center">
                <Clock size={20} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#0c1824]/8 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[#627282] font-semibold block text-[11px] uppercase tracking-wider font-display">Total Reports</span>
                <p className="text-3xl font-black text-[#0c1824] mt-1 font-display">{totalCount}</p>
                <p className="text-[10px] text-[#627282] mt-0.5">All incidents filed by you</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-slate-50 text-slate-700 border border-slate-200/80 flex items-center justify-center">
                <FileText size={20} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#0c1824]/8 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[#627282] font-semibold block text-[11px] uppercase tracking-wider font-display">Resolved</span>
                <p className="text-3xl font-black text-emerald-800 mt-1 font-display">{resolvedCount}</p>
                <p className="text-[10px] text-[#627282] mt-0.5">Fixed by municipal teams</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
            </div>
          </div>
        )}

        {/* Action alert banner if reports await citizen resolution confirmation */}
        {needsResponseCount > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} className="text-amber-700 shrink-0" />
              <div>
                <p className="font-bold text-amber-950 font-display">
                  {needsResponseCount} report{needsResponseCount > 1 ? 's' : ''} marked as fixed by department
                </p>
                <p className="text-[11px] text-amber-800">
                  Please inspect the location and confirm whether the problem is actually resolved.
                </p>
              </div>
            </div>
            <Link
              to="/app/reports?tab=response"
              className="py-1.5 px-3.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shrink-0 shadow-sm transition-colors"
            >
              Verify Now
            </Link>
          </div>
        )}
      </section>

      {/* 3. QUICK REPORT ACTIONS */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-[#0c1824] font-display">
          How would you like to report?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: Photo */}
          <div
            onClick={() => navigate('/app/report')}
            className="p-5 rounded-2xl bg-white border border-[#0c1824]/8 hover:border-emerald-600/40 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center transition-transform group-hover:scale-105">
                <Camera size={20} />
              </div>
              <h3 className="text-sm font-bold text-[#0c1824] group-hover:text-emerald-800 transition-colors font-display">
                Report with Photo
              </h3>
              <p className="text-xs text-[#627282] leading-relaxed">
                Take or upload a photo of the problem showing damage and surroundings.
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 mt-4 flex items-center gap-1 font-display">
              <span>Start Photo Report</span>
              <ArrowRight size={12} />
            </span>
          </div>

          {/* Card 2: Voice */}
          <div
            onClick={() => navigate('/app/report')}
            className="p-5 rounded-2xl bg-white border border-[#0c1824]/8 hover:border-teal-600/40 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-800 border border-teal-200/80 flex items-center justify-center transition-transform group-hover:scale-105">
                <Mic size={20} />
              </div>
              <h3 className="text-sm font-bold text-[#0c1824] group-hover:text-teal-800 transition-colors font-display">
                Report with Voice
              </h3>
              <p className="text-xs text-[#627282] leading-relaxed">
                Tell us what happened in Urdu or English. Raabta AI transcribes and structures it.
              </p>
            </div>
            <span className="text-[11px] font-bold text-teal-800 mt-4 flex items-center gap-1 font-display">
              <span>Record Voice Note</span>
              <ArrowRight size={12} />
            </span>
          </div>

          {/* Card 3: Text */}
          <div
            onClick={() => navigate('/app/report')}
            className="p-5 rounded-2xl bg-white border border-[#0c1824]/8 hover:border-purple-600/40 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-800 border border-purple-200/80 flex items-center justify-center transition-transform group-hover:scale-105">
                <FileText size={20} />
              </div>
              <h3 className="text-sm font-bold text-[#0c1824] group-hover:text-purple-800 transition-colors font-display">
                Write a Report
              </h3>
              <p className="text-xs text-[#627282] leading-relaxed">
                Describe the problem. Raabta AI will automatically route it to the right agency.
              </p>
            </div>
            <span className="text-[11px] font-bold text-purple-800 mt-4 flex items-center gap-1 font-display">
              <span>Write Description</span>
              <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </section>

      {/* 4. RECENT REPORTS */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-[#0c1824] font-display">
          My Recent Reports
        </h2>

        {loading ? (
          <div className="p-8 text-center bg-white border border-[#0c1824]/8 rounded-2xl">
            <RefreshCw size={20} className="animate-spin text-emerald-700 mx-auto" />
            <p className="text-xs text-[#627282] mt-2">Loading your reports...</p>
          </div>
        ) : recentReports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentReports.map((item) => {
              const priorityScore = item.civic_risk_score?.score || 50
              const isResolved = ['resolved', 'closed'].includes(item.status)
              const isDisputed = item.status === 'disputed'

              return (
                <Link
                  key={item.id || item._id}
                  to={`/app/reports/${item.id || item._id || item.tracking_id}`}
                  className="p-4 rounded-2xl bg-white border border-[#0c1824]/8 hover:border-emerald-600/40 shadow-sm hover:shadow-md transition-all block space-y-2.5 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-emerald-900 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80">
                      {item.tracking_id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        isResolved
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isDisputed
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#0c1824] group-hover:text-emerald-800 transition-colors line-clamp-1 font-display">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#627282] mt-0.5 flex items-center gap-1">
                      <MapPin size={12} className="text-emerald-700 shrink-0" />
                      <span className="truncate">{item.location?.address || 'Islamabad'}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-100 text-[#627282]">
                    <span>Priority: <strong className="font-display">{priorityScore}/100</strong></span>
                    <span className="text-emerald-800 font-semibold group-hover:underline">View Details →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="p-8 sm:p-12 text-center bg-white border border-[#0c1824]/8 rounded-3xl space-y-3 shadow-sm">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText size={24} />
            </div>
            <h3 className="text-base font-bold text-[#0c1824] font-display">
              You haven't reported any problems yet.
            </h3>
            <p className="text-xs text-[#627282] max-w-sm mx-auto">
              Whenever you notice road damage, electrical hazards, garbage, or water issues, report them here.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/app/report')}
                className="btn-primary py-2.5 px-6 text-xs rounded-xl"
              >
                + Report a Problem
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
