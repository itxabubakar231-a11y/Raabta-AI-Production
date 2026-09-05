import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Shield, User, Lock, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, quickSwitchDemo } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(email, password)
      if (user.role === 'officer') {
        navigate('/department')
      } else if (user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/track')
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleDemoLogin(role) {
    setLoading(true)
    setError('')
    try {
      const user = await quickSwitchDemo(role)
      if (user.role === 'officer') {
        navigate('/department')
      } else if (user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/track')
      }
    } catch (err) {
      setError(err.message || 'Demo login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header Block */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 mb-2 shadow-lg shadow-emerald-950">
            <Shield size={28} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Raabta AI Portal</h2>
          <p className="text-xs text-slate-400">
            Official Civic Intelligence Platform of Pakistan
          </p>
        </div>

        {/* Demo Fast-Login Cards */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/25 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>1-Click Hackathon Evaluation Logins</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('citizen')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-600/30 hover:border-emerald-500/50 border border-slate-700 text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
            >
              <User size={14} className="text-emerald-400" />
              <span>Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('officer')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-600/30 hover:border-emerald-500/50 border border-slate-700 text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
            >
              <Shield size={14} className="text-blue-400" />
              <span>Officer (IESCO)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-600/30 hover:border-emerald-500/50 border border-slate-700 text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Standard Form */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.gov.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Password</label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-950"
            >
              <LogIn size={15} />
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-800 text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-emerald-400 font-semibold hover:underline inline-flex items-center gap-0.5">
              <span>Register as Citizen</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
