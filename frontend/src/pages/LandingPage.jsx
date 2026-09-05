import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, CheckCircle2, Shield, AlertTriangle,
  MapPin, Mic, FileText, Download, Building,
  Landmark, Activity, Zap, Layers, Menu, X,
  Sliders, Eye, Clock, LogIn, UserPlus, LogOut
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
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-900 font-sans overflow-x-hidden antialiased">
      
      {/* 1. STICKY LIGHT NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Logo size="md" to="/" theme="light" />

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600">
            <a href="#home" className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors">
              Overview
            </a>
            <a href="#impact" className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors">
              Why It Matters
            </a>
            <a href="#how-it-works" className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors">
              How It Works
            </a>
            <a href="#capabilities" className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors">
              Capabilities
            </a>
            <a href="#ai-engine" className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors">
              AI Engine
            </a>
            <a href="#preview" className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors">
              Product Experience
            </a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to={portalRoute}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md shadow-emerald-900/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Open Portal</span>
                  <ArrowRight size={15} />
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Portal Login
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md shadow-emerald-900/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <UserPlus size={15} />
                  <span>Citizen Access</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-b border-slate-200 bg-white px-4 py-6 space-y-4 shadow-lg"
            >
              <div className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
                <a href="#home" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">Overview</a>
                <a href="#impact" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">Why It Matters</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">How It Works</a>
                <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">Capabilities</a>
                <a href="#ai-engine" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">AI Engine</a>
                <a href="#preview" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">Product Experience</a>
              </div>
              <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      to={portalRoute}
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 text-center text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 shadow"
                    >
                      Open Portal
                    </Link>
                    <button
                      type="button"
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="w-full py-2 text-center text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 text-center text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
                    >
                      Portal Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 text-center text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 shadow"
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
        {/* 2. HERO SECTION — EDITORIAL 2-COLUMN WITH 3D VISUAL */}
        <section id="home" className="relative pt-12 pb-16 md:pt-16 md:pb-24 overflow-hidden bg-gradient-to-b from-[#faf9f6] via-white to-[#f8fafc]">
          {/* Subtle Ambient Depth and Delicate Cultural Geometry */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-emerald-500/8 via-teal-500/5 to-transparent blur-[140px] rounded-full" />
            <div className="absolute top-40 -left-20 w-80 h-80 bg-amber-500/5 blur-[120px] rounded-full" />
            <div className="absolute top-60 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full" />
            <div className="absolute inset-0 bg-[radial-gradient(#059669_0.75px,transparent_0.75px)] [background-size:28px_28px] opacity-[0.03]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* 2-Column Editorial Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              
              {/* LEFT COLUMN: Editorial Typography & CTAs */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="lg:col-span-6 xl:col-span-6 space-y-6 text-left"
              >
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-2xs">
                  <span>🇵🇰</span>
                  <span>National Civic Intelligence & Municipal Dispatch Platform</span>
                </motion.div>

                <motion.h1
                  variants={itemVariants}
                  className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]"
                >
                  Intelligent Civic Triage.{' '}
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 bg-clip-text text-transparent">
                    Accelerated Municipal Response.
                  </span>
                </motion.h1>

                <motion.p
                  variants={itemVariants}
                  className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed"
                >
                  Transforming municipal governance in Pakistan. Citizens report infrastructure hazards through photos or Urdu/English voice notes; our AI calculates an explainable <strong>0–100 Civic Risk Score</strong>, merges nearby duplicates within <strong>250m</strong>, and dispatches directly to IESCO, CDA, WASA, SNGPL, and IWMC.
                </motion.p>

                {/* Action Buttons */}
                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  {isAuthenticated ? (
                    <Link
                      to={portalRoute}
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-900/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <span>Go to Your Portal ({role})</span>
                      <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/signup"
                        className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-900/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <UserPlus size={16} />
                        <span>Citizen Access</span>
                      </Link>
                      <Link
                        to="/login"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm shadow-xs transition-all"
                      >
                        <LogIn size={16} className="text-emerald-600" />
                        <span>Portal Login</span>
                      </Link>
                    </>
                  )}
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
                  >
                    <span>See How It Works</span>
                  </a>
                </motion.div>

                {/* Integrated Agencies Ribbon */}
                <motion.div variants={itemVariants} className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">Integrated Agencies:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-medium text-[11px] shadow-2xs">⚡ IESCO</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-medium text-[11px] shadow-2xs">🛣️ CDA</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-medium text-[11px] shadow-2xs">💧 WASA</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-medium text-[11px] shadow-2xs">🔥 SNGPL</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-medium text-[11px] shadow-2xs">♻️ IWMC</span>
                </motion.div>

                {/* Core Architecture Trust Badges */}
                <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200/80">
                  <div className="space-y-0.5">
                    <p className="text-lg font-black text-slate-900 tracking-tight">0–100</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">Explainable Risk</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-lg font-black text-emerald-700 tracking-tight">250m</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">Proximity Merge</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-lg font-black text-slate-900 tracking-tight">Urdu + EN</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">Multimodal Voice</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* RIGHT COLUMN: Interactive 3D Visual */}
              <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center">
                <Hero3DVisual />
              </div>

            </div>

            {/* REAL ARCHITECTURE FLOW DIAGRAM (Light Theme) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-16 max-w-5xl mx-auto"
            >
              <div className="p-6 md:p-8 rounded-2xl border border-slate-200 bg-white shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Raabta AI End-to-End Civic Triage Flow
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    Haversine Clustering & 0–100 Explainable Risk Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 relative">
                  {[
                    { title: 'Citizen Report', desc: 'Photo, Urdu Voice & GPS', icon: Mic, color: 'text-blue-600 bg-blue-50' },
                    { title: 'Multimodal AI', desc: 'Hazard vision & transcription', icon: Eye, color: 'text-indigo-600 bg-indigo-50' },
                    { title: '0–100 Risk Score', desc: '5-factor mathematical SLA', icon: Sliders, color: 'text-amber-600 bg-amber-50' },
                    { title: '250m Clustering', desc: 'Haversine deduplication', icon: Layers, color: 'text-purple-600 bg-purple-50' },
                    { title: 'Agency Dispatch', desc: 'Targeted department queue', icon: Landmark, color: 'text-emerald-600 bg-emerald-50' },
                    { title: 'Citizen Verify', desc: 'Repair proof & PDF dossier', icon: CheckCircle2, color: 'text-teal-600 bg-teal-50' }
                  ].map((node, i) => {
                    const NodeIcon = node.icon
                    return (
                      <div
                        key={node.title}
                        className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col items-center text-center space-y-2 relative group hover:border-emerald-500/40 hover:bg-white transition-all shadow-2xs"
                      >
                        <div className={`p-2.5 rounded-lg ${node.color} group-hover:scale-110 transition-transform`}>
                          <NodeIcon size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-900 leading-snug">{node.title}</span>
                        <span className="text-[11px] text-slate-500 leading-tight">{node.desc}</span>
                        {i < 5 && (
                          <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-300 z-10 font-bold">
                            →
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. IMPACT SECTION */}
        <section id="impact" className="py-20 md:py-28 border-t border-slate-200/80 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Civic Impact
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Why Raabta AI Matters
              </h2>
              <p className="text-base text-slate-600 leading-relaxed font-normal">
                Municipal complaints in Pakistan are often delayed by duplicate reports, paper bureaucracy, misdirected departments, and lack of citizen verification. Raabta AI replaces guesswork with intelligent automation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Layers,
                  title: 'Zero Duplicate Dispatch',
                  desc: 'Haversine distance algorithms merge reports within 250 meters into unified issue clusters, preventing duplicate field crews sent to the same pothole or burst pipe.'
                },
                {
                  icon: Shield,
                  title: 'Prioritizing Life-Safety',
                  desc: 'The explainable 0–100 Civic Risk Score calculates life-safety threat, structural severity, and population impact to enforce strict response SLAs down to ≤ 4 hours.'
                },
                {
                  icon: Mic,
                  title: 'Multimodal & Urdu Voice',
                  desc: 'Citizens report issues by speaking naturally in Urdu or English and snapping photos. AI transcribes, classifies, and geocodes without requiring bureaucratic paperwork.'
                },
                {
                  icon: CheckCircle2,
                  title: 'Citizen-Verified Resolution',
                  desc: 'Cases cannot be silently closed. Field officers upload technical completion photos which citizens review, rate, or dispute with automatic escalation triggers.'
                }
              ].map((card) => {
                const CardIcon = card.icon
                return (
                  <div
                    key={card.title}
                    className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-white transition-all hover:border-emerald-300 hover:shadow-md group space-y-3.5 shadow-2xs"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-all">
                      <CardIcon size={22} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{card.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 4. HOW IT WORKS (6-STEP CIVIC WORKFLOW) */}
        <section id="how-it-works" className="py-20 md:py-28 border-t border-slate-200/80 bg-[#f8fafc] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                End-to-End Workflow
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                From Hazard Report to Verified Resolution
              </h2>
              <p className="text-base text-slate-600 leading-relaxed font-normal">
                How Raabta AI automates complaint ingestion, risk ranking, agency routing, and public verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  title: 'Capture & Locate',
                  desc: 'Citizen snaps a photo of the civic issue or records an Urdu/English voice note. GPS coordinates automatically convert to a street address.'
                },
                {
                  step: '02',
                  title: 'AI Vision & Risk Scoring',
                  desc: 'Multimodal AI detects hazard category, evaluates photographic evidence quality, and calculates the 0–100 Civic Risk Score.'
                },
                {
                  step: '03',
                  title: 'Proximity Deduplication',
                  desc: 'The platform checks active reports within 250 meters. Related complaints are grouped under a master cluster with recalculating centroid coordinates.'
                },
                {
                  step: '04',
                  title: 'Targeted Agency Dispatch',
                  desc: 'Complaint routes directly to the designated department (IESCO, CDA, WASA, SNGPL, IWMC) prioritized by risk level and SLA timer.'
                },
                {
                  step: '05',
                  title: 'Proof of Resolution',
                  desc: 'Field duty officers resolve the issue on site and submit mandatory completion photos and technical repair notes.'
                },
                {
                  step: '06',
                  title: 'Citizen Verification & Dossier',
                  desc: 'The citizen confirms site restoration (or disputes for escalation), and the platform generates an official, downloadable Government PDF dossier.'
                }
              ].map((s) => (
                <div
                  key={s.step}
                  className="p-6 rounded-2xl border border-slate-200/80 bg-white hover:shadow-md transition-all space-y-3 relative shadow-2xs"
                >
                  <span className="text-3xl font-black text-emerald-600 tracking-tighter">
                    {s.step}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. CORE CAPABILITIES */}
        <section id="capabilities" className="py-20 md:py-28 border-t border-slate-200/80 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Platform Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Everything You Need, Connected by AI
              </h2>
              <p className="text-base text-slate-600 leading-relaxed font-normal">
                Real, production-grade civic intelligence modules built specifically for municipal governance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Sliders,
                  title: '0–100 Explainable Risk Engine',
                  desc: 'Formula combining Safety (30%), Severity (25%), Impact (20%), Location (15%), and Evidence Quality (10%) to determine SLA mandates.'
                },
                {
                  icon: Layers,
                  title: 'Haversine Proximity Clustering',
                  desc: 'Calculates geographical distance between active complaints to merge nearby hazards within 250m and eliminate duplicate field crew dispatch.'
                },
                {
                  icon: Mic,
                  title: 'Multimodal AI Vision & Voice',
                  desc: 'Combines computer vision for hazard classification and faster-whisper speech recognition for bilingual Urdu/English complaints.'
                },
                {
                  icon: Landmark,
                  title: 'Department Operations Center',
                  desc: 'Role-based queues for agency officers with 1-click status transitions, internal collaboration notes, and photo proof uploads.'
                },
                {
                  icon: FileText,
                  title: 'Official PDF Civic Dossiers',
                  desc: 'Generates downloadable Government of Pakistan branded dossiers with tracking IDs, factor breakdowns, and timestamped audit logs.'
                },
                {
                  icon: Activity,
                  title: 'Hotspots & SLA Compliance',
                  desc: 'Interactive geospatial maps plotting individual hazards and cluster centroids with live agency SLA performance tracking.'
                }
              ].map((cap) => {
                const CapIcon = cap.icon
                return (
                  <div
                    key={cap.title}
                    className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-white transition-all space-y-3 shadow-2xs hover:shadow-md group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <CapIcon size={20} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{cap.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">{cap.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 6. AI ENGINE SECTION */}
        <section id="ai-engine" className="py-20 md:py-28 border-t border-slate-200/80 bg-[#f8fafc] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Intelligent Triage Pipeline
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Intelligence Behind the Experience
                </h2>
                <p className="text-base text-slate-600 leading-relaxed">
                  Raabta AI eliminates subjective complaint review with a standardized, explainable multimodal pipeline that processes text, voice, and imagery instantly.
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700">
                  {[
                    'Urdu & English Voice Transcription',
                    'Hazard Type Classification',
                    'Evidence Quality Grading',
                    'Dynamic Clarifying Questions',
                    '0–100 Mathematical Risk Score',
                    'Automated Agency Routing'
                  ].map((feature) => (
                    <div key={feature} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-2.5 shadow-2xs">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-2xl border border-slate-200 bg-white shadow-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Processing & Decision Pipeline
                </h3>

                <div className="space-y-3">
                  {[
                    { label: 'Citizen Input (Photo / Urdu Voice / GPS)', role: 'Input', color: 'border-blue-200 bg-blue-50 text-blue-900' },
                    { label: 'Multimodal Vision & Speech Processing', role: 'Perception', color: 'border-indigo-200 bg-indigo-50 text-indigo-900' },
                    { label: '5-Factor Mathematical Risk Engine', role: 'Assessment', color: 'border-amber-200 bg-amber-50 text-amber-900' },
                    { label: '250m Proximity Clustering & Centroid Merge', role: 'Deduplication', color: 'border-purple-200 bg-purple-50 text-purple-900' },
                    { label: 'Agency Triage & Mandated SLA Dispatch', role: 'Resolution', color: 'border-emerald-200 bg-emerald-50 text-emerald-900' }
                  ].map((pipe) => (
                    <div
                      key={pipe.label}
                      className={`p-3.5 rounded-xl border ${pipe.color} flex items-center justify-between text-xs font-medium`}
                    >
                      <span className="font-bold">{pipe.label}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-700">
                        {pipe.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. PRODUCT PREVIEW SECTION */}
        <section id="preview" className="py-20 md:py-28 border-t border-slate-200/80 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Inside the Experience
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Experience Raabta AI
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Take a look at the actual interface components that power our civic complaint and command operations.
              </p>
            </div>

            {/* Interactive Preview Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {[
                { id: 'risk-gauge', label: 'Civic Risk Engine' },
                { id: 'intake', label: 'Incident Intake & Voice' },
                { id: 'clustering', label: '250m Proximity Clustering' },
                { id: 'dossier', label: 'Official PDF Dossier' },
                { id: 'queue', label: 'Agency Command Queue' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePreviewTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activePreviewTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Preview Display Window */}
            <div className="p-6 md:p-8 rounded-2xl border border-slate-200 bg-slate-50/80 max-w-4xl mx-auto shadow-lg">
              {activePreviewTab === 'risk-gauge' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">Case Dossier: RA-2026-1001</span>
                      <p className="text-slate-500 text-[11px]">Snapped 11kV Conductor Near School • Sector F-6/2</p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-red-100 border border-red-200 text-red-700 font-bold text-[11px]">
                      CRITICAL RISK (88/100) • 4h SLA
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Life Safety (30%)</span>
                      <span className="text-base font-black text-red-600">95 / 100</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Severity (25%)</span>
                      <span className="text-base font-black text-amber-600">85 / 100</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Impact (20%)</span>
                      <span className="text-base font-black text-amber-600">90 / 100</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Location (15%)</span>
                      <span className="text-base font-black text-red-600">85 / 100</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Evidence (10%)</span>
                      <span className="text-base font-black text-emerald-600">94 / 100</span>
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
                      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
                        <Mic size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Voice Recording Active: 00:14</p>
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
                    <span className="font-bold text-slate-900">Proximity Cluster: RA-CLU-0001</span>
                    <span className="text-indigo-700 font-bold">Haversine Distance &lt; 250m</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-800">
                      <span className="font-semibold">Blue Area Road Collapse & Potholes</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold">3 Reports Merged</span>
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
                    <span className="text-slate-500">MIME: application/pdf</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <p className="font-bold text-slate-900">Official Case Dossier: RA-2026-1001.pdf</p>
                      <p className="text-slate-500 text-[11px]">Includes mathematical factor table, tracking barcode & timestamped audit log.</p>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
                      <Download size={13} />
                      <span>Download PDF</span>
                    </span>
                  </div>
                </div>
              )}

              {activePreviewTab === 'queue' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900">IESCO Operations Command Queue</span>
                    <span className="text-emerald-700 font-bold">Risk-First Triage</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-white border border-red-200 flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="font-bold text-slate-900">Snapped 11kV Conductor Near School</span>
                        <p className="text-slate-500 text-[11px]">Assigned to: Engr. Tariq Mehmood • SLA: 2h remaining</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-red-600 text-white font-bold text-[10px]">Score: 88</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-amber-200 flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="font-bold text-slate-900">Low-Hanging Service Cable in Lane 4</span>
                        <p className="text-slate-500 text-[11px]">Status: In Progress • SLA: 8h remaining</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-amber-600 text-white font-bold text-[10px]">Score: 62</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 8. WHAT MAKES RAABTA AI DIFFERENT? */}
        <section className="py-20 md:py-28 border-t border-slate-200/80 bg-[#f8fafc] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Architectural Distinction
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                What Makes Raabta AI Different?
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Six verifiable technical commitments that distinguish Raabta AI from traditional complaint systems.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Explainable Mathematical Scoring', desc: 'Weighted factor formula eliminates black-box AI decisions and provides an audit-compliant justification for every priority assignment.' },
                { title: 'Geospatial Haversine Deduplication', desc: 'Real-time proximity clustering groups multiple complaints within 250m to prevent wasted municipal truck dispatches.' },
                { title: 'Urdu & English Multimodal Ingestion', desc: 'Whisper-powered speech transcription allows citizens of all literacy backgrounds to report hazards effortlessly.' },
                { title: 'Citizen Dispute Escalation', desc: 'Repairs require citizen confirmation. If disputed, the system applies an automatic +15% risk surge and priority re-queue.' },
                { title: 'Official PDF Dossiers', desc: 'Standardized ReportLab documents containing complete chain-of-custody audit logs for government archiving and compliance.' },
                { title: 'Cross-Agency Interoperability', desc: 'Unified triage layer coordinating independent agencies (IESCO, CDA, WASA, SNGPL, IWMC) under a single citizen portal.' }
              ].map((diff) => (
                <div
                  key={diff.title}
                  className="p-6 rounded-2xl border border-slate-200/80 bg-white hover:shadow-md transition-all space-y-2.5 shadow-2xs"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{diff.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">{diff.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. FINAL CTA (Contrasting Brand Emerald Section) */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto my-12">
          <div className="p-10 md:p-14 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
              Ready to Transform Municipal Governance?
            </h2>
            <p className="text-base sm:text-lg text-emerald-100 max-w-xl mx-auto font-normal leading-relaxed">
              Experience responsive civic services powered by multimodal intelligence, risk prioritization, and public accountability.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              {isAuthenticated ? (
                <Link
                  to={portalRoute}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-emerald-900 font-bold text-sm shadow-lg hover:bg-slate-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Go to Your Portal</span>
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-emerald-900 font-bold text-sm shadow-lg hover:bg-slate-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <UserPlus size={16} />
                    <span>Citizen Access</span>
                  </Link>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-white border border-emerald-400/30 font-semibold text-sm transition-all"
                  >
                    <LogIn size={16} />
                    <span>Portal Login</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* 10. FOOTER (Dark Navy Contrast) */}
      <footer className="border-t border-slate-800 bg-[#070a12] py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Logo size="sm" to="/" theme="dark" />
            <span className="hidden sm:inline text-slate-600">|</span>
            <p className="text-slate-400 text-center sm:text-left">
              Civic Intelligence & Municipal Hazard Platform for Pakistan
            </p>
          </div>

          <div className="flex items-center gap-6 text-slate-300 font-medium">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a>
            <Link to="/login" className="hover:text-white transition-colors">Portal Login</Link>
            <Link to="/signup" className="hover:text-white transition-colors">Citizen Access</Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} Raabta AI. All rights reserved.</p>
          <p>Government of Pakistan Civic Dispatch & Municipal Triage Layer.</p>
        </div>
      </footer>
    </div>
  )
}
