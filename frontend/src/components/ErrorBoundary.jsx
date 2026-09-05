import React from 'react'
import { useRouteError, useNavigate, useLocation } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Home, ArrowLeft, ShieldAlert } from 'lucide-react'

export default function ErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()
  const location = useLocation()

  const isGov = location.pathname.startsWith('/gov')
  const dashboardPath = isGov ? '/gov' : '/app'

  const errorMessage = error?.statusText || error?.message || (typeof error === 'string' ? error : 'An unexpected application error occurred.')

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl text-center space-y-6">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
          <AlertTriangle size={32} />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldAlert size={13} className="text-emerald-600" />
            <span>Raabta AI &bull; System Recovery</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Something went wrong
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Raabta couldn't load this page right now. Your data has not been lost. You can reload or safely return to your dashboard.
          </p>
        </div>

        {/* Error Details */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left overflow-x-auto">
          <p className="text-[11px] font-mono text-slate-600 break-words line-clamp-3">
            {errorMessage}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(dashboardPath)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            <ArrowLeft size={14} />
            <span>Return to Portal</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200"
          >
            <Home size={14} />
            <span>Home</span>
          </button>
        </div>

        {/* Emergency Footer */}
        <div className="border-t border-slate-100 pt-4">
          <p className="text-[10px] text-slate-400">
            For life-threatening municipal or electrical emergencies, please call <span className="font-bold text-slate-700">1122</span> or <span className="font-bold text-slate-700">IESCO 118</span> directly.
          </p>
        </div>
      </div>
    </div>
  )
}
