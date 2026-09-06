import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, CheckCircle2, Shield, ShieldCheck, AlertTriangle,
  MapPin, Mic, FileText, Download, Building,
  Landmark, Activity, Zap, Layers, Menu, X,
  Sliders, Eye, Clock, LogIn, UserPlus, LogOut,
  Sparkles, Check, ChevronRight, CornerDownRight,
  ChevronDown
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
      transition: { staggerChildren: 0.08, delayChildren: 0.04 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#0c1824] selection:bg-emerald-500/20 selection:text-emerald-950 font-sans overflow-x-hidden antialiased geometric-bg-subtle">

      {/* 1. COMPACT STICKY NAVIGATION (h-14 / 56px) */}
      <header className="sticky top-0 z-50 border-b border-[#0c1824]/8 bg-[#faf8f5]/90 backdrop-blur-xl transition-all shadow-[0_1px_3px_rgba(12,24,36,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Logo size="md" to="/" theme="light" />

          {/* Desktop Navigation Links with subtle hover indicator */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-[#3e4c59]">
            <a href="#home" className="px-3 py-1.5 rounded-lg hover:text-[#0c1824] hover:bg-[#0c1824]/4 transition-colors">
              Overview
            </a>
            <a href="#how-it-works" className="px-3 py-1.5 rounded-lg hover:text-[#0c1824] hover:bg-[#0c1824]/4 transition-colors">
              Pipeline
            </a>
            <a href="#risk-engine" className="px-3 py-1.5 rounded-lg hover:text-[#0c1824] hover:bg-[#0c1824]/4 transition-colors">
              Risk Engine
            </a>
            <a href="#clustering" className="px-3 py-1.5 rounded-lg hover:text-[#0c1824] hover:bg-[#0c1824]/4 transition-colors">
              250m Deduplication
            </a>
            <a href="#voice-intake" className="px-3 py-1.5 rounded-lg hover:text-[#0c1824] hover:bg-[#0c1824]/4 transition-colors">
              Multimodal Voice
            </a>
            <a href="#command-center" className="px-3 py-1.5 rounded-lg hover:text-[#0c1824] hover:bg-[#0c1824]/4 transition-colors">
              Command Dispatch
            </a>
            <a href="#preview" className="px-3 py-1.5 rounded-lg hover:text-[#0c1824] hover:bg-[#0c1824]/4 transition-colors">
              Interactive Sandbox
            </a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to={portalRoute}
                  className="btn-primary py-1.5 px-3.5 text-xs rounded-xl"
                >
                  <span>Open Portal ({role})</span>
                  <ArrowRight size={13} />
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#3e4c59] hover:text-[#0c1824] border border-[#0c1824]/10 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-[#3e4c59] hover:text-[#0c1824] transition-colors"
                >
                  Portal Login
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary py-1.5 px-3.5 text-xs rounded-xl"
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
            className="lg:hidden p-1.5 rounded-lg text-[#3e4c59] hover:text-[#0c1824] hover:bg-white/60"
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
              className="lg:hidden border-b border-[#0c1824]/10 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-3 shadow-xl"
            >
              <div className="flex flex-col space-y-1 text-xs font-semibold text-[#3e4c59]">
                <a href="#home" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-[#faf8f5]">Overview</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-[#faf8f5]">Pipeline</a>
                <a href="#risk-engine" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-[#faf8f5]">Risk Engine</a>
                <a href="#clustering" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-[#faf8f5]">250m Deduplication</a>
                <a href="#voice-intake" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-[#faf8f5]">Multimodal Voice</a>
                <a href="#command-center" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-[#faf8f5]">Command Dispatch</a>
                <a href="#preview" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-[#faf8f5]">Interactive Sandbox</a>
              </div>
              <div className="pt-3 border-t border-[#0c1824]/10 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      to={portalRoute}
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-primary py-2 text-center text-xs"
                    >
                      Open Portal ({role})
                    </Link>
                    <button
                      type="button"
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="w-full py-2 text-center text-xs font-semibold text-[#3e4c59] bg-[#faf8f5] rounded-xl hover:bg-slate-100 border border-[#0c1824]/10"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2 text-center text-xs font-semibold text-[#3e4c59] bg-[#faf8f5] rounded-xl hover:bg-slate-100 border border-[#0c1824]/10"
                    >
                      Portal Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-primary py-2 text-center text-xs"
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
        {/* 2. BALANCED HERO SECTION WITH VISIBLE PIPELINE STRIP PEEK */}
        <section id="home" className="relative pt-6 pb-6 md:pt-8 md:pb-10 overflow-hidden">
          {/* Subtle ambient lighting */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[340px] bg-gradient-to-b from-emerald-600/6 via-teal-600/4 to-transparent blur-[100px] rounded-full" />
            <div className="absolute top-16 right-10 w-64 h-64 bg-amber-500/4 blur-[80px] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* 2-Column Balanced Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">

              {/* LEFT COLUMN: Editorial Typography & Clean CTAs */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="lg:col-span-6 space-y-3.5 text-left"
              >
                {/* Eyebrow badge */}
                <motion.div variants={itemVariants} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold shadow-[0_1px_2px_rgba(6,95,70,0.06)]">
                  <span>🇵🇰</span>
                  <span>National Civic Intelligence & Municipal Dispatch</span>
                </motion.div>

                {/* Strong editorial headline */}
                <motion.h1
                  variants={itemVariants}
                  className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-[#0c1824] leading-[1.16] font-display"
                >
                  Stronger Cities Start with<br />
                  <span className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 bg-clip-text text-transparent">
                    Smarter Citizen Reports
                  </span>
                </motion.h1>

                {/* Concise description */}
                <motion.p
                  variants={itemVariants}
                  className="text-xs sm:text-sm text-[#3e4c59] font-normal leading-relaxed max-w-xl"
                >
                  Raabta AI transforms multimodal citizen reports (photo, Urdu voice, GPS) into explainable 0–100 Civic Risk Scores, 250m proximity deduplication clusters, and direct municipal dispatch for Islamabad.
                </motion.p>

                {/* Tactile CTAs */}
                <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2.5 pt-0.5">
                  <Link
                    to="/app/report"
                    className="btn-primary group py-2.5 px-6 text-xs sm:text-sm rounded-xl"
                  >
                    <span>Report an Issue</span>
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    to="/app/reports"
                    className="btn-secondary py-2.5 px-4 text-xs sm:text-sm rounded-xl"
                  >
                    <Clock size={14} className="text-emerald-700" />
                    <span>Track a Complaint</span>
                  </Link>

                  {isAuthenticated ? (
                    <Link
                      to={portalRoute}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[#3e4c59] hover:text-[#0c1824] hover:bg-white/80 font-semibold text-xs transition-colors"
                    >
                      <span>Dashboard ({role})</span>
                      <ChevronRight size={14} />
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[#3e4c59] hover:text-[#0c1824] hover:bg-white/80 font-semibold text-xs transition-colors"
                    >
                      <LogIn size={13} className="text-emerald-700" />
                      <span>Officer Login</span>
                    </Link>
                  )}
                </motion.div>

                {/* Integrated Agencies Pill Ribbon */}
                <motion.div variants={itemVariants} className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[#627282]">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-[#627282]">Integrated:</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#0c1824]/8 text-[#0c1824] font-semibold shadow-2xs">⚡ IESCO</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#0c1824]/8 text-[#0c1824] font-semibold shadow-2xs">🛣️ CDA</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#0c1824]/8 text-[#0c1824] font-semibold shadow-2xs">💧 WASA</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#0c1824]/8 text-[#0c1824] font-semibold shadow-2xs">🔥 SNGPL</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#0c1824]/8 text-[#0c1824] font-semibold shadow-2xs">🚨 Rescue 1122</span>
                </motion.div>

                {/* 3 Core Value Pillars */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#0c1824]/8">
                  <div className="p-2.5 rounded-xl bg-white/90 border border-[#0c1824]/8 shadow-[0_1px_2px_rgba(12,24,36,0.03)] hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-0.5 font-display">
                      <Sparkles size={14} className="text-emerald-700" />
                      <span>Multimodal AI</span>
                    </div>
                    <p className="text-[11px] text-[#627282] font-medium leading-snug">
                      Gemma 3.6 vision & Urdu speech triage
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/90 border border-[#0c1824]/8 shadow-[0_1px_2px_rgba(12,24,36,0.03)] hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-0.5 font-display">
                      <Layers size={14} className="text-emerald-700" />
                      <span>250m Clustering</span>
                    </div>
                    <p className="text-[11px] text-[#627282] font-medium leading-snug">
                      Haversine spatial deduplication
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/90 border border-[#0c1824]/8 shadow-[0_1px_2px_rgba(12,24,36,0.03)] hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-0.5 font-display">
                      <CheckCircle2 size={14} className="text-emerald-700" />
                      <span>Citizen Audited</span>
                    </div>
                    <p className="text-[11px] text-[#627282] font-medium leading-snug">
                      Mandatory photo proof & PDF dossier
                    </p>
                  </div>
                </motion.div>
              </motion.div>

              {/* RIGHT COLUMN: 3D RAABTA Visual Core */}
              <div className="lg:col-span-6 flex items-center justify-center">
                <Hero3DVisual />
              </div>

            </div>

            {/* PIPELINE STRIP (Visible peek above fold) */}
            <div id="how-it-works" className="mt-6 pt-5 border-t border-[#0c1824]/8">
              <div className="p-4 sm:p-5 rounded-2xl border border-[#0c1824]/8 bg-white/95 shadow-[0_4px_16px_rgba(12,24,36,0.04)]">
                <div className="flex items-center justify-between border-b border-[#0c1824]/6 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0c1824] font-display">
                      Raabta AI End-to-End Civic Triage Pipeline
                    </span>
                  </div>
                  <span className="text-[10px] text-[#627282] font-medium hidden sm:inline font-mono">
                    From Incident Ingestion to Citizen Confirmation
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 sm:gap-3">
                  {[
                    { title: '1. Incident Intake', desc: 'Photo, Urdu Voice, GPS', icon: Mic, color: 'text-emerald-800 bg-emerald-50' },
                    { title: '2. Multimodal AI', desc: 'Gemma 3.6 vision & speech', icon: Eye, color: 'text-teal-800 bg-teal-50' },
                    { title: '3. 0–100 Risk Score', desc: '5-factor mathematical SLA', icon: Sliders, color: 'text-amber-800 bg-amber-50' },
                    { title: '4. 250m Clustering', desc: 'Haversine deduplication', icon: Layers, color: 'text-purple-800 bg-purple-50' },
                    { title: '5. Agency Dispatch', desc: 'Duty officer command queue', icon: Landmark, color: 'text-blue-800 bg-blue-50' },
                    { title: '6. Citizen Verify', desc: 'Photo proof & PDF dossier', icon: CheckCircle2, color: 'text-emerald-800 bg-emerald-50' }
                  ].map((node, i) => {
                    const NodeIcon = node.icon
                    return (
                      <div
                        key={node.title}
                        className="p-3 rounded-xl bg-[#faf8f5]/80 border border-[#0c1824]/6 flex flex-col items-center text-center space-y-1 relative group hover:border-emerald-500/40 hover:bg-white transition-all shadow-[0_1px_2px_rgba(12,24,36,0.02)]"
                      >
                        <div className={`p-2 rounded-lg ${node.color} group-hover:scale-105 transition-transform`}>
                          <NodeIcon size={16} />
                        </div>
                        <span className="text-[11px] font-bold text-[#0c1824] leading-tight font-display">{node.title}</span>
                        <span className="text-[10px] text-[#627282] leading-tight">{node.desc}</span>
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
        {/* ------------------------------------------------------------- */}
        <section id="risk-engine" className="py-14 sm:py-18 border-t border-[#0c1824]/8 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left: Editorial Storytelling */}
              <div className="lg:col-span-6 space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold">
                  <Zap size={13} />
                  <span>Explainable Mathematical Triage</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0c1824] tracking-tight font-display">
                  No Black-Box Guesswork.<br />
                  Mathematical Risk Prioritization.
                </h2>
                <p className="text-xs sm:text-sm text-[#3e4c59] leading-relaxed">
                  Traditional civic portals treat a broken streetlight identically to an exposed high-voltage transmission line. Raabta AI evaluates municipal hazards against five weighted factors to produce a verifiable 0–100 score that mandates strict SLA enforcement.
                </p>

                {/* 5 Mathematical Factors */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/8">
                    <span className="font-bold text-[#0c1824]">1. Life-Safety Threat (30%)</span>
                    <span className="font-mono font-bold text-red-600">Primary Weight</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/8">
                    <span className="font-bold text-[#0c1824]">2. Structural Hazard Severity (25%)</span>
                    <span className="font-mono text-[#627282]">Physical Degradation</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/8">
                    <span className="font-bold text-[#0c1824]">3. Population Impact & Density (20%)</span>
                    <span className="font-mono text-[#627282]">Affected Citizens</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/8">
                    <span className="font-bold text-[#0c1824]">4. Location Vulnerability (15%)</span>
                    <span className="font-mono text-[#627282]">Schools, Hospitals, Expressways</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/8">
                    <span className="font-bold text-[#0c1824]">5. Photographic Evidence Quality (10%)</span>
                    <span className="font-mono text-[#627282]">Computer Vision Clarity</span>
                  </div>
                </div>
              </div>

              {/* Right: Rich Live Dossier Telemetry Showcase */}
              <div className="lg:col-span-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#082f49] to-[#041f33] text-white shadow-xl space-y-5 border border-white/10 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Live Incident Telemetry</span>
                      <p className="font-mono font-bold text-sm text-white">RA-2026-1001 • Sector F-6/2</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-red-500/20 border border-red-500/40 text-red-300 font-extrabold text-xs">
                      CRITICAL RISK: 88 / 100
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Snapped 11kV Conductor Hanging Across School Crossing. Automatic emergency dispatch initiated to IESCO Emergency Response.
                  </p>

                  <div className="space-y-2.5 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>Life Safety Threat</span>
                        <span className="font-mono font-bold text-red-400">95 / 100</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-700/80 overflow-hidden">
                        <div className="h-full bg-red-500 w-[95%]" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>Location Vulnerability (School Zone)</span>
                        <span className="font-mono font-bold text-amber-400">85 / 100</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-700/80 overflow-hidden">
                        <div className="h-full bg-amber-400 w-[85%]" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>Evidence Quality Score</span>
                        <span className="font-mono font-bold text-emerald-400">94 / 100</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-700/80 overflow-hidden">
                        <div className="h-full bg-emerald-400 w-[94%]" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
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
        {/* FEATURE 2: 250m HAVERSINE CLUSTERING                          */}
        {/* ------------------------------------------------------------- */}
        <section id="clustering" className="py-14 sm:py-18 border-t border-[#0c1824]/8 bg-[#faf8f5] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left: Overlapping Cluster Card Visual */}
              <div className="lg:col-span-6 relative">
                <div className="p-6 rounded-2xl bg-white border border-[#0c1824]/8 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#0c1824]/6 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center">
                        <MapPin size={14} />
                      </div>
                      <span className="font-bold text-xs text-[#0c1824] font-display">Active Proximity Cluster: RA-CLU-0012</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-mono text-[10px] font-bold border border-teal-200">
                      Merged 3 Incidents
                    </span>
                  </div>

                  {/* Centroid Coordinates Card */}
                  <div className="p-3 rounded-xl bg-[#faf8f5] border border-[#0c1824]/6 text-xs space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#627282]">Calculated Centroid:</span>
                      <span className="font-mono font-bold text-[#0c1824]">33.7128° N, 73.0582° E</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#627282]">Hazard Category:</span>
                      <span className="font-semibold text-[#0c1824]">Collapsed Sewerage Main • CDA Water Wing</span>
                    </div>
                  </div>

                  {/* 3 Merged Reports */}
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-[11px] flex items-center justify-between">
                      <span className="text-[#3e4c59]">Report 1: Citizen Ahmad B. (Voice Note)</span>
                      <span className="text-emerald-800 font-bold">12m from centroid</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-[11px] flex items-center justify-between">
                      <span className="text-[#3e4c59]">Report 2: Citizen Zoya M. (Photo Evidence)</span>
                      <span className="text-emerald-800 font-bold">48m from centroid</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-[11px] flex items-center justify-between">
                      <span className="text-[#3e4c59]">Report 3: Citizen Kamran A. (Urdu Audio)</span>
                      <span className="text-emerald-800 font-bold">115m from centroid</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#0c1824]/6 flex items-center gap-2 text-[11px] text-emerald-800 font-bold">
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
                <h2 className="text-2xl sm:text-3xl font-black text-[#0c1824] tracking-tight font-display">
                  Stop Dispatching Three Crews<br />
                  To The Same Burst Water Pipe.
                </h2>
                <p className="text-xs sm:text-sm text-[#3e4c59] leading-relaxed">
                  When infrastructure breaks in high-density sectors, multiple citizens report the same issue within minutes. Without spatial intelligence, CDA, WASA, or IESCO dispatch separate repair trucks, exhausting fuel, staff, and municipal resources.
                </p>
                <p className="text-xs sm:text-sm text-[#3e4c59] leading-relaxed">
                  Raabta AI calculates spherical great-circle distances using the <strong>Haversine formula</strong> in real time. Nearby hazards within 250 meters automatically merge under one master issue cluster with continuously updating centroid coordinates.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-bold text-[#0c1824]">
                  <div className="flex items-center gap-1.5 text-teal-800">
                    <Check size={16} />
                    <span>Zero duplicate dispatches</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-teal-800">
                    <Check size={16} />
                    <span>Dynamic centroid recalculation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* FEATURE 3: MULTIMODAL URDU VOICE & VISION INGESTION           */}
        {/* ------------------------------------------------------------- */}
        <section id="voice-intake" className="py-14 sm:py-18 border-t border-[#0c1824]/8 bg-white relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
              <Mic size={13} />
              <span>Inclusive Civic Access</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0c1824] tracking-tight font-display">
              Multimodal Vision & Urdu Voice Ingestion
            </h2>
            <p className="text-xs sm:text-sm text-[#3e4c59] leading-relaxed max-w-2xl mx-auto">
              Citizens shouldn't need technical literacy or bureaucratic English to report municipal hazards. Citizens simply record an Urdu voice note or snap a picture; Google Gemma AI extracts coordinates, hazard category, and severity automatically.
            </p>

            {/* Interactive Audio Card Showcase */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 border border-emerald-200/80 shadow-md text-left space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
                    <Mic size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0c1824] font-display">Urdu Voice Recording (14s)</p>
                    <p className="text-[10px] text-[#627282] font-mono">Bilingual Whisper Speech Engine</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-[10px] font-extrabold">
                  98.4% Confidence
                </span>
              </div>

              {/* Nastaliq Urdu Display */}
              <div className="p-4 rounded-xl bg-white border border-[#0c1824]/8 text-right shadow-[0_1px_3px_rgba(12,24,36,0.02)]">
                <p className="text-base text-[#0c1824] font-semibold font-editorial leading-relaxed">
                  "سیکٹر جی نائن میں مین ہول کا ڈھکن ٹوٹا ہوا ہے اور سڑک پر گندا پانی پھیل رہا ہے، گاڑیوں کا آنا جانا مشکل ہو گیا ہے۔"
                </p>
              </div>

              {/* English AI Classification */}
              <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <p className="font-bold flex items-center gap-1.5 font-display">
                  <CheckCircle2 size={13} className="text-emerald-700" />
                  <span>AI Structural Classification & Route:</span>
                </p>
                <p className="text-[11px] text-[#3e4c59]">
                  Target: <strong>MCI Sanitation & Sewerage Directorate</strong> • Category: <strong>Open Manhole Hazard</strong> • Location: <strong>Sector G-9/4 Commercial Corridor</strong>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* FEATURE 4 & 5: COMMAND & CITIZEN PROOF                        */}
        {/* ------------------------------------------------------------- */}
        <section id="command-center" className="py-14 sm:py-18 border-t border-[#0c1824]/8 bg-[#faf8f5] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

              {/* CARD A: Targeted Department Operations Queue */}
              <div className="p-6 rounded-2xl bg-white border border-[#0c1824]/8 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-[#0c1824]/6 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                      <Landmark size={15} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0c1824] font-display">Department Operations Queue</h3>
                      <p className="text-[10px] text-[#627282]">Role-Guarded Command Dashboard</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-[#3e4c59] text-[10px] font-bold">
                    IESCO / CDA / WASA
                  </span>
                </div>

                <p className="text-xs text-[#3e4c59] leading-relaxed">
                  Duty officers receive filtered, priority-sorted incidents with 1-click status transitions (Dispatched, In Progress, Resolved), real-time SLA breach clocks, and internal technical collaboration notes.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#faf8f5] border border-[#0c1824]/8 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#0c1824]">RA-2026-1001 (Critical Conductor)</span>
                      <p className="text-[10px] text-[#627282]">Assigned: Engr. Tariq Mehmood</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-red-100 text-red-700 font-bold text-[10px]">
                      SLA: 2h Remaining
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#faf8f5] border border-[#0c1824]/8 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#0c1824]">RA-2026-1014 (Water Main Fracture)</span>
                      <p className="text-[10px] text-[#627282]">Assigned: CDA Repair Team B</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                      Status: In Progress
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD B: Citizen-Verified Resolution */}
              <div className="p-6 rounded-2xl bg-white border border-[#0c1824]/8 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-[#0c1824]/6 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
                      <ShieldCheck size={15} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0c1824] font-display">Citizen Verification & Dispute</h3>
                      <p className="text-[10px] text-[#627282]">Public Anti-Corruption Guard</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                    Mandatory Confirmation
                  </span>
                </div>

                <p className="text-xs text-[#3e4c59] leading-relaxed">
                  Complaints cannot be silently closed on government screens. Field crews must submit photographic completion proof. Citizens review the work and either confirm resolution or dispute, triggering automated senior commissioner escalation.
                </p>

                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 font-display">Proof Submitted by Duty Officer</span>
                    <span className="text-[10px] text-emerald-800 font-mono">Timestamped EXIF</span>
                  </div>
                  <p className="text-[11px] text-[#3e4c59]">
                    "Repaired overhead service line, insulated junction box, site cleared."
                  </p>
                  <div className="flex gap-2 pt-1">
                    <span className="px-3 py-1 rounded-lg bg-emerald-700 text-white font-bold text-[10px] shadow-sm">
                      Citizen Approved ✓
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-white border border-[#0c1824]/10 text-[#3e4c59] text-[10px]">
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
        <section id="preview" className="py-14 sm:py-18 border-t border-[#0c1824]/8 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-display">
                Interactive Telemetry Sandbox
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0c1824] tracking-tight font-display">
                Inspect Real Platform Components
              </h2>
              <p className="text-xs sm:text-sm text-[#3e4c59] leading-relaxed">
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
                      ? 'bg-emerald-700 text-white shadow-sm font-bold'
                      : 'bg-[#faf8f5] text-[#3e4c59] hover:text-[#0c1824] hover:bg-slate-100 border border-[#0c1824]/8'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Preview Component Display Container */}
            <div className="p-5 sm:p-6 rounded-2xl border border-[#0c1824]/8 bg-[#faf8f5] max-w-3xl mx-auto shadow-md">
              {activePreviewTab === 'risk-gauge' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-[#0c1824]/8 pb-2">
                    <div>
                      <span className="font-bold text-[#0c1824] text-sm font-display">Case Dossier: RA-2026-1001</span>
                      <p className="text-[#627282] text-[11px]">Snapped 11kV Conductor Near School • Sector F-6/2</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-red-100 border border-red-200 text-red-700 font-bold text-[11px]">
                      CRITICAL RISK (88/100) • 4h SLA
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-white border border-[#0c1824]/8 shadow-2xs">
                      <span className="text-[#627282] block text-[9px]">Life Safety (30%)</span>
                      <span className="text-sm font-black text-red-600 font-display">95 / 100</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-[#0c1824]/8 shadow-2xs">
                      <span className="text-[#627282] block text-[9px]">Severity (25%)</span>
                      <span className="text-sm font-black text-amber-600 font-display">85 / 100</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-[#0c1824]/8 shadow-2xs">
                      <span className="text-[#627282] block text-[9px]">Impact (20%)</span>
                      <span className="text-sm font-black text-amber-600 font-display">90 / 100</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-[#0c1824]/8 shadow-2xs">
                      <span className="text-[#627282] block text-[9px]">Location (15%)</span>
                      <span className="text-sm font-black text-red-600 font-display">85 / 100</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-[#0c1824]/8 shadow-2xs">
                      <span className="text-[#627282] block text-[9px]">Evidence (10%)</span>
                      <span className="text-sm font-black text-emerald-600 font-display">94 / 100</span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'intake' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-[#0c1824]/8 pb-2">
                    <span className="font-bold text-[#0c1824] font-display">Multimodal Incident Reporter</span>
                    <span className="text-emerald-800 font-semibold text-[11px]">Urdu & English Voice Supported</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-[#0c1824]/8 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
                        <Mic size={18} />
                      </div>
                      <div>
                        <span className="font-bold text-[#0c1824] block text-xs">Audio Recording Active: 00:14</span>
                        <span className="text-[#627282] text-[10px]">Whisper AI Urdu Model processing transcription...</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#faf8f5] text-[11px] text-[#3e4c59] italic border border-[#0c1824]/6 font-editorial">
                      "Yahan school ke paas bijli ka pole tedha ho gaya hai aur sparks nikal rahe hain..."
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'clustering' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-[#0c1824]/8 pb-2">
                    <span className="font-bold text-[#0c1824] font-display">Haversine 250m Proximity Engine</span>
                    <span className="text-teal-800 font-mono text-[10px] font-bold">Cluster ID: RA-CLU-0042</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-lg bg-white border border-[#0c1824]/8 text-center shadow-2xs">
                      <span className="text-[#627282] block text-[10px]">Radius Threshold</span>
                      <span className="font-bold text-[#0c1824] text-xs">250 Meters</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-[#0c1824]/8 text-center shadow-2xs">
                      <span className="text-[#627282] block text-[10px]">Active Reports</span>
                      <span className="font-bold text-teal-800 text-xs">4 Merged</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-[#0c1824]/8 text-center shadow-2xs">
                      <span className="text-[#627282] block text-[10px]">Dispatches Saved</span>
                      <span className="font-bold text-emerald-800 text-xs">3 Avoided</span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'dossier' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-[#0c1824]/8 pb-2">
                    <span className="font-bold text-[#0c1824] font-display">Municipal Evidence Dossier (PDF Export)</span>
                    <span className="text-[#627282] text-[10px] font-mono">SHA-256 Verified</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-[#0c1824]/8 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-red-50 text-red-700">
                        <FileText size={20} />
                      </div>
                      <div>
                        <span className="font-bold text-[#0c1824] block text-xs">RA-2026-1001-DOSSIER.pdf</span>
                        <span className="text-[#627282] text-[10px]">Includes GPS EXIF, Gemma classification, and resolution photos</span>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                      Audit Ready
                    </span>
                  </div>
                </div>
              )}

              {activePreviewTab === 'queue' && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-[#0c1824]/8 pb-2">
                    <span className="font-bold text-[#0c1824] font-display">IESCO Operations Command Queue</span>
                    <span className="text-emerald-800 font-bold text-[11px]">Risk-First Triage</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-white border border-red-200 flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="font-bold text-[#0c1824]">Snapped 11kV Conductor Near School</span>
                        <p className="text-[#627282] text-[10px]">Assigned: Engr. Tariq Mehmood • SLA: 2h remaining</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-red-600 text-white font-bold text-[10px]">Score: 88</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-amber-200 flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="font-bold text-[#0c1824]">Low-Hanging Service Cable in Lane 4</span>
                        <p className="text-[#627282] text-[10px]">Status: In Progress • SLA: 8h remaining</p>
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
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#064e3b] via-[#065f46] to-[#082f49] text-white text-center space-y-5 shadow-2xl relative overflow-hidden border border-white/10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-display">
              Ready to Experience Modern Civic Governance?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-lg mx-auto font-normal leading-relaxed">
              Real-time hazard triage, verified photographic proof, and multi-agency accountability for Islamabad Capital Territory.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <Link
                to="/app/report"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-white text-[#064e3b] font-bold text-xs sm:text-sm shadow-lg hover:bg-[#faf8f5] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Report an Issue</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/app/reports"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-black/20 hover:bg-black/30 text-white border border-white/20 font-semibold text-xs sm:text-sm transition-all"
              >
                <Clock size={15} />
                <span>Track a Complaint</span>
              </Link>
              {isAuthenticated ? (
                <Link
                  to={portalRoute}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-emerald-100 hover:text-white font-semibold text-xs transition-colors"
                >
                  <span>Portal ({role})</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-emerald-100 hover:text-white font-semibold text-xs transition-colors"
                >
                  <LogIn size={14} />
                  <span>Officer Login</span>
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 10. COMPACT LUXURY FOOTER                                     */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-[#0c1824]/8 bg-white py-8 text-xs text-[#627282]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Logo size="sm" to="/" theme="light" />
            <span className="hidden sm:inline text-slate-300">|</span>
            <p className="text-[#627282] text-center sm:text-left text-[11px]">
              Civic Intelligence & Municipal Hazard Dispatch Platform for Pakistan
            </p>
          </div>

          <div className="flex items-center gap-4 text-[#3e4c59] font-medium text-[11px]">
            <a href="#how-it-works" className="hover:text-[#0c1824] transition-colors">How It Works</a>
            <a href="#risk-engine" className="hover:text-[#0c1824] transition-colors">Risk Engine</a>
            <a href="#clustering" className="hover:text-[#0c1824] transition-colors">250m Clustering</a>
            <Link to="/login" className="hover:text-[#0c1824] transition-colors">Portal Login</Link>
            <Link to="/signup" className="hover:text-[#0c1824] transition-colors">Citizen Access</Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pt-6 border-t border-[#0c1824]/6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[#627282] text-[10px]">
          <p>© {new Date().getFullYear()} Raabta AI. All rights reserved.</p>
          <p>Government of Pakistan Civic Dispatch & Municipal Triage Layer.</p>
        </div>
      </footer>
    </div>
  )
}
