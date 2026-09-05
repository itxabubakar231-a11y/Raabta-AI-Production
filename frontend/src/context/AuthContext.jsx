import { createContext, useContext, useState, useEffect } from 'react'
import * as api from '../services/api'

export const AUTH_STATES = {
  INITIALIZING: 'INITIALIZING',
  AUTHENTICATED: 'AUTHENTICATED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  AUTH_ERROR: 'AUTH_ERROR'
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('raabta_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('raabta_token') || null)
  const [authState, setAuthState] = useState(() => {
    const savedToken = localStorage.getItem('raabta_token')
    return savedToken ? AUTH_STATES.INITIALIZING : AUTH_STATES.UNAUTHENTICATED
  })
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('raabta_token')))

  useEffect(() => {
    let isCurrent = true

    async function loadUser() {
      const savedToken = localStorage.getItem('raabta_token')
      if (!savedToken) {
        if (isCurrent) {
          setAuthState(AUTH_STATES.UNAUTHENTICATED)
          setCurrentUser(null)
          setLoading(false)
        }
        return
      }

      setAuthState(AUTH_STATES.INITIALIZING)
      try {
        const res = await api.getMe()
        if (!isCurrent) return

        if (res && res.user) {
          setCurrentUser(res.user)
          localStorage.setItem('raabta_user', JSON.stringify(res.user))
          setAuthState(AUTH_STATES.AUTHENTICATED)
        } else {
          // Genuinely missing account
          logout()
          setAuthState(AUTH_STATES.UNAUTHENTICATED)
        }
      } catch (err) {
        if (!isCurrent) return
        const status = err.status || (err.data && err.data.status)
        const isAuthExpired = status === 401 || status === 403 || String(err.message || '').includes('401')

        if (isAuthExpired) {
          console.warn('[Auth] Server rejected token as expired or invalid:', err)
          logout()
          setAuthState(AUTH_STATES.UNAUTHENTICATED)
        } else {
          // Network issue, cold-start, or offline: preserve existing user from localStorage!
          console.warn('[Auth] Network or server hiccup validating session, retaining local state:', err)
          const stored = localStorage.getItem('raabta_user')
          if (stored) {
            try {
              setCurrentUser(JSON.parse(stored))
              setAuthState(AUTH_STATES.AUTHENTICATED)
            } catch {
              setAuthState(AUTH_STATES.AUTH_ERROR)
            }
          } else {
            setAuthState(AUTH_STATES.AUTH_ERROR)
          }
        }
      } finally {
        if (isCurrent) {
          setLoading(false)
        }
      }
    }

    loadUser()

    return () => {
      isCurrent = false
    }
  }, [token])

  async function login(email, password) {
    const res = await api.login({ email, password })
    if (res && res.token) {
      setToken(res.token)
      setCurrentUser(res.user)
      setAuthState(AUTH_STATES.AUTHENTICATED)
      localStorage.setItem('raabta_token', res.token)
      localStorage.setItem('raabta_user', JSON.stringify(res.user))
      return res.user
    }
    throw new Error(res?.error || 'Login failed')
  }

  async function signup(data) {
    const res = await api.signup(data)
    if (res && res.token) {
      setToken(res.token)
      setCurrentUser(res.user)
      setAuthState(AUTH_STATES.AUTHENTICATED)
      localStorage.setItem('raabta_token', res.token)
      localStorage.setItem('raabta_user', JSON.stringify(res.user))
      return res.user
    }
    throw new Error(res?.error || 'Registration failed')
  }

  function logout() {
    setToken(null)
    setCurrentUser(null)
    setAuthState(AUTH_STATES.UNAUTHENTICATED)
    localStorage.removeItem('raabta_token')
    localStorage.removeItem('raabta_user')
    api.logout().catch(() => {})
  }

  async function quickSwitchDemo(role) {
    const roleEmailMap = {
      citizen: 'citizen@raabta.gov.pk',
      officer: 'officer@raabta.gov.pk',
      admin: 'admin@raabta.gov.pk'
    }
    const email = roleEmailMap[role] || 'citizen@raabta.gov.pk'
    return login(email, 'Password123!')
  }

  async function refreshUser() {
    if (!token) return null
    try {
      const res = await api.getMe()
      if (res && res.user) {
        setCurrentUser(res.user)
        localStorage.setItem('raabta_user', JSON.stringify(res.user))
        return res.user
      }
    } catch {
      return null
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        authState,
        role: currentUser?.role || null,
        isAuthenticated: Boolean(currentUser && token && authState === AUTH_STATES.AUTHENTICATED),
        loading,
        login,
        signup,
        logout,
        quickSwitchDemo,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
