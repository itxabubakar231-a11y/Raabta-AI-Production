import { useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, AlertOctagon, FileSpreadsheet, MapPin,
  Layers, BarChart3, Building2, Timer, Users, History,
  Settings, Menu, X, LogOut, ShieldCheck, ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import NotificationBell from './NotificationBell'

export default function GovernmentLayout() {
  const { currentUser, role, logout } = useAuth()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const navigate = useNavigate()

  const govNavItems = [
    { label: 'Operations Dashboard', path: '/gov', icon: LayoutDashboard, end: true },
    { label: 'Reports Needing Attention', path: '/gov/queue', icon: AlertOctagon, badge: 'Priority' },
    { label: 'All Reports', path: '/gov/reports', icon: FileSpreadsheet },
    { label: 'Problem Map', path: '/gov/map', icon: MapPin },
    { label: 'Repeated Problems', path: '/gov/repeated', icon: Layers },
    { label: 'Area Insights', path: '/gov/insights', icon: BarChart3 },
    { label: 'Departments & Officers', path: '/gov/departments', icon: Building2 },
    { label: 'Response Times', path: '/gov/response-times', icon: Timer },
    ...(role === 'admin' ? [
      { label: 'Users & Access', path: '/gov/users', icon: Users },
      { label: 'Activity Log', path: '/gov/activity', icon: History },
    ] : []),
    { label: 'Settings', path: '/gov/settings', icon: Settings },
  ]

  const deptDisplay = currentUser?.department_id || 'ICT Administration'

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f6] text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* Official Government Top Bar */}
      <div className="bg-slate-900 text-white text-[11px] font-medium py-1 px-4 text-center border-b border-slate-800 hidden sm:flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Government of Pakistan • Civic Operations Command Portal</span>
          </span>
          <div className="flex items-center gap-3 text-slate-300">
            <span>Jurisdiction: <strong>Islamabad Capital Territory</strong></span>
            <span>•</span>
            <span>Role: <strong className="uppercase text-emerald-400">{role}</strong></span>
          </div>
        </div>
      </div>

      <div className="app-shell flex-1">
        {/* SIDEBAR */}
        <aside className={`sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}>
          <div className="brand-block" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
            <Logo size="md" to="/gov" theme="light" />
            <div className="space-y-0.5 mt-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 leading-tight flex items-center gap-1">
                <span>Operations Center</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 text-[9px] font-extrabold uppercase">
                  {role}
                </span>
              </p>
              <p className="text-[10px] text-emerald-700 font-semibold leading-tight">
                {deptDisplay}
              </p>
            </div>
          </div>

          <button
            className="mobile-nav-close"
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>

          <nav className="sidebar-nav overflow-y-auto pr-1" aria-label="Government Operations Navigation">
            {govNavItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `nav-link${isActive ? ' active' : ''}`
                  }
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <Icon size={17} />
                  <span className="flex-1 text-xs">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* User Account Card Footer */}
          <div className="p-3.5 border-t border-slate-200/80 mt-auto text-xs bg-slate-50/70 rounded-2xl">
            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {currentUser.full_name?.charAt(0) || 'O'}
                  </div>
                  <div className="truncate flex-1">
                    <p className="font-bold text-slate-900 truncate text-[11px] leading-tight">
                      {currentUser.full_name}
                    </p>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {currentUser.email}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <Link
                    to="/gov/settings"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-medium flex items-center justify-center gap-1 border border-slate-200 shadow-2xs transition-colors"
                  >
                    <Settings size={12} />
                    <span>Settings</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      navigate('/login')
                    }}
                    className="py-1.5 px-2 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-[11px] font-medium flex items-center justify-center gap-1 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    <LogOut size={12} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        {/* MAIN PANEL */}
        <div className="main-panel">
          <header className="topbar">
            <div className="topbar-title-block">
              <button
                className="mobile-nav-toggle"
                type="button"
                onClick={() => setIsMobileNavOpen((curr) => !curr)}
                aria-label="Toggle navigation"
              >
                <Menu size={20} />
              </button>

              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Operations Command Portal
                </h2>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Priority dispatch queue, multi-hazard clustering, and resolution verification.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />

              <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                <span>{deptDisplay}</span>
              </div>

              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
                <span>🇵🇰</span>
                <span className="hidden sm:inline text-[11px]">Islamabad</span>
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
