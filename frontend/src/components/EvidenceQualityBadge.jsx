import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react'

export default function EvidenceQualityBadge({ qualityLabel = 'Good', qualityScore = 0.85, reason = '' }) {
  const label = qualityLabel || 'Good'
  const pct = Math.round((qualityScore || 0.8) * 100)

  let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  let Icon = CheckCircle2

  if (label.toLowerCase() === 'poor') {
    badgeColor = 'bg-red-500/20 text-red-300 border-red-500/30'
    Icon = AlertCircle
  } else if (label.toLowerCase() === 'fair') {
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    Icon = HelpCircle
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}>
        <Icon size={14} />
        <span>Evidence: {label} ({pct}%)</span>
      </div>
      {reason && (
        <span className="text-[10px] text-slate-400 max-w-xs truncate" title={reason}>
          {reason}
        </span>
      )}
    </div>
  )
}
