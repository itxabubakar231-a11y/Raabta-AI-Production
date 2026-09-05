import { useState, useEffect, useRef } from 'react'
import { Bell, Check, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function NotificationBell() {
  const { currentUser, token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!token) return
    async function loadNotifications() {
      try {
        const res = await api.getNotifications()
        if (res && res.notifications) {
          setNotifications(res.notifications)
          setUnreadCount(res.unread_count || 0)
        }
      } catch (err) {
        console.warn('Failed to load notifications:', err)
      }
    }
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [token])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleMarkRead(id, e) {
    e.stopPropagation()
    try {
      await api.markNotificationRead(id)
      setNotifications(prev => prev.map(n => n.id === id || n._id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error(err)
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error(err)
    }
  }

  if (!currentUser) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3.5 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.is_read
                return (
                  <div
                    key={n.id || n._id}
                    className={`p-3 text-xs transition-colors hover:bg-slate-50/80 ${isUnread ? 'bg-emerald-50/30' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                          <h5 className="font-bold text-slate-900">{n.title}</h5>
                        </div>
                        <p className="text-slate-600 mt-1 leading-relaxed text-[11px] font-medium">{n.message}</p>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                          <span>{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</span>
                          {n.report_id && (
                            <Link
                              to={`/track?tracking_id=${n.report_id}`}
                              onClick={() => setOpen(false)}
                              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold"
                            >
                              <span>View Incident</span>
                              <ExternalLink size={10} />
                            </Link>
                          )}
                        </div>
                      </div>

                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkRead(n.id || n._id, e)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                          title="Mark read"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
