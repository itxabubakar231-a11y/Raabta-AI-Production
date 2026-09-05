import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react'
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

  // Password strength check
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-emerald-100/40 via-teal-50/20 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Logo size="lg" to="/" theme="light" className="mx-auto" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create New Password
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Choose a strong password to secure your account
          </p>
        </div>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 space-y-5">
          {verifying ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Verifying reset authorization token...</p>
            </div>
          ) : !tokenValid ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shadow-sm">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900">
                  Reset Link Expired or Invalid
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {verifyError || 'For security, password reset links expire after 1 hour and can only be used once.'}
                </p>
              </div>
              <div className="pt-3">
                <Link
                  to="/forgot-password"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all inline-flex items-center justify-center gap-1.5"
                >
                  <span>Request New Link</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Password Updated Successfully
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your credentials have been securely updated. You can now sign in with your new password.
                </p>
              </div>
              <div className="pt-3">
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all inline-flex items-center justify-center gap-1.5"
                >
                  <span>Sign In Now</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {maskedEmail && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                  <span>
                    Updating credentials for account: <strong className="text-slate-800">{maskedEmail}</strong>
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
                <label htmlFor="new-password" className="block text-xs font-semibold text-slate-700">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50/70 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs sm:text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50/70 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs sm:text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-[11px]">
                <div className="font-semibold text-slate-700 mb-1">Password Strength Checklist:</div>
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>Minimum 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasUpper ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>At least one uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>At least one number or special character</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !hasMinLength}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
          )}
        </div>
      </div>
    </div>
  )
}
