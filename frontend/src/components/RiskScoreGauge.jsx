import { useState } from 'react'
import { ShieldAlert, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react'

export default function RiskScoreGauge({ riskData, compact = false }) {
  const [expanded, setExpanded] = useState(false)

  if (!riskData) return null

  const score = riskData.score ?? 50
  const level = riskData.level || (score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW')
  const factors = riskData.factors || {}
  const slaHours = riskData.recommended_sla_hours || 48
  const primaryDriver = riskData.primary_driver

  let colorClasses = {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    bar: 'bg-emerald-600',
    text: 'text-emerald-700',
    glow: 'shadow-emerald-950/5'
  }

  if (score >= 75) {
    colorClasses = {
      badge: 'bg-red-50 text-red-800 border-red-200',
      bar: 'bg-red-600',
      text: 'text-red-700',
      glow: 'shadow-red-950/5'
    }
  } else if (score >= 50) {
    colorClasses = {
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      bar: 'bg-amber-600',
      text: 'text-amber-700',
      glow: 'shadow-amber-950/5'
    }
  } else if (score >= 25) {
    colorClasses = {
      badge: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      bar: 'bg-yellow-600',
      text: 'text-yellow-700',
      glow: 'shadow-yellow-950/5'
    }
  }

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${colorClasses.badge}`}>
          {score}/100 {level}
        </span>
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm ${colorClasses.glow}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${colorClasses.badge}`}>
            {score >= 75 ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Civic Risk Score</span>
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${colorClasses.badge}`}>
                {level}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-2xl font-black ${colorClasses.text}`}>{score}</span>
              <span className="text-xs text-slate-400 font-medium">/ 100 max</span>
              <span className="text-xs text-slate-500 border-l border-slate-200 pl-2">
                SLA: <strong className="text-slate-800 font-bold">{slaHours}h</strong>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors font-semibold"
        >
          <span>Factors</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClasses.bar}`}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>

      {primaryDriver && (
        <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
          <span className="text-slate-400 font-semibold">Driver:</span> {primaryDriver}
        </p>
      )}

      {/* Factor Breakdown Accordion */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
          <h4 className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">
            Explainable Factor Breakdown (100% Total)
          </h4>

          {[
            { key: 'public_safety', label: 'Public Safety Hazard', weight: '30%' },
            { key: 'infrastructure_severity', label: 'Infrastructure Severity', weight: '25%' },
            { key: 'citizen_impact', label: 'Citizen Impact & Reach', weight: '20%' },
            { key: 'location_vulnerability', label: 'Location Vulnerability', weight: '15%' },
            { key: 'evidence_confidence', label: 'Evidence Confidence', weight: '10%' }
          ].map(({ key, label, weight }) => {
            const factor = factors[key] || {}
            return (
              <div key={key} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between font-medium text-slate-700">
                  <span>{label} ({weight})</span>
                  <span className="font-bold text-slate-900">
                    {factor.score ?? 50}/100 <span className="text-slate-400 text-[10px]">(+{factor.contribution ?? 10} pts)</span>
                  </span>
                </div>
                {factor.reason && (
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{factor.reason}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
