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
    <div className={`p-10 md:p-14 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md text-center max-w-xl mx-auto space-y-4 shadow-xl ${className}`}>
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-1 shadow-inner">
        <Icon size={26} />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-white tracking-tight">
          {title}
        </h3>
        <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {(actionText && (actionLink || onAction)) && (
        <div className="pt-2">
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs md:text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5"
            >
              <span>{actionText}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs md:text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5"
            >
              <span>{actionText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
