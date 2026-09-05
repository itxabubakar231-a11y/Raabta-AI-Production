import { Navigate, useLocation, Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, LogOut, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, token, loading, authState, logout } = useAuth()
  const location = useLocation()

  // 1. Session Verification Loading Screen (never redirect while INITIALIZING)
  if (loading || authState === 'INITIALIZING') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 space-y-4">
        <Logo size="lg" to={null} animated={false} theme="light" />
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
          <RefreshCw size={16} className="animate-spin text-emerald-600" />
          <span>Verifying secure portal authorization...</span>
        </div>
      </div>
    )
  }

  // 2. Unauthenticated Redirect to Login (only after session initialization concludes)
  if (!currentUser || !token || authState === 'UNAUTHENTICATED') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // 3. Role Authorization Guard
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = currentUser.role || 'citizen'
    if (!allowedRoles.includes(userRole)) {
      const defaultPortal =
        userRole === 'admin' ? '/admin' :
        userRole === 'officer' ? '/department' :
        '/track'

      return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 text-slate-900">
          <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-slate-200 shadow-xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert size={28} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Access Restricted
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                You do not have administrative authorization to access this area.
                Required role: <span className="font-bold text-slate-700">{allowedRoles.join(', ')}</span>.
                Your current role: <span className="font-bold text-slate-700 capitalize">{userRole}</span>.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Link
                to={defaultPortal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/10 transition-all"
              >
                <ArrowLeft size={14} />
                <span>Return to Your Portal</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  // 4. Authorized Access
  return children ? children : null
}
