import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, UserCheck, MessageSquare } from 'lucide-react'

export default function TimelineView({ timeline = [], currentStatus = 'submitted' }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-xs text-slate-500 p-4 text-center">
        No timeline events recorded yet.
      </div>
    )
  }

  const getActionIcon = (action) => {
    const act = (action || '').toUpperCase()
    if (act.includes('RESOLVED') || act.includes('ACCEPTED') || act.includes('CLOSED')) {
      return <CheckCircle2 size={16} className="text-emerald-600" />
    }
    if (act.includes('DISPUTE')) {
      return <AlertTriangle size={16} className="text-red-600" />
    }
    if (act.includes('ASSIGN')) {
      return <UserCheck size={16} className="text-blue-600" />
    }
    if (act.includes('ADDITIONAL') || act.includes('INFO')) {
      return <MessageSquare size={16} className="text-amber-600" />
    }
    if (act.includes('COMPLETED') || act.includes('WORK')) {
      return <ShieldCheck size={16} className="text-indigo-600" />
    }
    return <Clock size={16} className="text-slate-500" />
  }

  const formatActionTitle = (action) => {
    return (action || 'UPDATE')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {timeline.map((event, idx) => {
        const ts = event.timestamp ? new Date(event.timestamp).toLocaleString() : ''
        return (
          <div key={idx} className="relative group">
            {/* Dot / Icon */}
            <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white border border-slate-300 shadow-xs">
              {getActionIcon(event.action)}
            </div>

            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-white transition-all shadow-2xs">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-bold text-slate-900">
                    {formatActionTitle(event.action)}
                  </h5>
                  {event.actor_role && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      {event.actor_role}
                    </span>
                  )}
                  {event.actor_name && (
                    <span className="text-[11px] text-slate-500 font-medium">by {event.actor_name}</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{ts}</span>
              </div>

              {event.details && (
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                  {typeof event.details === 'object'
                    ? (event.details.reason || event.details.email || event.details.notes || JSON.stringify(event.details))
                    : String(event.details)}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
