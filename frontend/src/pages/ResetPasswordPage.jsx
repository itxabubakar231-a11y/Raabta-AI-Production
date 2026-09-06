import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, ShieldCheck, KeyRound, Sparkles } from 'lucide-react'
import { verifyResetToken, resetPassword } from '../services/api'
import Logo from '../components/Logo'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState('')
  const [verifyError, setVerifyError] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setVerifying(false)
      setVerifyError('No password reset token was provided in the link.')
      return
    }

    async function checkToken() {
      try {
        const res = await verifyResetToken(token)
        if (res.success) {
          setTokenValid(true)
          setMaskedEmail(res.email || '')
        } else {
          setVerifyError(res.error || 'This reset link is invalid or has expired.')
        }
      } catch (err) {
        setVerifyError(err.message || 'Invalid or expired password reset link.')
      } finally {
        setVerifying(false)
      }
    }

    checkToken()
  }, [token])

  // Password strength validation
  const hasMinLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')

    if (!hasMinLength) {
      setSubmitError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match. Please re-enter.')
      return
    }

    setSubmitting(true)
    try {
      await resetPassword({
        token,
        password,
        confirm_password: confirmPassword
      })
      setSuccess(true)
    } catch (err) {
      setSubmitError(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setSubmitting(false)
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
                <Sparkles size={13} />
                <span>Security Standards</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug font-display">
                  Create New Credentials
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Establish a hardened password to protect your citizen reports, municipal dispatches, and account integrity.
                </p>
              </div>

              {/* Highlights */}
              <div className="pt-2 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Bcrypt / Argon2 cryptographic salting</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Automatic termination of active sessions</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Role-specific access key rotation</span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="relative z-10 mt-6 pt-5 border-t border-white/10 space-y-1.5 text-[11px]">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5 font-display">
                <ShieldCheck size={14} />
                <span>Account Protection:</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Choose a unique password you do not use on other municipal or personal portals.
              </p>
            </div>
          </div>

          {/* RIGHT: Reset Form / State */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-5 bg-white">
            {verifying ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#627282] font-medium font-mono">Verifying reset authorization token...</p>
              </div>
            ) : !tokenValid ? (
              <div className="space-y-4 text-center py-4">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shadow-sm">
                  <AlertCircle size={28} />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg font-bold text-[#0c1824] font-display">
                    Reset Link Expired or Invalid
                  </h2>
                  <p className="text-xs text-[#3e4c59] leading-relaxed max-w-sm mx-auto">
                    {verifyError || 'For security, password reset links expire after 1 hour and can only be used once.'}
                  </p>
                </div>
                <div className="pt-3">
                  <Link
                    to="/forgot-password"
                    className="btn-primary w-full py-2.5 px-4 text-xs sm:text-sm rounded-xl"
                  >
                    <span>Request New Link</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : success ? (
              <div className="space-y-4 text-center py-4">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-sm">
                  <CheckCircle2 size={28} />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg sm:text-xl font-bold text-[#0c1824] font-display">
                    Password Updated Successfully
                  </h2>
                  <p className="text-xs text-[#3e4c59] leading-relaxed max-w-sm mx-auto">
                    Your credentials have been securely updated. You can now sign in with your new password.
                  </p>
                </div>
                <div className="pt-3">
                  <Link
                    to="/login"
                    className="btn-primary w-full py-2.5 px-4 text-xs sm:text-sm rounded-xl"
                  >
                    <span>Sign In Now</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#0c1824] tracking-tight font-display">
                    Create New Password
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-[#627282] font-medium">
                    Choose a strong password to secure your account
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {maskedEmail && (
                    <div className="p-2.5 bg-[#faf8f5] border border-[#0c1824]/8 rounded-xl text-[11px] text-[#627282] flex items-center gap-2">
                      <ShieldCheck size={14} className="text-emerald-700 shrink-0" />
                      <span>
                        Updating account: <strong className="text-[#0c1824]">{maskedEmail}</strong>
                      </span>
                    </div>
                  )}

                  {submitError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="new-password" className="block text-xs font-semibold text-[#0c1824]">
                      New Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#627282]">
                        <Lock size={16} />
                      </span>
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/10 text-[#0c1824] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs sm:text-sm transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#627282] hover:text-[#0c1824] transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="confirm-password" className="block text-xs font-semibold text-[#0c1824]">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#627282]">
                        <Lock size={16} />
                      </span>
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/10 text-[#0c1824] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs sm:text-sm transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#627282] hover:text-[#0c1824] transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Checklist */}
                  <div className="p-3 bg-[#faf8f5] border border-[#0c1824]/8 rounded-xl space-y-1 text-[11px]">
                    <div className="font-semibold text-[#0c1824] mb-1 font-display">Password Requirements:</div>
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                      <span>Minimum 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${hasUpper ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                      <span>At least one uppercase letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                      <span>At least one number or special character</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !hasMinLength}
                    className="btn-primary w-full py-3 px-4 rounded-xl text-xs sm:text-sm mt-3"
                  >
                    {submitting ? (
                      <span>Updating Password...</span>
                    ) : (
                      <>
                        <span>Reset Password</span>
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
