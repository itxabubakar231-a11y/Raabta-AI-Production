import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  Mic, MapPin, Zap, CheckCircle2, ShieldCheck,
  FileText, Activity
} from 'lucide-react'

export default function Hero3DVisual() {
  const containerRef = useRef(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Cursor motion tracking
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Natural spring damping (calm, intelligent, not hyperactive)
  const springConfig = { stiffness: 110, damping: 24, mass: 0.7 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)

  // Subtle 3D rotations (-5 to +5 degrees)
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [5, -5])
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-6, 6])

  // Multi-speed parallax translation layers
  // Layer 1: Background geometric rings (almost static)
  const layerBgX = useTransform(smoothX, [-0.5, 0.5], [-6, 6])
  const layerBgY = useTransform(smoothY, [-0.5, 0.5], [-6, 6])

  // Layer 2: Central orbital intelligence core (moderate movement)
  const layerCoreX = useTransform(smoothX, [-0.5, 0.5], [-14, 14])
  const layerCoreY = useTransform(smoothY, [-0.5, 0.5], [-14, 14])

  // Layer 3: Floating telemetry cards (responsive depth layer)
  const layerCardsX = useTransform(smoothX, [-0.5, 0.5], [-22, 22])
  const layerCardsY = useTransform(smoothY, [-0.5, 0.5], [-22, 22])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const handleMouseMove = (e) => {
    if (prefersReducedMotion || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-lg lg:max-w-xl mx-auto h-[380px] sm:h-[430px] lg:h-[460px] flex items-center justify-center select-none"
      style={{ perspective: 1100 }}
    >
      {/* 1. LAYER 0: SOFT AMBIENT GLOW & CULTURAL GEOMETRIC LINERING */}
      <motion.div
        style={{
          x: prefersReducedMotion ? 0 : layerBgX,
          y: prefersReducedMotion ? 0 : layerBgY
        }}
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
      >
        {/* Soft Radial Ambient Glow */}
        <div className="w-[300px] sm:w-[380px] h-[300px] sm:h-[380px] rounded-full bg-gradient-to-br from-emerald-500/10 via-teal-500/8 to-blue-500/5 blur-3xl" />

        {/* Delicate South Asian / Islamic Geometric Motif */}
        <svg
          className="absolute w-[360px] sm:w-[420px] h-[360px] sm:h-[420px] opacity-20 text-emerald-900"
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="250" cy="250" r="210" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 6" />
          <circle cx="250" cy="250" r="160" stroke="currentColor" strokeWidth="0.75" opacity="0.6" />
          <circle cx="250" cy="250" r="110" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 5" />
          <polygon
            points="250,40 398,102 460,250 398,398 250,460 102,398 40,250 102,102"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.3"
          />
        </svg>
      </motion.div>

      {/* 2. 3D INTERACTIVE TRANSFORM CONTAINER */}
      <motion.div
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full h-full flex items-center justify-center"
      >
        {/* SVG Live Data Flows with Glowing Animated Pulses */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-45 z-0"
          viewBox="0 0 480 440"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="flowGradEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.2" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Connection Lines from Telemetry Cards to Center (240, 220) */}
          <path id="pathTopLeft" d="M 105 85 Q 170 145, 240 220" fill="none" stroke="url(#flowGradEmerald)" strokeWidth="1.5" strokeDasharray="4 4" />
          <path id="pathTopRight" d="M 375 80 Q 310 140, 240 220" fill="none" stroke="url(#flowGradEmerald)" strokeWidth="1.5" strokeDasharray="4 4" />
          <path id="pathBottomLeft" d="M 115 350 Q 175 290, 240 220" fill="none" stroke="url(#flowGradEmerald)" strokeWidth="1.5" strokeDasharray="4 4" />
          <path id="pathBottomRight" d="M 365 355 Q 305 295, 240 220" fill="none" stroke="url(#flowGradEmerald)" strokeWidth="1.5" strokeDasharray="4 4" />

          {/* Animated Energy Packets travelling into Core */}
          {!prefersReducedMotion && (
            <>
              <circle r="3" fill="#10b981" filter="url(#glow)">
                <animateMotion repeatCount="indefinite" dur="3.2s" path="M 105 85 Q 170 145, 240 220" />
              </circle>
              <circle r="3" fill="#ef4444" filter="url(#glow)">
                <animateMotion repeatCount="indefinite" dur="2.8s" path="M 375 80 Q 310 140, 240 220" />
              </circle>
              <circle r="3" fill="#14b8a6" filter="url(#glow)">
                <animateMotion repeatCount="indefinite" dur="3.6s" path="M 115 350 Q 175 290, 240 220" />
              </circle>
              <circle r="3" fill="#0284c7" filter="url(#glow)">
                <animateMotion repeatCount="indefinite" dur="3.4s" path="M 365 355 Q 305 295, 240 220" />
              </circle>
            </>
          )}
        </svg>

        {/* ------------------------------------------------------------- */}
        {/* A. 3D CENTRAL CORE: RAABTA INTELLIGENCE HUB (Depth Mid)       */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          style={{
            x: prefersReducedMotion ? 0 : layerCoreX,
            y: prefersReducedMotion ? 0 : layerCoreY,
            translateZ: 20
          }}
          className="relative flex items-center justify-center z-10"
        >
          {/* Orbital Ring 1 (Horizontal Inclined) */}
          <motion.div
            animate={prefersReducedMotion ? {} : { rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            className="w-40 sm:w-48 h-40 sm:h-48 rounded-full border border-emerald-500/30 border-dashed relative shadow-inner"
            style={{ transform: 'rotateX(68deg)' }}
          >
            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/60" />
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/60" />
          </motion.div>

          {/* Orbital Ring 2 (Cross Angle) */}
          <motion.div
            animate={prefersReducedMotion ? {} : { rotate: -360 }}
            transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
            className="absolute w-36 sm:w-40 h-36 sm:h-40 rounded-full border border-teal-500/25 relative"
            style={{ transform: 'rotateY(60deg) rotateX(25deg)' }}
          >
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-teal-400" />
          </motion.div>

          {/* Central 3D Crystalline Core Prism */}
          <div className="absolute w-20 sm:w-24 h-20 sm:h-24 rounded-2xl bg-gradient-to-tr from-[#064e3b] via-[#0f766e] to-[#047857] p-0.5 shadow-xl shadow-emerald-950/20 transform rotate-6 flex items-center justify-center backdrop-blur-md">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-white/20 via-transparent to-black/30 flex flex-col items-center justify-center p-2 relative overflow-hidden">
              <div className="absolute -top-5 -left-5 w-12 h-12 bg-white/40 rounded-full blur-sm" />
              <img
                src="/favicon.svg"
                alt="Raabta Core"
                className="w-9 h-9 object-contain drop-shadow-md relative z-10"
              />
              <span className="mt-1 text-[8px] font-black tracking-widest text-emerald-200 uppercase z-10">
                Gemma AI
              </span>
            </div>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* B. FLOATING CARD 1: 0-100 CIVIC RISK (Top-Right)              */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          style={{
            x: prefersReducedMotion ? 0 : layerCardsX,
            y: prefersReducedMotion ? 0 : layerCardsY,
            translateZ: 50,
          }}
          className="absolute top-2 sm:top-4 right-1 sm:right-3 w-[185px] sm:w-[215px] p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg shadow-slate-900/6 transition-all hover:border-emerald-500/50 hover:shadow-xl z-20"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Civic Risk Score</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-red-50 border border-red-200/60 text-red-700 text-[9px] font-extrabold uppercase">
              Critical
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">88</span>
            <span className="text-[10px] font-semibold text-slate-400">/ 100</span>
            <span className="text-[10px] font-bold text-red-600 ml-auto flex items-center gap-0.5">
              <Zap size={11} />
              <span>Life-Safety</span>
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mb-1.5">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 w-[88%]" />
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-100">
            <span className="truncate font-medium text-slate-600">IESCO High-Voltage</span>
            <span className="font-mono text-emerald-700 font-bold">≤ 4h SLA</span>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* C. FLOATING CARD 2: MULTIMODAL URDU VOICE (Top-Left)           */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          style={{
            x: prefersReducedMotion ? 0 : layerCardsX,
            y: prefersReducedMotion ? 0 : layerCardsY,
            translateZ: 40,
          }}
          className="absolute top-6 sm:top-8 left-1 sm:left-3 w-[180px] sm:w-[205px] p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg shadow-slate-900/6 transition-all hover:border-emerald-500/50 hover:shadow-xl z-20"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
              <div className="w-4 h-4 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Mic size={10} />
              </div>
              <span>Urdu / EN Voice</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[9px] font-bold">
              98% AI
            </span>
          </div>

          {/* Waveform Micro-Animation */}
          <div className="flex items-center justify-center gap-0.5 h-5 bg-slate-50 rounded-lg px-2 my-1.5">
            {[45, 80, 100, 65, 90, 75, 50, 85, 60, 40].map((h, i) => (
              <motion.span
                key={i}
                animate={prefersReducedMotion ? {} : { height: [`${h * 0.4}%`, `${h}%`, `${h * 0.4}%`] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.07, ease: 'easeInOut' }}
                className="w-0.5 bg-emerald-500 rounded-full"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          <p className="text-[10px] text-slate-600 font-medium italic truncate">
            "Main road par bijli ki taar gir gayi..."
          </p>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* D. FLOATING CARD 3: 250m HAVERSINE CLUSTERING (Bottom-Left)   */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          style={{
            x: prefersReducedMotion ? 0 : layerCardsX,
            y: prefersReducedMotion ? 0 : layerCardsY,
            translateZ: 45,
          }}
          className="absolute bottom-4 sm:bottom-6 left-1 sm:left-4 w-[185px] sm:w-[215px] p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg shadow-slate-900/6 transition-all hover:border-teal-500/50 hover:shadow-xl z-20"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
              <div className="w-4 h-4 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center">
                <MapPin size={10} />
              </div>
              <span>250m Cluster</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          </div>

          <div className="space-y-0.5 my-1 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Duplicate Reports:</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-1 rounded text-[9px]">
                3 Merged
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Master Cluster:</span>
              <span className="font-mono font-bold text-teal-700 text-[9px]">
                RA-CLU-0012
              </span>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-100 flex items-center gap-1 text-[9px] text-emerald-700 font-semibold">
            <CheckCircle2 size={11} />
            <span>Zero duplicate dispatch</span>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* E. FLOATING CARD 4: VERIFIED CITIZEN DOSSIER (Bottom-Right)   */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          style={{
            x: prefersReducedMotion ? 0 : layerCardsX,
            y: prefersReducedMotion ? 0 : layerCardsY,
            translateZ: 40,
          }}
          className="absolute bottom-3 sm:bottom-5 right-1 sm:right-4 w-[180px] sm:w-[205px] p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg shadow-slate-900/6 transition-all hover:border-emerald-500/50 hover:shadow-xl z-20"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
              <div className="w-4 h-4 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck size={10} />
              </div>
              <span>IESCO Resolution</span>
            </div>
            <span className="px-1 py-0.5 rounded bg-emerald-100/70 text-emerald-800 text-[8px] font-extrabold">
              VERIFIED
            </span>
          </div>

          <div className="text-[10px] text-slate-600 font-medium space-y-0.5 my-1">
            <p className="flex justify-between">
              <span className="text-slate-400">Dossier:</span>
              <span className="font-mono font-bold text-slate-800 text-[9px]">RA-2026-1049</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="text-emerald-700 font-semibold text-[9px]">Citizen Approved ✓</span>
            </p>
          </div>

          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500">
            <span className="flex items-center gap-1">
              <FileText size={10} className="text-slate-400" />
              <span>Govt. PDF Dossier</span>
            </span>
            <span className="font-mono text-[8px] text-slate-400">Audited</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
