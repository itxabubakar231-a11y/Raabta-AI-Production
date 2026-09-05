import { useState } from 'react'
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Home, PlusCircle, FileText, MapPin, Settings,
  HelpCircle, Menu, X, LogOut, Bell, ShieldCheck, ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import NotificationBell from './NotificationBell'

export default function CitizenLayout() {
  const { currentUser, role, logout } = useAuth()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const citizenNavItems = [
    { label: 'Home', path: '/app', icon: Home, end: true },
    { label: 'Report a Problem', path: '/app/report', icon: PlusCircle, isAction: true },
    { label: 'My Reports', path: '/app/reports', icon: FileText },
    { label: 'Problem Map', path: '/app/map', icon: MapPin },
    { label: 'Settings', path: '/app/settings', icon: Settings },
    { label: 'How It Works', path: '/app/how-it-works', icon: HelpCircle },
  ]

  const mobileBottomItems = [
    { label: 'Home', path: '/app', icon: Home, end: true },
    { label: 'My Reports', path: '/app/reports', icon: FileText },
    { label: 'Report', path: '/app/report', icon: PlusCircle, highlight: true },
    { label: 'Map', path: '/app/map', icon: MapPin },
    { label: 'Settings', path: '/app/settings', icon: Settings },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f6] text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* Top Banner (Pakistani Civic Service Identity) */}
      <div className="bg-emerald-900 text-white text-[11px] font-medium py-1 px-4 text-center border-b border-emerald-800/40 hidden sm:flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <span className="flex items-center gap-1.5 text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Government of Pakistan • National Digital Civic Service</span>
          </span>
          <span className="text-emerald-300/80 font-normal">
            Intelligent Citizen Reporting & Resolution Platform
          </span>
        </div>
      </div>

      <div className="app-shell flex-1">
        {/* DESKTOP SIDEBAR */}
        <aside className={`sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}>
          <div className="brand-block" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
            <Logo size="md" to="/app" theme="light" />
            <div className="space-y-0.5 mt-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 leading-tight">
                Citizen Portal
              </p>
              <p className="text-[10px] text-emerald-700 font-semibold leading-tight flex items-center gap-1">
                <span>🇵🇰 Islamabad & Regional Services</span>
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

          {/* Primary Quick CTA */}
          <div className="mb-4">
            <Link
              to="/app/report"
              onClick={() => setIsMobileNavOpen(false)}
              className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <PlusCircle size={16} />
              <span>+ Report a Problem</span>
            </Link>
          </div>

          <nav className="sidebar-nav" aria-label="Citizen Navigation">
            {citizenNavItems.map((item) => {
              const Icon = item.icon
              const isAction = item.isAction
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `nav-link${isActive ? ' active' : ''}${isAction ? ' font-semibold text-emerald-800' : ''}`
                  }
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <Icon size={18} className={isAction ? 'text-emerald-700' : ''} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* User Account Card Footer */}
          <div className="p-3.5 border-t border-slate-200/80 mt-auto text-xs bg-slate-50/70 rounded-2xl">
            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser.full_name?.charAt(0) || 'C'}
                  </div>
                  <div className="truncate flex-1">
                    <p className="font-bold text-slate-900 truncate text-[11px] leading-tight">
                      {currentUser.full_name}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-semibold uppercase">
                      Citizen Account
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <Link
                    to="/app/settings"
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
            ) : (
              <Link
                to="/login"
                className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Citizen Sign In</span>
              </Link>
            )}
          </div>
        </aside>

        {/* MAIN PANEL */}
        <div className="main-panel pb-16 md:pb-6">
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
                  Citizen Civic Services
                </h2>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Report issues, track progress, and verify resolutions in your area.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <NotificationBell />

              <Link
                to="/app/report"
                className="hidden sm:inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition-colors"
              >
                <PlusCircle size={14} />
                <span>Report Problem</span>
              </Link>

              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
                <span>🇵🇰</span>
                <span className="hidden sm:inline text-[11px]">Pakistan</span>
              </div>
            </div>
          </header>

          <main className="content-area">
            <Outlet />
          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 py-1.5 px-3 flex items-center justify-around shadow-lg"
        aria-label="Mobile Bottom Navigation"
      >
        {mobileBottomItems.map((item) => {
          const Icon = item.icon
          const isActive = item.end
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path)

          if (item.highlight) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="h-12 w-12 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-md border-2 border-white">
                  <Icon size={24} />
                </div>
                <span className="text-[10px] font-bold text-emerald-800 mt-0.5">
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
                isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
