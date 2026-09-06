import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  Mic, MapPin, Zap, CheckCircle2, ShieldCheck,
  FileText, Activity, Radio
} from 'lucide-react'

export default function Hero3DVisual() {
  const containerRef = useRef(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Cursor motion tracking
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Calibrated spring damping for calm, tactile, intelligent response
  const springConfig = { stiffness: 120, damping: 26, mass: 0.8 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)

  // Controlled 3D rotational tilt (-6 to +6 degrees)
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [6, -6])
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-7, 7])

  // 4-Layer Parallax Translations:
  // Layer 0: Background geometric lattice & champagne/emerald ambient glow
  const layer0X = useTransform(smoothX, [-0.5, 0.5], [-5, 5])
  const layer0Y = useTransform(smoothY, [-0.5, 0.5], [-5, 5])

  // Layer 1: Orbital intelligence lines and data nodes
  const layer1X = useTransform(smoothX, [-0.5, 0.5], [-12, 12])
  const layer1Y = useTransform(smoothY, [-0.5, 0.5], [-12, 12])

  // Layer 2: Central Crystalline Intelligence Core
  const layer2X = useTransform(smoothX, [-0.5, 0.5], [-18, 18])
  const layer2Y = useTransform(smoothY, [-0.5, 0.5], [-18, 18])

  // Layer 3: Floating Telemetry Cards
  const layer3X = useTransform(smoothX, [-0.5, 0.5], [-26, 26])
  const layer3Y = useTransform(smoothY, [-0.5, 0.5], [-26, 26])

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
      className="relative w-full max-w-lg lg:max-w-xl mx-auto h-[390px] sm:h-[440px] lg:h-[470px] flex items-center justify-center select-none overflow-visible"
      style={{ perspective: 1200 }}
    >
      {/* ------------------------------------------------------------- */}
      {/* LAYER 0: AMBIENT GLOW & CULTURAL GEOMETRIC VECTOR LATTICE     */}
      {/* ------------------------------------------------------------- */}
      <motion.div
        style={{
          x: prefersReducedMotion ? 0 : layer0X,
          y: prefersReducedMotion ? 0 : layer0Y
        }}
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
      >
        {/* Dual Soft Ambient Radials (Emerald & Subtle Champagne) */}
        <div className="w-[320px] sm:w-[400px] h-[320px] sm:h-[400px] rounded-full bg-gradient-to-tr from-emerald-500/12 via-teal-500/8 to-amber-500/6 blur-3xl" />

        {/* Sophisticated Architectural Linework (Geometric Octagram & Concentric Rings) */}
        <svg
          className="absolute w-[360px] sm:w-[430px] h-[360px] sm:h-[430px] opacity-[0.22] text-[#064e3b]"
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="250" cy="250" r="225" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 5" />
          <circle cx="250" cy="250" r="175" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
          <circle cx="250" cy="250" r="120" stroke="currentColor" strokeWidth="0.6" strokeDasharray="4 4" />
          {/* Subtle Octagram Motif */}
          <polygon
            points="250,28 406,93 472,250 406,407 250,472 94,407 28,250 94,93"
            stroke="currentColor"
            strokeWidth="0.6"
            opacity="0.4"
          />
          <polygon
            points="250,55 388,112 445,250 388,388 250,445 112,388 55,250 112,112"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="2 4"
            opacity="0.3"
          />
        </svg>
      </motion.div>

      {/* ------------------------------------------------------------- */}
      {/* LAYER 1: 3D TRANSFORM SHELL & SVG ENERGY FLOWS                 */}
      {/* ------------------------------------------------------------- */}
      <motion.div
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full h-full flex items-center justify-center"
      >
        {/* Telemetry Vector Traces */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0"
          viewBox="0 0 480 440"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="flowEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.15" />
            </linearGradient>
            <filter id="vectorGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Calibrated Connection Rays to Core Center (240, 220) */}
          <path d="M 110 90 Q 170 145, 240 220" fill="none" stroke="url(#flowEmeraldGrad)" strokeWidth="1.5" strokeDasharray="3 4" />
          <path d="M 370 85 Q 310 140, 240 220" fill="none" stroke="url(#flowEmeraldGrad)" strokeWidth="1.5" strokeDasharray="3 4" />
          <path d="M 115 345 Q 175 290, 240 220" fill="none" stroke="url(#flowEmeraldGrad)" strokeWidth="1.5" strokeDasharray="3 4" />
          <path d="M 365 350 Q 305 295, 240 220" fill="none" stroke="url(#flowEmeraldGrad)" strokeWidth="1.5" strokeDasharray="3 4" />

          {/* Smooth Energy Packets travelling to Hub */}
          {!prefersReducedMotion && (
            <>
              <circle r="3" fill="#10b981" filter="url(#vectorGlow)">
                <animateMotion repeatCount="indefinite" dur="3.4s" path="M 110 90 Q 170 145, 240 220" />
              </circle>
              <circle r="3" fill="#e11d48" filter="url(#vectorGlow)">
                <animateMotion repeatCount="indefinite" dur="2.9s" path="M 370 85 Q 310 140, 240 220" />
              </circle>
              <circle r="3" fill="#0d9488" filter="url(#vectorGlow)">
                <animateMotion repeatCount="indefinite" dur="3.7s" path="M 115 345 Q 175 290, 240 220" />
              </circle>
              <circle r="3" fill="#d97706" filter="url(#vectorGlow)">
                <animateMotion repeatCount="indefinite" dur="3.2s" path="M 365 350 Q 305 295, 240 220" />
              </circle>
            </>
          )}
        </svg>

        {/* ------------------------------------------------------------- */}
        {/* LAYER 2: 3D CRYSTALLINE CORE PRISM & ORBITAL RINGS            */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          style={{
            x: prefersReducedMotion ? 0 : layer2X,
            y: prefersReducedMotion ? 0 : layer2Y,
            translateZ: 24
          }}
          className="relative flex items-center justify-center z-10"
        >
          {/* Orbital Ring A (Horizontal Inclined) */}
          <motion.div
            animate={prefersReducedMotion ? {} : { rotate: 360 }}
            transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
            className="w-44 sm:w-52 h-44 sm:h-52 rounded-full border border-emerald-500/25 border-dashed relative shadow-inner pointer-events-none"
            style={{ transform: 'rotateX(70deg)' }}
          >
            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-sm shadow-emerald-500/50" />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
          </motion.div>

          {/* Orbital Ring B (Cross Angle) */}
          <motion.div
            animate={prefersReducedMotion ? {} : { rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute w-38 sm:w-44 h-38 sm:h-44 rounded-full border border-teal-500/20 pointer-events-none"
            style={{ transform: 'rotateY(62deg) rotateX(24deg)' }}
          >
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-teal-500" />
          </motion.div>

          {/* Central Crystalline Prism */}
          <div className="absolute w-22 sm:w-26 h-22 sm:h-26 rounded-2xl bg-gradient-to-tr from-[#044e3b] via-[#065f46] to-[#0f766e] p-0.5 shadow-2xl shadow-emerald-950/25 transform rotate-3 flex items-center justify-center backdrop-blur-md">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-white/25 via-white/5 to-black/35 flex flex-col items-center justify-center p-2 relative overflow-hidden border border-white/20">
              <div className="absolute -top-6 -left-6 w-14 h-14 bg-white/30 rounded-full blur-md" />
              <img
                src="/favicon.svg"
                alt="Raabta Intelligence"
                className="w-10 h-10 object-contain drop-shadow-md relative z-10"
              />
              <span className="mt-1 text-[8px] font-black tracking-widest text-emerald-200 uppercase z-10">
                Gemma AI
              </span>
            </div>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* LAYER 3: FLOATING TELEMETRY CARDS (Tactile Soft UI)          */}
        {/* ------------------------------------------------------------- */}

        {/* CARD 1: 0-100 CIVIC RISK (Top-Right) */}
        <motion.div
          style={{
            x: prefersReducedMotion ? 0 : layer3X,
            y: prefersReducedMotion ? 0 : layer3Y,
            translateZ: 55,
          }}
          className="absolute top-1 sm:top-3 right-0 sm:right-2 w-[185px] sm:w-[215px] p-3.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-lg shadow-slate-900/5 transition-all hover:border-emerald-500/40 hover:shadow-xl z-20"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Civic Risk Score</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[9px] font-extrabold uppercase">
              Critical
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mb-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-display">88</span>
            <span className="text-[10px] font-semibold text-slate-400">/ 100</span>
            <span className="text-[10px] font-bold text-red-600 ml-auto flex items-center gap-0.5">
              <Zap size={11} />
              <span>Life-Safety</span>
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mb-2">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 w-[88%]" />
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1.5 border-t border-slate-100 font-medium">
            <span className="truncate text-slate-600">IESCO High-Voltage</span>
            <span className="font-mono text-emerald-700 font-bold">≤ 4h SLA</span>
          </div>
        </motion.div>

        {/* CARD 2: MULTIMODAL URDU VOICE (Top-Left) */}
        <motion.div
          style={{
            x: prefersReducedMotion ? 0 : layer3X,
            y: prefersReducedMotion ? 0 : layer3Y,
            translateZ: 42,
          }}
          className="absolute top-5 sm:top-7 left-0 sm:left-2 w-[180px] sm:w-[205px] p-3.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-lg shadow-slate-900/5 transition-all hover:border-emerald-500/40 hover:shadow-xl z-20"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
              <div className="w-4 h-4 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Mic size={10} />
              </div>
              <span>Urdu / EN Voice</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[9px] font-bold border border-emerald-200/60">
              98% AI
            </span>
          </div>

          {/* Waveform Micro-Visualizer */}
          <div className="flex items-center justify-center gap-0.5 h-5 bg-[#faf8f5] rounded-lg px-2 my-1.5 border border-slate-100">
            {[45, 80, 100, 65, 90, 75, 50, 85, 60, 40].map((h, i) => (
              <motion.span
                key={i}
                animate={prefersReducedMotion ? {} : { height: [`${h * 0.35}%`, `${h}%`, `${h * 0.35}%`] }}
                transition={{ duration: 1.15, repeat: Infinity, delay: i * 0.07, ease: 'easeInOut' }}
                className="w-0.5 bg-emerald-600 rounded-full"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          <p className="text-[10px] text-slate-600 font-medium italic truncate font-editorial">
            "Main road par bijli ki taar gir gayi..."
          </p>
        </motion.div>

        {/* CARD 3: 250m HAVERSINE CLUSTERING (Bottom-Left) */}
        <motion.div
          style={{
            x: prefersReducedMotion ? 0 : layer3X,
            y: prefersReducedMotion ? 0 : layer3Y,
            translateZ: 48,
          }}
          className="absolute bottom-3 sm:bottom-5 left-0 sm:left-3 w-[185px] sm:w-[215px] p-3.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-lg shadow-slate-900/5 transition-all hover:border-teal-500/40 hover:shadow-xl z-20"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
              <div className="w-4 h-4 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center">
                <MapPin size={10} />
              </div>
              <span>250m Cluster</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
          </div>

          <div className="space-y-1 my-1.5 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Duplicate Reports:</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[9px]">
                3 Merged
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Master Cluster:</span>
              <span className="font-mono font-bold text-teal-800 text-[9px]">
                RA-CLU-0012
              </span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1 text-[9px] text-emerald-700 font-semibold">
            <CheckCircle2 size={11} className="text-emerald-600" />
            <span>Zero duplicate dispatch</span>
          </div>
        </motion.div>

        {/* CARD 4: CITIZEN-VERIFIED DOSSIER (Bottom-Right) */}
        <motion.div
          style={{
            x: prefersReducedMotion ? 0 : layer3X,
            y: prefersReducedMotion ? 0 : layer3Y,
            translateZ: 44,
          }}
          className="absolute bottom-2 sm:bottom-4 right-0 sm:right-3 w-[180px] sm:w-[205px] p-3.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-lg shadow-slate-900/5 transition-all hover:border-emerald-500/40 hover:shadow-xl z-20"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
              <div className="w-4 h-4 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <ShieldCheck size={10} />
              </div>
              <span>Resolution Proof</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-900 text-[8px] font-black uppercase tracking-wider">
              VERIFIED
            </span>
          </div>

          <div className="text-[10px] text-slate-600 font-medium space-y-1 my-1.5">
            <p className="flex justify-between">
              <span className="text-slate-400">Dossier:</span>
              <span className="font-mono font-bold text-slate-800 text-[9px]">RA-2026-1049</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="text-emerald-700 font-semibold text-[9px]">Citizen Approved ✓</span>
            </p>
          </div>

          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500 font-medium">
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
