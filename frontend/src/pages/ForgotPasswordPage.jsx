import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle, Sparkles, KeyRound } from 'lucide-react'
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
    <div className="min-h-screen bg-[#faf8f5] text-[#0c1824] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden geometric-bg-subtle selection:bg-emerald-500/20 selection:text-emerald-950">
      {/* Soft background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[380px] bg-gradient-to-b from-emerald-500/8 via-teal-500/5 to-transparent blur-[110px] pointer-events-none -z-10" />

      <div className="max-w-4xl w-full mx-auto">
        {/* Top brand bar */}
        <div className="flex items-center justify-between pb-6 sm:pb-8">
          <Logo size="md" to="/" theme="light" />
          <Link
            to="/login"
            className="text-xs font-semibold text-[#627282] hover:text-[#0c1824] transition-colors flex items-center gap-1"
          >
            <span>Back to Sign In</span>
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
                <KeyRound size={13} />
                <span>Credential Protection</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug font-display">
                  Secure Password Recovery
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Raabta AI employs cryptographically secure, time-delimited reset tokens to safeguard municipal official and citizen portal access.
                </p>
              </div>

              {/* Highlights */}
              <div className="pt-2 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>60-minute token expiration limit</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Single-use cryptographic validation</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Audit-logged credential modification</span>
                </div>
              </div>
            </div>

            {/* Support Note */}
            <div className="relative z-10 mt-6 pt-5 border-t border-white/10 space-y-1.5 text-[11px]">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5 font-display">
                <ShieldCheck size={14} />
                <span>Authentication Protocol:</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                If you no longer have access to your official department email, contact your designated municipal ICT system administrator.
              </p>
            </div>
          </div>

          {/* RIGHT: Recovery Form / Status */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6 bg-white">
            {submitted ? (
              <div className="space-y-4 text-center py-2">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80 shadow-sm">
                  <CheckCircle2 size={28} />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg sm:text-xl font-black text-[#0c1824] font-display">
                    Instructions Dispatched
                  </h2>
                  <p className="text-xs text-[#3e4c59] leading-relaxed max-w-sm mx-auto">
                    If an account exists with <span className="font-semibold text-[#0c1824]">{email}</span>, we have sent instructions to reset your password.
                  </p>
                  <p className="text-[11px] text-[#627282] mt-2 font-mono">
                    The link is valid for 60 minutes. Please check your inbox and spam folder.
                  </p>
                </div>

                {/* Developer Reset URL Helper */}
                {devResetUrl && (
                  <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-left text-xs text-[#0c1824] space-y-1.5 mt-3">
                    <div className="font-semibold text-emerald-800 flex items-center gap-1 font-display">
                      <ShieldCheck size={14} />
                      <span>Local Development Reset Link:</span>
                    </div>
                    <a
                      href={devResetUrl}
                      className="text-emerald-700 underline break-all font-mono text-[11px] hover:text-emerald-800 block"
                    >
                      {devResetUrl}
                    </a>
                  </div>
                )}

                <div className="pt-3 flex flex-col gap-2.5">
                  <Link
                    to="/login"
                    className="btn-primary w-full py-2.5 px-4 text-xs sm:text-sm rounded-xl"
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
                    className="text-xs text-[#627282] hover:text-[#0c1824] font-medium py-1 transition-colors cursor-pointer"
                  >
                    Didn't receive email? Try another address
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#0c1824] tracking-tight font-display">
                    Password Recovery
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-[#627282] font-medium">
                    Enter your registered email address to receive reset instructions
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium leading-relaxed flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="recovery-email" className="block text-xs font-semibold text-[#0c1824]">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#627282]">
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
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/10 text-[#0c1824] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs sm:text-sm transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 px-4 rounded-xl text-xs sm:text-sm mt-3"
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
                </form>

                <div className="pt-2 border-t border-[#0c1824]/6 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-[#627282] hover:text-[#0c1824] font-medium transition-colors"
                  >
                    <ArrowLeft size={13} />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
