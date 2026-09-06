import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Phone, Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('citizen')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await signup({
        full_name: fullName,
        email,
        password,
        phone,
        role,
        department_id: null
      })
      if (user?.role === 'officer' || user?.role === 'admin') {
        navigate('/gov', { replace: true })
      } else {
        navigate('/app', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#0c1824] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden geometric-bg-subtle selection:bg-emerald-500/20 selection:text-emerald-950">
      {/* Soft background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[380px] bg-gradient-to-b from-emerald-500/8 via-teal-500/5 to-transparent blur-[110px] pointer-events-none -z-10" />

      <div className="max-w-4xl w-full mx-auto">
        {/* Top brand header */}
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
                <span>Citizen Civic Access</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug font-display">
                  Empower Your Neighborhood
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Join thousands of Islamabad residents holding municipal service providers accountable with photographic evidence and real-time SLA tracking.
                </p>
              </div>

              {/* Highlights */}
              <div className="pt-2 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Multimodal reporting in Urdu or English</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Direct triage to IESCO, CDA, WASA & SNGPL</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Mandatory photographic proof before closure</span>
                </div>
              </div>
            </div>

            {/* Citizen Protection Note */}
            <div className="relative z-10 mt-6 pt-5 border-t border-white/10 space-y-2 text-[11px]">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5 font-display">
                <ShieldCheck size={14} />
                <span>Citizen Privacy Guarantee:</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Your personal details remain confidential. Reports dispatched to municipal crews protect citizen anonymity while ensuring complete auditability.
              </p>
            </div>
          </div>

          {/* RIGHT: Signup Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-5 bg-white">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0c1824] tracking-tight font-display">
                Create Your Account
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#627282] font-medium">
                Join Raabta AI to report, track, and resolve civic complaints
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium leading-relaxed flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="fullName" className="block text-xs font-semibold text-[#0c1824]">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#627282]">
                    <User size={16} />
                  </span>
                  <input
                    id="fullName"
                    type="text"
                    required
                    placeholder="e.g. Tariq Mehmood"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/10 text-[#0c1824] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs sm:text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-semibold text-[#0c1824]">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#627282]">
                    <Mail size={16} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/10 text-[#0c1824] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs sm:text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-xs font-semibold text-[#0c1824]">
                  Phone Number <span className="text-[#627282] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#627282]">
                    <Phone size={16} />
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/10 text-[#0c1824] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs sm:text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-[#0c1824]">
                  Password <span className="text-[#627282] font-normal">(Min. 6 characters)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#627282]">
                    <Lock size={16} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
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
                  <span>Creating your account...</span>
                ) : (
                  <>
                    <span>Create Citizen Account</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-[#0c1824]/6 flex flex-col sm:flex-row justify-between items-center text-xs text-[#627282] gap-2">
              <span>Already registered?</span>
              <Link
                to="/login"
                className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
              >
                Sign In to Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
