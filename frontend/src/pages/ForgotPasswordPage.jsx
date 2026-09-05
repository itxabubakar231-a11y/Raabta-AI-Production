import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react'
import { forgotPassword } from '../services/api'
import Logo from '../components/Logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [devResetUrl, setDevResetUrl] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      const res = await forgotPassword(trimmed)
      setSubmitted(true)
      if (res._dev_reset_url) {
        setDevResetUrl(res._dev_reset_url)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-emerald-100/40 via-teal-50/20 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Logo size="lg" to="/" theme="light" className="mx-auto" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Password Recovery
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Raabta AI Secure Authentication Services
          </p>
        </div>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 space-y-5">
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Instructions Dispatched
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  If an account exists with <span className="font-semibold text-slate-900">{email}</span>, we have sent instructions to reset your password.
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  The link is valid for 60 minutes. Please check your inbox and spam folder.
                </p>
              </div>

              {devResetUrl && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-left text-xs text-slate-700 space-y-1.5 mt-3">
                  <div className="font-semibold text-emerald-800 flex items-center gap-1">
                    <ShieldCheck size={14} />
                    <span>Local Development Reset Link:</span>
                  </div>
                  <a
                    href={devResetUrl}
                    className="text-emerald-700 underline break-all font-mono text-[11px] hover:text-emerald-800"
                  >
                    {devResetUrl}
                  </a>
                </div>
              )}

              <div className="pt-3 flex flex-col gap-2.5">
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Return to Sign In</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false)
                    setEmail('')
                    setDevResetUrl('')
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium py-1 transition-colors"
                >
                  Didn't receive email? Try another address
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered email address and we'll send you a secure link to create a new password.
              </p>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="recovery-email" className="block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    autoFocus
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/70 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs sm:text-sm transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Sending Link...</span>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
