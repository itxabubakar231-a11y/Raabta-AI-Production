import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  Home, FileText, Activity, Landmark, Menu, X, HelpCircle,
  TrendingUp, Shield, LogIn, LogOut, User, Settings
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
    ...((role === 'officer' || role === 'admin') ? [{ label: 'Command Center', path: '/department', icon: Landmark }] : []),
    { label: 'Civic Hotspots', path: '/insights', icon: TrendingUp },
    ...(role === 'admin' ? [{ label: 'Administration', path: '/admin', icon: Shield }] : []),
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'How It Works', path: '/how-it-works', icon: HelpCircle },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f6] text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-900">
      <div className="app-shell flex-1">
        {/* SIDEBAR */}
        <aside className={`sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}>
          <div className="brand-block" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            <Logo size="md" to="/" theme="light" />
            <div className="space-y-0.5 mt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 leading-tight">
                Civic Intelligence Platform
              </p>
              <p className="text-[9px] text-emerald-700 font-bold leading-tight flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Powered by Google Gemma</span>
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
          <div className="p-3.5 border-t border-slate-200/80 mt-auto text-xs bg-slate-50/50 rounded-xl">
            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {currentUser.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="truncate flex-1">
                    <p className="font-bold text-slate-900 truncate text-[11px] leading-tight">
                      {currentUser.full_name}
                    </p>
                    <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wide">
                      {role}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <Link
                    to="/settings"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors border border-slate-200/80 shadow-2xs"
                  >
                    <Settings size={12} />
                    <span>Settings</span>
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors border border-slate-200/80 shadow-2xs cursor-pointer"
                  >
                    <LogOut size={12} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
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

              <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Gemma AI Active</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
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