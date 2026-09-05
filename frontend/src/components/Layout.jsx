import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  Home, FileText, Activity, Landmark, Menu, X, HelpCircle,
  TrendingUp, Shield, LogIn, LogOut, User
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import NotificationBell from './NotificationBell'

export default function Layout() {
  const { currentUser, role, logout } = useAuth()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  const navItems = [
    { label: 'Overview', path: '/app', icon: Home },
    { label: 'File Incident', path: '/submit', icon: FileText },
    { label: 'Case Dossiers', path: '/track', icon: Activity },
    { label: 'Command Center', path: '/department', icon: Landmark },
    { label: 'Civic Hotspots', path: '/insights', icon: TrendingUp },
    ...(role === 'admin' ? [{ label: 'Administration', path: '/admin', icon: Shield }] : []),
    { label: 'How It Works', path: '/how-it-works', icon: HelpCircle },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0f19]">
      <div className="app-shell flex-1">
        {/* SIDEBAR */}
        <aside className={`sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}>
          <div className="brand-block" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
            <Logo size="md" to="/" />
            <div className="space-y-0.5 mt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-tight">
                Civic Intelligence Platform
              </p>
              <p className="text-[9px] text-emerald-400 font-semibold leading-tight">
                Powered by Google Gemma
              </p>
            </div>
          </div>

          <button
            className="mobile-nav-close"
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>

          <nav className="sidebar-nav" aria-label="Primary">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/' || item.path === '/app'}
                  className={({ isActive }) =>
                    `nav-link${isActive ? ' active' : ''}`
                  }
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* Sidebar User Footer */}
          <div className="p-4 border-t border-slate-900 mt-auto text-xs">
            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                    {currentUser.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-white truncate text-[11px]">{currentUser.full_name}</p>
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase">{role}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogOut size={12} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
              >
                <LogIn size={13} />
                <span>Portal Sign In</span>
              </Link>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="main-panel">
          <header className="topbar">
            <div className="topbar-title-block">
              <button
                className="mobile-nav-toggle"
                type="button"
                onClick={() => setIsMobileNavOpen((current) => !current)}
                aria-label="Toggle navigation"
              >
                <Menu size={20} />
              </button>

              <div>
                <h2>
                  {role === 'officer' ? 'Department Operations Center' :
                   role === 'admin' ? 'Strategic Intelligence & Governance' :
                   'Citizen Civic Portal'}
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Live In-App Notifications */}
              <NotificationBell />

              <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span>Gemma AI Active</span>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-semibold text-slate-300">
                <span>🇵🇰</span>
                <span>Pakistan</span>
              </div>
            </div>
          </header>

          <main className="content-area">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}