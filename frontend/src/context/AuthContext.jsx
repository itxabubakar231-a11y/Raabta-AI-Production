import { createContext, useContext, useState, useEffect } from 'react'
import * as api from '../services/api'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe()
          if (res && res.user) {
            setCurrentUser(res.user)
            localStorage.setItem('raabta_user', JSON.stringify(res.user))
          }
        } catch (err) {
          console.warn('[Auth] Token invalid or expired:', err)
          logout()
        }
      }
      setLoading(false)
    }
    loadUser()
  }, [token])

  async function login(email, password) {
    const res = await api.login({ email, password })
    if (res && res.token) {
      setToken(res.token)
      setCurrentUser(res.user)
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
      localStorage.setItem('raabta_token', res.token)
      localStorage.setItem('raabta_user', JSON.stringify(res.user))
      return res.user
    }
    throw new Error(res?.error || 'Registration failed')
  }

  function logout() {
    setToken(null)
    setCurrentUser(null)
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
        role: currentUser?.role || null,
        isAuthenticated: Boolean(currentUser && token),
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
