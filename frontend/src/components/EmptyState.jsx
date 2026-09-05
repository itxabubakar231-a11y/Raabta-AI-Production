import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function EmptyState({
  icon: Icon = Sparkles,
  title = 'No activity yet',
  description = 'Your first practice session will appear here once you get started.',
  actionText,
  actionLink,
  onAction,
  className = ''
}) {
  return (
    <div className={`p-10 md:p-14 rounded-2xl border border-slate-200/90 bg-white text-center max-w-xl mx-auto space-y-4 shadow-sm ${className}`}>
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mb-1 shadow-sm">
        <Icon size={26} />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {(actionText && (actionLink || onAction)) && (
        <div className="pt-2">
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-semibold shadow-sm transition-all transform hover:-translate-y-0.5"
            >
              <span>{actionText}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-semibold shadow-sm transition-all transform hover:-translate-y-0.5"
            >
              <span>{actionText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
