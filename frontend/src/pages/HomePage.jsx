import { useNavigate } from 'react-router-dom'
import {
  Sparkles, MapPin, ArrowRight, Brain, Shield, FileText,
  HelpCircle, Activity, Landmark, TrendingUp, Layers
} from 'lucide-react'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-10 pb-12">
      {/* HERO SECTION WITH FAISAL MOSQUE EMERALD THEME */}
      <section className="glass-panel relative overflow-hidden p-8 md:p-12 lg:p-14 border border-emerald-950/20 bg-slate-950/50 rounded-3xl">
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-[0.20] filter blur-[1.5px]"
          style={{
            backgroundImage: 'url("/faisal_mosque_bg.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-[#0b0f19]/75 via-[#0b0f19]/92 to-[#070a12]/98" />

        <div className="relative z-10 max-w-4xl space-y-6">
          {/* Logo & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-green flex items-center gap-1.5 bg-[#0b6b3a]/15 border-[#0b6b3a]/30 text-emerald-400 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              🟢 Live Portal Active
            </span>
            <span className="badge badge-blue flex items-center gap-1 bg-slate-900/60 border-slate-800 text-slate-300 text-[10px]">
              <Brain size={12} className="text-emerald-500" />
              <span>Gemma AI Multimodal</span>
            </span>
            <span className="badge badge-purple flex items-center gap-1 bg-slate-900/60 border-slate-800 text-slate-300 text-[10px]">
              <Layers size={12} className="text-indigo-400" />
              <span>Proximity Clustering (&lt; 250m)</span>
            </span>
            <span className="badge badge-blue flex items-center gap-1 bg-slate-900/60 border-slate-800 text-slate-300 text-[10px]">
              <Shield size={12} className="text-emerald-500" />
              <span>0-100 Civic Risk Engine</span>
            </span>
          </div>

          <div className="mt-2 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#006C35] to-[#10b981] text-white font-extrabold text-2xl shadow-lg border border-emerald-500/20">
              🇵🇰
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                Raabta AI — Civic Intelligence Platform
              </h1>
              <p className="mt-1 text-sm font-semibold text-[#10b981] uppercase tracking-widest flex items-center gap-1.5">
                <Shield size={14} />
                <span>Government of Pakistan • National Civic Dispatch & Triage Layer</span>
              </p>
            </div>
          </div>

          <p className="text-sm md:text-base leading-relaxed text-slate-300 max-w-3xl font-medium">
            Transforming municipal governance in Pakistan. Citizens report hazards through photo, Urdu/English voice recordings, or text. Our AI computes an explainable <strong>0–100 Civic Risk Score</strong>, merges duplicate reports within 250m into master clusters, and dispatches directly to IESCO, CDA, WASA, SNGPL, and IWMC.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/submit')}
              className="btn-primary py-3 px-6 text-sm flex items-center gap-2 shadow-lg shadow-emerald-950"
            >
              <Sparkles size={18} />
              <span>File Civic Incident</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/department')}
              className="btn-secondary py-3 px-6 text-sm flex items-center gap-2"
            >
              <Landmark size={18} className="text-[#10b981]" />
              <span>Operations Command Center</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/insights')}
              className="btn-secondary py-3 px-5 text-sm flex items-center gap-2"
            >
              <TrendingUp size={18} className="text-indigo-400" />
              <span>Hotspots & Insights</span>
            </button>
          </div>
        </div>
      </section>

      {/* CORE PLATFORM CAPABILITIES GRID */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles size={18} className="text-[#10b981]" />
              <span>Platform Command Portals</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select a portal to explore citizen reporting, risk triage, departmental workflow, or strategic insights.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Citizen Grievance Studio */}
          <article
            onClick={() => navigate('/submit')}
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 cursor-pointer transition-all duration-300 group flex flex-col justify-between shadow-lg"
          >
            <div className="space-y-3">
              <div className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl w-fit">
                <FileText size={24} />
              </div>
              <h3 className="text-base font-bold text-white">File Incident</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multimodal submission supporting camera photo analysis, Urdu/English voice note recordings, and text with auto GPS geocoding.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-emerald-400 font-semibold text-xs group-hover:gap-3 transition-all">
              <span>Launch Studio</span>
              <ArrowRight size={14} />
            </div>
          </article>

          {/* Card 2: Operations Command Center */}
          <article
            onClick={() => navigate('/department')}
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-blue-500/40 cursor-pointer transition-all duration-300 group flex flex-col justify-between shadow-lg"
          >
            <div className="space-y-3">
              <div className="text-blue-400 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl w-fit">
                <Landmark size={24} />
              </div>
              <h3 className="text-base font-bold text-white">Command Center</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Risk-first prioritized dispatch queue for municipal agencies (IESCO, CDA, WASA). Field assignment and resolution proof uploads.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-blue-400 font-semibold text-xs group-hover:gap-3 transition-all">
              <span>View Operations Queue</span>
              <ArrowRight size={14} />
            </div>
          </article>

          {/* Card 3: Hotspots & Analytics */}
          <article
            onClick={() => navigate('/insights')}
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-indigo-500/40 cursor-pointer transition-all duration-300 group flex flex-col justify-between shadow-lg"
          >
            <div className="space-y-3">
              <div className="text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl w-fit">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-base font-bold text-white">Civic Hotspots</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Geospatial Leaflet map visualization of active hazard clusters, departmental response SLAs, and citizen satisfaction trends.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-indigo-400 font-semibold text-xs group-hover:gap-3 transition-all">
              <span>Open Hotspots Map</span>
              <ArrowRight size={14} />
            </div>
          </article>

          {/* Card 4: Case Tracker & PDF Dossiers */}
          <article
            onClick={() => navigate('/track')}
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-amber-500/40 cursor-pointer transition-all duration-300 group flex flex-col justify-between shadow-lg"
          >
            <div className="space-y-3">
              <div className="text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl w-fit">
                <Activity size={24} />
              </div>
              <h3 className="text-base font-bold text-white">Track Dossiers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Search permanent tracking IDs, inspect audit timelines, verify or dispute municipal repairs, and export official PDF dossiers.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-amber-400 font-semibold text-xs group-hover:gap-3 transition-all">
              <span>Track Incidents</span>
              <ArrowRight size={14} />
            </div>
          </article>
        </div>
      </section>

      {/* DISPATCH LIFECYCLE BAR */}
      <section className="glass-panel p-6 border border-slate-900 bg-slate-950/40 rounded-2xl">
        <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
          End-to-End Civic Intelligence Lifecycle
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5 text-center">
          {[
            { step: '1', title: 'Multimodal Ingestion', desc: 'Photo, Urdu/English voice note, or text with verified GPS' },
            { step: '2', title: '0-100 Risk Engine', desc: '5-factor mathematical weighting (Safety, Severity, Impact, Location, Evidence)' },
            { step: '3', title: 'Proximity Clustering', desc: 'Merges duplicates within 250m into unified master cluster' },
            { step: '4', title: 'Agency Dispatch', desc: 'Field assignment to IESCO, CDA, or WASA with strict SLA target' },
            { step: '5', title: 'Citizen Verification', desc: 'Citizen inspects before/after photos and accepts or disputes closure' },
          ].map((item, index) => (
            <div key={index} className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 flex flex-col items-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006C35]/15 border border-[#006C35]/30 text-[#10b981] text-xs font-bold mb-2">
                {item.step}
              </div>
              <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
