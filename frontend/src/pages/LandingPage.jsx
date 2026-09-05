import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, CheckCircle2, Shield, ShieldCheck, AlertTriangle,
  MapPin, Mic, FileText, Download, Building,
  Landmark, Activity, Zap, Layers, Menu, X,
  Sliders, Eye, Clock, LogIn, UserPlus, LogOut,
  Sparkles, Check, ChevronRight, CornerDownRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import Hero3DVisual from '../components/Hero3DVisual'

export default function LandingPage() {
  const { currentUser, role, logout, isAuthenticated } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activePreviewTab, setActivePreviewTab] = useState('risk-gauge')

  const portalRoute =
    role === 'admin' ? '/admin' :
    role === 'officer' ? '/department' :
    '/track'

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-900 font-sans overflow-x-hidden antialiased">

      {/* 1. COMPACT STICKY NAVIGATION (h-14 / 56px) */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Logo size="md" to="/" theme="light" />

          {/* Desktop Navigation Links with subtle hover line */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600">
            <a href="#home" className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-colors">
              Overview
            </a>
            <a href="#risk-engine" className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-colors">
              Risk Engine
            </a>
            <a href="#clustering" className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-colors">
              250m Deduplication
            </a>
            <a href="#voice-intake" className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-colors">
              Multimodal Voice
            </a>
            <a href="#command-center" className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-colors">
              Command Dispatch
            </a>
            <a href="#preview" className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-colors">
              Interactive Preview
            </a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to={portalRoute}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-900/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Open Portal ({role})</span>
                  <ArrowRight size={13} />
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Portal Login
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-900/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <UserPlus size={13} />
                  <span>Citizen Access</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-b border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg"
            >
              <div className="flex flex-col space-y-1 text-xs font-semibold text-slate-700">
                <a href="#home" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">Overview</a>
                <a href="#risk-engine" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">Risk Engine</a>
                <a href="#clustering" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">250m Deduplication</a>
                <a href="#voice-intake" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">Multimodal Voice</a>
                <a href="#command-center" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">Command Dispatch</a>
                <a href="#preview" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">Interactive Preview</a>
              </div>
              <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      to={portalRoute}
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2 text-center text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow"
                    >
                      Open Portal ({role})
                    </Link>
                    <button
                      type="button"
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="w-full py-2 text-center text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2 text-center text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
                    >
                      Portal Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2 text-center text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow"
                    >
                      Citizen Access
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* 2. REFINED COMPACT HERO SECTION */}
        <section id="home" className="relative pt-6 pb-8 md:pt-8 md:pb-12 overflow-hidden bg-gradient-to-b from-[#faf9f6] via-white to-[#f8fafc]">
          {/* Subtle ambient lighting */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-gradient-to-b from-emerald-500/8 via-teal-500/5 to-transparent blur-[120px] rounded-full" />
            <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500/4 blur-[100px] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* 2-Column Balanced Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">

              {/* LEFT COLUMN: Editorial Typography & Clean CTAs */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="lg:col-span-6 space-y-4 text-left"
              >
                {/* Eyebrow badge */}
                <motion.div variants={itemVariants} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold shadow-2xs">
                  <span>🇵🇰</span>
                  <span>National Civic Intelligence & Municipal Dispatch</span>
                </motion.div>

                {/* Strong, compact editorial headline */}
                <motion.h1
                  variants={itemVariants}
                  className="text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight text-slate-900 leading-[1.18]"
                >
                  Intelligent Civic Triage.<br />
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 bg-clip-text text-transparent">
                    Accelerated Municipal Response.
                  </span>
                </motion.h1>

                {/* Short, concise 2-sentence description */}
                <motion.p
                  variants={itemVariants}
                  className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed max-w-xl"
                >
                  Empowering citizens and municipal departments with multimodal AI. Report hazards via Urdu or English voice notes and photos; our platform calculates an explainable <strong>0–100 Civic Risk Score</strong>, merges <strong>250m</strong> duplicate clusters, and dispatches directly to verified authorities.
                </motion.p>

                {/* CTAs with hover micro-animations */}
                <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2.5 pt-1">
                  {isAuthenticated ? (
                    <Link
                      to={portalRoute}
                      className="group inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-900/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <span>Go to Your Portal ({role})</span>
                      <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/signup"
                        className="group inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-900/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <UserPlus size={15} />
                        <span>Citizen Access</span>
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                      <Link
                        to="/login"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs sm:text-sm shadow-2xs transition-all"
                      >
                        <LogIn size={14} className="text-emerald-600" />
                        <span>Portal Login</span>
                      </Link>
                    </>
                  )}
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-xs transition-colors"
                  >
                    <span>Architecture Flow</span>
                    <ChevronRight size={14} />
                  </a>
                </motion.div>

                {/* Compact Integrated Agencies Pill Ribbon */}
                <motion.div variants={itemVariants} className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Integrated:</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">⚡ IESCO</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">🛣️ CDA</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">💧 WASA</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">🔥 SNGPL</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">🚨 Rescue 1122</span>
                </motion.div>

                {/* 3 Core Architecture Metrics */}
                <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80">
                  <div>
                    <p className="text-base font-black text-slate-900 tracking-tight">0–100</p>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">Explainable Risk SLA</p>
                  </div>
                  <div>
                    <p className="text-base font-black text-emerald-700 tracking-tight">250m</p>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">Haversine Merge</p>
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-900 tracking-tight">Urdu + EN</p>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">Multimodal Voice</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* RIGHT COLUMN: Controlled 3D RAABTA Hub */}
              <div className="lg:col-span-6 flex items-center justify-center">
                <Hero3DVisual />
              </div>

            </div>

            {/* REAL ARCHITECTURE FLOW DIAGRAM (Visible peek above fold) */}
            <div id="how-it-works" className="mt-8 pt-6 border-t border-slate-200/80">
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                      Raabta AI End-to-End Triage Pipeline
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                    From Hazard Ingestion to Citizen Confirmation
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 sm:gap-3">
                  {[
                    { title: '1. Incident Intake', desc: 'Photo, Urdu Voice, GPS', icon: Mic, color: 'text-blue-600 bg-blue-50' },
                    { title: '2. Multimodal AI', desc: 'Gemma 3.6 vision & speech', icon: Eye, color: 'text-indigo-600 bg-indigo-50' },
                    { title: '3. 0–100 Risk Score', desc: '5-factor mathematical SLA', icon: Sliders, color: 'text-amber-600 bg-amber-50' },
                    { title: '4. 250m Clustering', desc: 'Haversine deduplication', icon: Layers, color: 'text-purple-600 bg-purple-50' },
                    { title: '5. Agency Dispatch', desc: 'Duty officer command queue', icon: Landmark, color: 'text-emerald-600 bg-emerald-50' },
                    { title: '6. Citizen Verify', desc: 'Photo proof & PDF dossier', icon: CheckCircle2, color: 'text-teal-600 bg-teal-50' }
                  ].map((node, i) => {
                    const NodeIcon = node.icon
                    return (
                      <div
                        key={node.title}
                        className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col items-center text-center space-y-1 relative group hover:border-emerald-500/40 hover:bg-white transition-all shadow-2xs"
                      >
                        <div className={`p-2 rounded-lg ${node.color} group-hover:scale-105 transition-transform`}>
                          <NodeIcon size={16} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-900 leading-tight">{node.title}</span>
                        <span className="text-[10px] text-slate-500 leading-tight">{node.desc}</span>
                        {i < 5 && (
                          <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-300 font-bold z-10 text-[10px]">
                            →
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* FEATURE 1: EDITORIAL SPLIT — 0-100 CIVIC RISK ENGINE          */}
        {/* Visual Rhythm: Text Left, Rich Telemetry Card Right           */}
        {/* ------------------------------------------------------------- */}
        <section id="risk-engine" className="py-14 sm:py-18 border-t border-slate-200/80 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left: Editorial Storytelling */}
              <div className="lg:col-span-6 space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold">
                  <Zap size={13} />
                  <span>Explainable Mathematical Triage</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  No Black-Box Guesswork.<br />
                  Mathematical Risk Prioritization.
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Traditional civic portals treat a broken streetlight identically to an exposed high-voltage transmission line. Raabta AI evaluates municipal hazards against five weighted factors to produce a verifiable 0–100 score that mandates strict SLA enforcement.
                </p>

                {/* 5 Mathematical Factors */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="font-bold text-slate-800">1. Life-Safety Threat (30%)</span>
                    <span className="font-mono font-bold text-red-600">Primary Weight</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="font-bold text-slate-800">2. Structural Hazard Severity (25%)</span>
                    <span className="font-mono text-slate-600">Physical Degradation</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="font-bold text-slate-800">3. Population Impact & Density (20%)</span>
                    <span className="font-mono text-slate-600">Affected Citizens</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="font-bold text-slate-800">4. Location Vulnerability (15%)</span>
                    <span className="font-mono text-slate-600">Schools, Hospitals, Expressways</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="font-bold text-slate-800">5. Photographic Evidence Quality (10%)</span>
                    <span className="font-mono text-slate-600">Computer Vision Clarity</span>
                  </div>
                </div>
              </div>

              {/* Right: Rich Live Dossier Telemetry Showcase */}
              <div className="lg:col-span-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl space-y-5 border border-slate-700/80 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Live Incident Telemetry</span>
                      <p className="font-mono font-bold text-sm text-white">RA-2026-1001 • Sector F-6/2</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-red-500/20 border border-red-500/40 text-red-300 font-extrabold text-xs">
                      CRITICAL RISK: 88 / 100
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Snapped 11kV Conductor Hanging Across School Crossing. Automatic emergency dispatch initiated to IESCO Emergency Response.
                  </p>

                  <div className="space-y-2.5 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>Life Safety Threat</span>
                        <span className="font-mono font-bold text-red-400">95 / 100</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div className="h-full bg-red-500 w-[95%]" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>Location Vulnerability (School Zone)</span>
                        <span className="font-mono font-bold text-amber-400">85 / 100</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div className="h-full bg-amber-400 w-[85%]" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>Evidence Quality Score</span>
                        <span className="font-mono font-bold text-emerald-400">94 / 100</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div className="h-full bg-emerald-400 w-[94%]" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                      <Clock size={13} />
                      <span>Mandated Response SLA: ≤ 4 Hours</span>
                    </span>
                    <span className="text-emerald-400 font-bold">Duty Crew Dispatched ✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* FEATURE 2: ASYMMETRIC MOMENT — 250m HAVERSINE CLUSTERING      */}
        {/* Visual Rhythm: Visual Left, Editorial Text Right              */}
        {/* ------------------------------------------------------------- */}
        <section id="clustering" className="py-14 sm:py-18 border-t border-slate-200/80 bg-[#f8fafc] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left: Layered Overlapping Cluster Card Visual */}
              <div className="lg:col-span-6 relative">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center">
                        <MapPin size={14} />
                      </div>
                      <span className="font-bold text-xs text-slate-900">Active Proximity Cluster: RA-CLU-0012</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-mono text-[10px] font-bold border border-teal-200">
                      Merged 3 Incidents
                    </span>
                  </div>

                  {/* Centroid Coordinates Card */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Calculated Centroid:</span>
                      <span className="font-mono font-bold text-slate-800">33.7128° N, 73.0582° E</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Hazard Category:</span>
                      <span className="font-semibold text-slate-800">Collapsed Sewerage Main • CDA Water Wing</span>
                    </div>
                  </div>

                  {/* 3 Merged Reports */}
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-[11px] flex items-center justify-between">
                      <span className="text-slate-700">Report 1: Citizen Ahmad B. (Voice Note)</span>
                      <span className="text-emerald-700 font-bold">12m from centroid</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-[11px] flex items-center justify-between">
                      <span className="text-slate-700">Report 2: Citizen Zoya M. (Photo Evidence)</span>
                      <span className="text-emerald-700 font-bold">48m from centroid</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-[11px] flex items-center justify-between">
                      <span className="text-slate-700">Report 3: Citizen Kamran A. (Urdu Audio)</span>
                      <span className="text-emerald-700 font-bold">115m from centroid</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-emerald-800 font-bold">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Single Dispatch Sent: Zero duplicate municipal truck runs</span>
                  </div>
                </div>
              </div>

              {/* Right: Editorial Narrative */}
              <div className="lg:col-span-6 space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-bold">
                  <Layers size={13} />
                  <span>Geospatial Haversine Deduplication</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Stop Dispatching Three Crews<br />
                  To The Same Burst Water Pipe.
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  When infrastructure breaks in high-density sectors, multiple citizens report the same issue within minutes. Without spatial intelligence, CDA, WASA, or IESCO dispatch separate repair trucks, exhausting fuel, staff, and municipal resources.
                </p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Raabta AI calculates spherical great-circle distances using the <strong>Haversine formula</strong> in real time. Nearby hazards within 250 meters automatically merge under one master issue cluster with continuously updating centroid coordinates.
                </p>

                <div className="pt-2 flex items-center gap-4 text-xs font-bold text-slate-800">
                  <div className="flex items-center gap-1.5 text-teal-700">
                    <Check size={16} />
                    <span>Zero duplicate dispatches</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-teal-700">
                    <Check size={16} />
                    <span>Dynamic centroid recalculation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* FEATURE 3: FULL-WIDTH CULTURAL CONCEPT — MULTIMODAL URDU VOICE*/}
        {/* Visual Rhythm: Large Centered Banner with Cultural Touch      */}
        {/* ------------------------------------------------------------- */}
        <section id="voice-intake" className="py-14 sm:py-18 border-t border-slate-200/80 bg-white relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
              <Mic size={13} />
              <span>Inclusive Civic Access</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Multimodal Vision & Urdu Voice Ingestion
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Citizens shouldn't need technical literacy or bureaucratic English to report municipal hazards. Citizens simply record an Urdu voice note or snap a picture; Google Gemma AI extracts coordinates, hazard category, and severity automatically.
            </p>

            {/* Interactive Audio Card Showcase */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 border border-emerald-200/80 shadow-md text-left space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
                    <Mic size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Urdu Voice Recording (14s)</p>
                    <p className="text-[10px] text-slate-500 font-mono">Bilingual Whisper Speech Engine</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-100/80 text-emerald-800 text-[10px] font-extrabold">
                  98.4% Confidence
                </span>
              </div>

              {/* Nastaliq Urdu Display */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 text-right">
                <p className="text-base text-slate-800 font-semibold font-serif leading-relaxed">
                  "سیکٹر جی نائن میں مین ہول کا ڈھکن ٹوٹا ہوا ہے اور سڑک پر گندا پانی پھیل رہا ہے، گاڑیوں کا آنا جانا مشکل ہو گیا ہے۔"
                </p>
              </div>

              {/* English AI Classification */}
              <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>AI Structural Classification & Route:</span>
                </p>
                <p className="text-[11px] text-slate-700">
                  Target: <strong>MCI Sanitation & Sewerage Directorate</strong> • Category: <strong>Open Manhole Hazard</strong> • Location: <strong>Sector G-9/4 Commercial Corridor</strong>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* FEATURE 4 & 5: EDITORIAL SPLIT — COMMAND & CITIZEN PROOF      */}
        {/* ------------------------------------------------------------- */}
        <section id="command-center" className="py-14 sm:py-18 border-t border-slate-200/80 bg-[#f8fafc] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

              {/* CARD A: Targeted Department Operations Queue */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Landmark size={15} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Department Operations Queue</h3>
                      <p className="text-[10px] text-slate-500">Role-Guarded Command Dashboard</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                    IESCO / CDA / WASA
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Duty officers receive filtered, priority-sorted incidents with 1-click status transitions (Dispatched, In Progress, Resolved), real-time SLA breach clocks, and internal technical collaboration notes.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">RA-2026-1001 (Critical Conductor)</span>
                      <p className="text-[10px] text-slate-500">Assigned: Engr. Tariq Mehmood</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-red-100 text-red-700 font-bold text-[10px]">
                      SLA: 2h Remaining
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">RA-2026-1014 (Water Main Fracture)</span>
                      <p className="text-[10px] text-slate-500">Assigned: CDA Repair Team B</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                      Status: In Progress
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD B: Citizen-Verified Resolution & Anti-Corruption Dispute */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                      <ShieldCheck size={15} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Citizen Verification & Dispute</h3>
                      <p className="text-[10px] text-slate-500">Public Anti-Corruption Guard</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    Mandatory Confirmation
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Complaints cannot be silently closed on government screens. Field crews must submit photographic completion proof. Citizens review the work and either confirm resolution or dispute, triggering automated senior commissioner escalation.
                </p>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">Proof Submitted by Duty Officer</span>
                    <span className="text-[10px] text-emerald-700 font-mono">Timestamped EXIF</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    "Repaired overhead service line, insulated junction box, site cleared."
                  </p>
                  <div className="flex gap-2 pt-1">
                    <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px]">
                      Citizen Approved ✓
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px]">
                      Dispute for Escalation
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* FEATURE 6: INTERACTIVE DEMONSTRATION SANDBOX                  */}
        {/* ------------------------------------------------------------- */}
        <section id="preview" className="py-14 sm:py-18 border-t border-slate-200/80 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Interactive Telemetry Sandbox
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Inspect Real Platform Components
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Click across the core modules to inspect the real interface state and data payloads powering Raabta AI.
              </p>
            </div>

            {/* Interactive Tab Selectors */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
              {[
                { id: 'risk-gauge', label: 'Civic Risk Engine' },
                { id: 'intake', label: 'Multimodal Intake' },
                { id: 'clustering', label: '250m Proximity Clustering' },
                { id: 'dossier', label: 'Official PDF Dossier' },
                { id: 'queue', label: 'Duty Officer Queue' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePreviewTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePreviewTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Preview Component Display Container */}
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-slate-50/80 max-w-3xl mx-auto shadow-md">
              {activePreviewTab === 'risk-gauge' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">Case Dossier: RA-2026-1001</span>
                      <p className="text-slate-500 text-[11px]">Snapped 11kV Conductor Near School • Sector F-6/2</p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-red-100 border border-red-200 text-red-700 font-bold text-[11px]">
                      CRITICAL RISK (88/100) • 4h SLA
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-500 block text-[9px]">Life Safety (30%)</span>
                      <span className="text-sm font-black text-red-600">95 / 100</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-500 block text-[9px]">Severity (25%)</span>
                      <span className="text-sm font-black text-amber-600">85 / 100</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-500 block text-[9px]">Impact (20%)</span>
                      <span className="text-sm font-black text-amber-600">90 / 100</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-500 block text-[9px]">Location (15%)</span>
                      <span className="text-sm font-black text-red-600">85 / 100</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-500 block text-[9px]">Evidence (10%)</span>
                      <span className="text-sm font-black text-emerald-600">94 / 100</span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'intake' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900">Multimodal Incident Reporter</span>
                    <span className="text-emerald-700 font-semibold">Urdu & English Voice Supported</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
                        <Mic size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">Voice Recording Active: 00:14</p>
                        <p className="text-slate-500 text-[11px]">"سیکٹر جی نائن میں مین ہول کا ڈھکن ٹوٹا ہوا ہے..."</p>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px]">
                      ✓ AI Transcription: Broken manhole cover overflowing on Karachi Company Road, G-9/4.
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'clustering' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900">Proximity Cluster: RA-CLU-0012</span>
                    <span className="text-teal-700 font-bold">Haversine Distance &lt; 250m</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-800">
                      <span className="font-semibold">Blue Area Road Collapse & Potholes</span>
                      <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px]">3 Reports Merged</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Centroid: 33.7128° N, 73.0582° E • Merged duplicate reports from 3 citizens into single agency dispatch.
                    </p>
                  </div>
                </div>
              )}

              {activePreviewTab === 'dossier' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900">Government of Pakistan Civic Dossier</span>
                    <span className="text-slate-500 font-mono text-[10px]">MIME: application/pdf</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">Official Case Dossier: RA-2026-1001.pdf</p>
                      <p className="text-slate-500 text-[11px]">Includes mathematical factor table, tracking barcode & timestamped audit log.</p>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs">
                      <Download size={13} />
                      <span>Download PDF</span>
                    </span>
                  </div>
                </div>
              )}

              {activePreviewTab === 'queue' && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900">IESCO Operations Command Queue</span>
                    <span className="text-emerald-700 font-bold">Risk-First Triage</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-white border border-red-200 flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="font-bold text-slate-900">Snapped 11kV Conductor Near School</span>
                        <p className="text-slate-500 text-[10px]">Assigned: Engr. Tariq Mehmood • SLA: 2h remaining</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-red-600 text-white font-bold text-[10px]">Score: 88</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-amber-200 flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="font-bold text-slate-900">Low-Hanging Service Cable in Lane 4</span>
                        <p className="text-slate-500 text-[10px]">Status: In Progress • SLA: 8h remaining</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-amber-600 text-white font-bold text-[10px]">Score: 62</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* FINAL CTA SECTION (Brand Contrast)                            */}
        {/* ------------------------------------------------------------- */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto my-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white text-center space-y-5 shadow-2xl relative overflow-hidden">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Ready to Experience Modern Civic Governance?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-lg mx-auto font-normal leading-relaxed">
              Real-time hazard triage, verified photographic proof, and multi-agency accountability for Islamabad Capital Territory.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              {isAuthenticated ? (
                <Link
                  to={portalRoute}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-white text-emerald-900 font-bold text-xs sm:text-sm shadow-lg hover:bg-slate-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Go to Your Portal ({role})</span>
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-white text-emerald-900 font-bold text-xs sm:text-sm shadow-lg hover:bg-slate-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <UserPlus size={15} />
                    <span>Citizen Access</span>
                  </Link>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-950/70 hover:bg-emerald-950 text-white border border-emerald-400/30 font-semibold text-xs sm:text-sm transition-all"
                  >
                    <LogIn size={15} />
                    <span>Portal Login</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 10. COMPACT FOOTER                                            */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-200/90 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Logo size="sm" to="/" theme="light" />
            <span className="hidden sm:inline text-slate-300">|</span>
            <p className="text-slate-500 text-center sm:text-left text-[11px]">
              Civic Intelligence & Municipal Hazard Dispatch Platform for Pakistan
            </p>
          </div>

          <div className="flex items-center gap-4 text-slate-600 font-medium text-[11px]">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#risk-engine" className="hover:text-slate-900 transition-colors">Risk Engine</a>
            <a href="#clustering" className="hover:text-slate-900 transition-colors">250m Clustering</a>
            <Link to="/login" className="hover:text-slate-900 transition-colors">Portal Login</Link>
            <Link to="/signup" className="hover:text-slate-900 transition-colors">Citizen Access</Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-[10px]">
          <p>© {new Date().getFullYear()} Raabta AI. All rights reserved.</p>
          <p>Government of Pakistan Civic Dispatch & Municipal Triage Layer.</p>
        </div>
      </footer>
    </div>
  )
}
