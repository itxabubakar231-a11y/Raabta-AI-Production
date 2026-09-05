import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Lock, Mail, Eye, EyeOff, ArrowRight, Shield, Sparkles, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email address.')
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)
    try {
      const user = await login(trimmedEmail, password)

      // Role-aware destination routing
      const canAccessFrom = from && (
        (from.startsWith('/admin') && user.role === 'admin') ||
        (from.startsWith('/department') && (user.role === 'officer' || user.role === 'admin')) ||
        (!from.startsWith('/admin') && !from.startsWith('/department'))
      )

      if (canAccessFrom) {
        navigate(from, { replace: true })
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (user.role === 'officer') {
        navigate('/department', { replace: true })
      } else {
        navigate('/track', { replace: true })
      }
    } catch (err) {
      // Neutral, friendly error without leaking whether the account exists
      if (err.message && (err.message.includes('401') || err.message.toLowerCase().includes('invalid'))) {
        setError("We couldn't sign you in with those details. Please check your email and password.")
      } else {
        setError(err.message || 'Something went wrong while connecting. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Soft background ambient gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-100/30 via-slate-100/40 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl w-full mx-auto">
        {/* Top brand header */}
        <div className="flex items-center justify-between pb-6 sm:pb-8">
          <Logo size="md" to="/" theme="light" />
          <Link
            to="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
          >
            <span>Back to Public Overview</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Split Grid: Left Branding, Right Login */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT: Editorial showcase */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold text-emerald-300">
                <Sparkles size={13} />
                <span>Verified Authority Portal</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
                  Civic Intelligence & Incident Dispatch
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Real-time municipal telemetry, multi-modal risk scoring, and verified resolution dossiers for Islamabad Capital Territory.
                </p>
              </div>

              {/* Highlights */}
              <div className="pt-3 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Google Gemma AI Multimodal Triage</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Role-Protected Command & Dispatch</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Immutable Audit Logs & Resolution Dossiers</span>
                </div>
              </div>
            </div>

            {/* Quick Demo Credentials Guide */}
            <div className="relative z-10 mt-6 pt-5 border-t border-white/10 space-y-2 text-[11px]">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Shield size={13} />
                <span>Standard Portal Credentials:</span>
              </div>
              <div className="space-y-1 text-slate-300 font-mono text-[10px]">
                <div className="flex justify-between items-center bg-white/5 px-2 py-1 rounded border border-white/5">
                  <span className="text-slate-400">Admin:</span>
                  <span>admin@raabta.gov.pk</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 px-2 py-1 rounded border border-white/5">
                  <span className="text-slate-400">Duty Officer:</span>
                  <span>officer@raabta.gov.pk</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 px-2 py-1 rounded border border-white/5">
                  <span className="text-slate-400">Password:</span>
                  <span className="text-emerald-400 font-bold">Password123!</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Sign In to Raabta AI
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                Enter your registered credentials to access your portal
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium leading-relaxed flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@raabta.gov.pk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/70 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs sm:text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50/70 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs sm:text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-3 cursor-pointer"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
              <span>Need a new citizen account?</span>
              <Link
                to="/signup"
                className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
              >
                Create Citizen Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
