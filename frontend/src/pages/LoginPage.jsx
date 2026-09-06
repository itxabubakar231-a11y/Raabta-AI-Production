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

      // Role-aware destination routing (/app for citizens, /gov for officer/admin)
      const isGovRole = user.role === 'officer' || user.role === 'admin'
      const canAccessFrom = from && (
        (from.startsWith('/gov') && isGovRole) ||
        (from.startsWith('/app') && !isGovRole)
      )

      if (canAccessFrom) {
        navigate(from, { replace: true })
      } else if (isGovRole) {
        navigate('/gov', { replace: true })
      } else {
        navigate('/app', { replace: true })
      }
    } catch (err) {
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
    <div className="min-h-screen bg-[#faf8f5] text-[#0c1824] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden geometric-bg-subtle selection:bg-emerald-500/20 selection:text-emerald-950">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[380px] bg-gradient-to-b from-emerald-500/8 via-teal-500/5 to-transparent blur-[110px] pointer-events-none -z-10" />

      <div className="max-w-4xl w-full mx-auto">
        {/* Top brand bar */}
        <div className="flex items-center justify-between pb-6 sm:pb-8">
          <Logo size="md" to="/" theme="light" />
          <Link
            to="/"
            className="text-xs font-semibold text-[#627282] hover:text-[#0c1824] transition-colors flex items-center gap-1"
          >
            <span>Back to Public Overview</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* 2-Column Luxury Split Card */}
        <div className="bg-white rounded-3xl border border-[#0c1824]/8 shadow-2xl shadow-slate-900/5 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT: Editorial showcase */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#082f49] via-[#064e3b] to-[#041f33] p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold text-emerald-300 font-display">
                <Sparkles size={13} />
                <span>Verified Authority Portal</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug font-display">
                  Civic Intelligence & Incident Dispatch
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Real-time municipal telemetry, multimodal risk scoring, and verified resolution dossiers for Islamabad Capital Territory.
                </p>
              </div>

              {/* Highlights */}
              <div className="pt-2 space-y-2.5">
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
                  <span>Immutable Audit Logs & PDF Dossiers</span>
                </div>
              </div>
            </div>

            {/* Demo Credentials Guide */}
            <div className="relative z-10 mt-6 pt-5 border-t border-white/10 space-y-2 text-[11px]">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5 font-display">
                <Shield size={13} />
                <span>Standard Portal Credentials:</span>
              </div>
              <div className="space-y-1 text-slate-300 font-mono text-[10px]">
                <div className="flex justify-between items-center bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  <span className="text-slate-400">Admin:</span>
                  <span>admin@raabta.gov.pk</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  <span className="text-slate-400">Duty Officer:</span>
                  <span>officer@raabta.gov.pk</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  <span className="text-slate-400">Password:</span>
                  <span className="text-emerald-400 font-bold">Password123!</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6 bg-white">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0c1824] tracking-tight font-display">
                Sign In to Raabta AI
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#627282] font-medium">
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
                <label htmlFor="login-email" className="block text-xs font-semibold text-[#0c1824]">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#627282]">
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/10 text-[#0c1824] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs sm:text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="login-password" className="block text-xs font-semibold text-[#0c1824]">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#627282]">
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
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/10 text-[#0c1824] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs sm:text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#627282] hover:text-[#0c1824] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 px-4 rounded-xl text-xs sm:text-sm mt-3"
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

            <div className="pt-2 border-t border-[#0c1824]/6 flex flex-col sm:flex-row justify-between items-center text-xs text-[#627282] gap-2">
              <span>Need a new citizen account?</span>
              <Link
                to="/signup"
                className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
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
