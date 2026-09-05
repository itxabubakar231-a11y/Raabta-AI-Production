import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  Activity, ShieldCheck, MapPin, Mic, FileText,
  Clock, Zap, CheckCircle2, AlertTriangle, Radio
} from 'lucide-react'

export default function Hero3DVisual() {
  const containerRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Motion values for smooth cursor tracking
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Spring physics for natural, calm, intelligent dampening
  const springConfig = { stiffness: 120, damping: 22, mass: 0.8 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)

  // 3D rotations based on normalized cursor coordinates (-1 to 1)
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [6, -6])
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-8, 8])
  
  // Parallax translation offsets for depth layers
  const depthFarX = useTransform(smoothX, [-0.5, 0.5], [-12, 12])
  const depthFarY = useTransform(smoothY, [-0.5, 0.5], [-12, 12])
  const depthMidX = useTransform(smoothX, [-0.5, 0.5], [-20, 20])
  const depthMidY = useTransform(smoothY, [-0.5, 0.5], [-20, 20])
  const depthNearX = useTransform(smoothX, [-0.5, 0.5], [-28, 28])
  const depthNearY = useTransform(smoothY, [-0.5, 0.5], [-28, 28])

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
    setIsHovered(false)
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-xl lg:max-w-2xl mx-auto h-[480px] sm:h-[540px] md:h-[580px] flex items-center justify-center select-none"
      style={{ perspective: 1200 }}
    >
      {/* 1. SOFT AMBIENT LAYER & CULTURAL GEOMETRIC MOTIF (Depth 0) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Soft Radial Ambient Glow */}
        <div className="w-[340px] sm:w-[440px] h-[340px] sm:h-[440px] rounded-full bg-gradient-to-br from-emerald-500/12 via-teal-500/8 to-amber-500/5 blur-3xl" />
        
        {/* Understated Geometric Cultural Rings */}
        <svg
          className="absolute w-[420px] sm:w-[500px] h-[420px] sm:h-[500px] opacity-25 text-emerald-800"
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Octagonal & Circular Alignment (Refined South Asian Geometric Linework) */}
          <circle cx="250" cy="250" r="230" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 6" />
          <circle cx="250" cy="250" r="180" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <circle cx="250" cy="250" r="130" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 5" />
          <polygon
            points="250,30 405,95 470,250 405,405 250,470 95,405 30,250 95,95"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.2"
          />
          <polygon
            points="250,55 388,112 445,250 388,388 250,445 112,388 55,250 112,112"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="2 4"
            opacity="0.15"
          />
        </svg>
      </div>

      {/* 2. 3D INTERACTIVE TRANSFORM WRAPPER */}
      <motion.div
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full h-full flex items-center justify-center"
      >
        {/* ------------------------------------------------------------- */}
        {/* A. 3D CENTRAL CORE: THE RAABTA AI INTELLIGENCE SPHERE         */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          style={{ x: depthFarX, y: depthFarY, translateZ: 0 }}
          className="relative flex items-center justify-center"
        >
          {/* Outer Glass Orbital Ring 1 */}
          <motion.div
            animate={prefersReducedMotion ? {} : { rotate: 360 }}
            transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
            className="w-48 sm:w-56 h-48 sm:h-56 rounded-full border border-emerald-500/30 border-dashed relative shadow-inner"
            style={{ transform: 'rotateX(65deg)' }}
          >
            {/* Orbiting Connection Nodes */}
            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50" />
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
          </motion.div>

          {/* Outer Glass Orbital Ring 2 (Cross Angle) */}
          <motion.div
            animate={prefersReducedMotion ? {} : { rotate: -360 }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            className="absolute w-40 sm:w-48 h-40 sm:h-48 rounded-full border border-teal-500/25 relative"
            style={{ transform: 'rotateY(60deg) rotateX(30deg)' }}
          >
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </motion.div>

          {/* Central 3D Crystalline Core */}
          <div className="absolute w-24 sm:w-28 h-24 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#083344] via-[#0e4e5b] to-[#059669] p-0.5 shadow-2xl shadow-emerald-950/20 transform rotate-12 flex items-center justify-center backdrop-blur-md">
            <div className="w-full h-full rounded-[22px] bg-gradient-to-br from-white/20 via-transparent to-black/30 flex flex-col items-center justify-center p-3 relative overflow-hidden">
              {/* Refractive Light Highlight */}
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-white/40 rounded-full blur-md" />
              
              {/* Inner Emblem Icon */}
              <img
                src="/favicon.svg"
                alt="Raabta Core"
                className="w-12 h-12 object-contain drop-shadow-md relative z-10"
              />
              
              <span className="mt-1 text-[9px] font-black tracking-widest text-emerald-200 uppercase z-10">
                Gemma AI
              </span>
            </div>
          </div>

          {/* Glowing Radial Energy Pulses (radiating to cards) */}
          <div className="absolute w-64 h-64 rounded-full bg-radial from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* B. FLOATING TELEMETRY CARD 1: 0-100 CIVIC RISK GAUGE          */}
        {/* Top-Right (Depth Near)                                        */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          style={{
            x: depthNearX,
            y: depthNearY,
            translateZ: 65,
          }}
          className="absolute top-4 sm:top-6 right-2 sm:right-4 w-[210px] sm:w-[240px] p-3.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-900/8 transition-all hover:shadow-2xl hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Civic Risk Score</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-red-50 border border-red-200/60 text-red-700 text-[10px] font-extrabold uppercase tracking-wide">
              Critical SLA
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-3xl font-black text-slate-900 tracking-tight">88</span>
            <span className="text-xs font-semibold text-slate-400">/ 100</span>
            <span className="text-[11px] font-bold text-red-600 ml-auto flex items-center gap-0.5">
              <Zap size={12} />
              Life-Safety
            </span>
          </div>

          {/* Progress Bar with mathematical breakdown indicator */}
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-1000"
              style={{ width: '88%' }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
            <span className="truncate max-w-[130px] font-medium text-slate-600">IESCO High-Voltage</span>
            <span className="font-mono text-emerald-700 font-bold">≤ 4h SLA</span>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* C. FLOATING TELEMETRY CARD 2: BILINGUAL MULTIMODAL VOICE      */}
        {/* Top-Left (Depth Mid)                                          */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          style={{
            x: depthMidX,
            y: depthMidY,
            translateZ: 45,
          }}
          className="absolute top-10 sm:top-12 left-2 sm:left-4 w-[200px] sm:w-[230px] p-3.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-900/8 transition-all hover:shadow-2xl hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <div className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Mic size={12} />
              </div>
              <span>Urdu / English Voice</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[9px] font-bold">
              98% AI
            </span>
          </div>

          {/* Animated Audio Waveform */}
          <div className="flex items-center justify-center gap-1 h-6 bg-slate-50 rounded-lg px-2 my-2">
            {[40, 75, 95, 60, 85, 100, 70, 50, 80, 65, 45].map((h, i) => (
              <motion.span
                key={i}
                animate={prefersReducedMotion ? {} : { height: [`${h * 0.4}%`, `${h}%`, `${h * 0.5}%`] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
                className="w-1 bg-emerald-500 rounded-full"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          <p className="text-[11px] text-slate-600 leading-snug font-medium italic truncate">
            "Main road par bijli ki taar gir gayi hai..."
          </p>
          <p className="text-[9px] text-slate-400 mt-1">
            Multimodal Whisper + Gemma 3.6
          </p>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* D. FLOATING TELEMETRY CARD 3: 250m HAVERSINE CLUSTERING       */}
        {/* Bottom-Left (Depth Near)                                      */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          style={{
            x: depthNearX,
            y: depthNearY,
            translateZ: 55,
          }}
          className="absolute bottom-6 sm:bottom-8 left-2 sm:left-6 w-[210px] sm:w-[240px] p-3.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-900/8 transition-all hover:shadow-2xl hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <div className="w-5 h-5 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <MapPin size={12} />
              </div>
              <span>250m Proximity Cluster</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-teal-500" />
          </div>

          <div className="space-y-1 my-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Duplicate Reports:</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                3 Merged
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Master Incident:</span>
              <span className="font-mono font-bold text-teal-700 text-[10px]">
                RA-CLU-0012
              </span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold">
            <CheckCircle2 size={12} />
            <span>Zero duplicate dispatch waste</span>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* E. FLOATING TELEMETRY CARD 4: VERIFIED AGENCY DISPATCH & PDF  */}
        {/* Bottom-Right (Depth Mid)                                      */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          style={{
            x: depthMidX,
            y: depthMidY,
            translateZ: 50,
          }}
          className="absolute bottom-4 sm:bottom-6 right-2 sm:right-6 w-[200px] sm:w-[230px] p-3.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-900/8 transition-all hover:shadow-2xl hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <div className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck size={12} />
              </div>
              <span>Agency Dispatch</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-800 text-[9px] font-extrabold">
              IESCO
            </span>
          </div>

          <div className="text-[11px] text-slate-600 font-medium space-y-0.5 my-1.5">
            <p className="flex justify-between">
              <span className="text-slate-400">Dossier ID:</span>
              <span className="font-mono font-bold text-slate-800 text-[10px]">RA-2026-1049</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">Resolution:</span>
              <span className="text-emerald-700 font-semibold text-[10px]">Citizen Verified ✓</span>
            </p>
          </div>

          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <FileText size={11} className="text-slate-400" />
              <span>Official PDF Issued</span>
            </span>
            <span className="text-[9px] font-mono text-slate-400">Govt. Verified</span>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* F. CONNECTING BEZIER DATA PATHS (SVG Layer in 3D Space)       */}
        {/* ------------------------------------------------------------- */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
          style={{ transform: 'translateZ(20px)' }}
        >
          {/* Path from Top-Left to Center */}
          <path
            d="M 120 100 Q 200 160, 260 220"
            fill="none"
            stroke="#059669"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {/* Path from Center to Top-Right */}
          <path
            d="M 280 220 Q 360 160, 440 100"
            fill="none"
            stroke="#059669"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {/* Path from Center to Bottom-Left */}
          <path
            d="M 240 280 Q 180 340, 130 400"
            fill="none"
            stroke="#0e4e5b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {/* Path from Center to Bottom-Right */}
          <path
            d="M 290 280 Q 360 350, 420 400"
            fill="none"
            stroke="#0e4e5b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>
      </motion.div>
    </div>
  )
}
