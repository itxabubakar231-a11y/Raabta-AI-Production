import { useState } from 'react'
import { Sparkles, RefreshCw, UserCheck, Shield, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import * as api from '../services/api'

export default function DemoBar() {
  const { currentUser, role, quickSwitchDemo } = useAuth()
  const [seeding, setSeeding] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSwitch(targetRole) {
    try {
      await quickSwitchDemo(targetRole)
      setMessage(`Switched to ${targetRole.toUpperCase()}`)
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSeed(reset = false) {
    setSeeding(true)
    setMessage('Seeding realistic civic dataset...')
    try {
      if (reset) {
        await api.resetDemo()
      } else {
        await api.seedDemo()
      }
      setMessage('Demo data refreshed successfully!')
      setTimeout(() => {
        window.location.reload()
      }, 800)
    } catch (err) {
      setMessage(`Seeding failed: ${err.message}`)
      setTimeout(() => setMessage(''), 4000)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="bg-slate-950/90 border-b border-emerald-500/20 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-30 shadow-md backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
          <Sparkles size={13} />
          <span>HACKATHON DEMO MODE</span>
        </span>
        {currentUser ? (
          <span className="text-slate-300 hidden sm:inline">
            Logged in: <strong className="text-white">{currentUser.full_name || currentUser.email}</strong> (
            <span className="text-emerald-400 font-semibold uppercase">{role}</span>)
          </span>
        ) : (
          <span className="text-slate-400 hidden sm:inline">Select a demo persona to test workflows:</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-slate-400 text-[11px] mr-1 hidden md:inline">Quick Switch:</span>

        <button
          type="button"
          onClick={() => handleSwitch('citizen')}
          className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
            role === 'citizen' && currentUser
              ? 'bg-emerald-600 text-white font-bold shadow-sm'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
          title="Switch to Citizen Persona"
        >
          <UserCheck size={12} />
          <span>Citizen</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitch('officer')}
          className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
            role === 'officer' && currentUser
              ? 'bg-emerald-600 text-white font-bold shadow-sm'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
          title="Switch to Duty Officer (IESCO)"
        >
          <Shield size={12} />
          <span>Officer (IESCO)</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitch('admin')}
          className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
            role === 'admin' && currentUser
              ? 'bg-emerald-600 text-white font-bold shadow-sm'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
          title="Switch to Command Administrator"
        >
          <Sparkles size={12} />
          <span>Admin</span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

        <button
          type="button"
          disabled={seeding}
          onClick={() => handleSeed(true)}
          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
          title="Reset database to realistic Pakistani civic scenarios"
        >
          <RefreshCw size={12} className={seeding ? 'animate-spin text-emerald-400' : ''} />
          <span>{seeding ? 'Seeding...' : 'Reset Demo Data'}</span>
        </button>
      </div>

      {message && (
        <div className="w-full sm:w-auto text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
          <CheckCircle size={12} />
          <span>{message}</span>
        </div>
      )}
    </div>
  )
}
