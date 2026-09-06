import { useState, useEffect } from 'react'
import {
  User, Lock, Shield, Eye, EyeOff, CheckCircle2,
  AlertCircle, Globe, Bell, Sliders, Save, Sparkles
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { changePassword, updateProfile } from '../services/api'

export default function SettingsPage() {
  const { currentUser, setCurrentUser, role } = useAuth()

  // Tab management
  const [activeTab, setActiveTab] = useState('account') // 'account' | 'security' | 'preferences' | 'accessibility'

  // Account state
  const [fullName, setFullName] = useState(currentUser?.full_name || '')
  const [phone, setPhone] = useState(currentUser?.phone || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwError, setPwError] = useState('')

  // Preferences state
  const [language, setLanguage] = useState(currentUser?.preferences?.language || 'en')
  const [civicAlerts, setCivicAlerts] = useState(currentUser?.preferences?.civic_alerts ?? true)
  const [statusNotifications, setStatusNotifications] = useState(currentUser?.preferences?.status_notifications ?? true)
  const [prefSaving, setPrefSaving] = useState(false)
  const [prefSuccess, setPrefSuccess] = useState('')
  const [prefError, setPrefError] = useState('')

  // Accessibility state
  const [reducedMotion, setReducedMotion] = useState(
    currentUser?.preferences?.reduced_motion ??
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  )
  const [highContrast, setHighContrast] = useState(currentUser?.preferences?.high_contrast ?? false)
  const [accessSaving, setAccessSaving] = useState(false)
  const [accessSuccess, setAccessSuccess] = useState('')

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || '')
      setPhone(currentUser.phone || '')
      if (currentUser.preferences) {
        setLanguage(currentUser.preferences.language || 'en')
        setCivicAlerts(currentUser.preferences.civic_alerts ?? true)
        setStatusNotifications(currentUser.preferences.status_notifications ?? true)
        if (currentUser.preferences.reduced_motion !== undefined) {
          setReducedMotion(currentUser.preferences.reduced_motion)
        }
        if (currentUser.preferences.high_contrast !== undefined) {
          setHighContrast(currentUser.preferences.high_contrast)
        }
      }
    }
  }, [currentUser])

  // Apply reduced motion to DOM root
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion')
      document.documentElement.setAttribute('data-reduced-motion', 'true')
    } else {
      document.documentElement.classList.remove('reduced-motion')
      document.documentElement.removeAttribute('data-reduced-motion')
    }
  }, [reducedMotion])

  async function handleProfileSubmit(e) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileSuccess('')
    setProfileError('')

    try {
      const res = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim()
      })
      if (res.user) {
        setCurrentUser(res.user)
      }
      setProfileSuccess('Account details saved successfully.')
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPwSaving(true)
    setPwSuccess('')
    setPwError('')

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long.')
      setPwSaving(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match. Please re-enter.')
      setPwSaving(false)
      return
    }

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
      setPwSuccess('Your password has been changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwError(err.message || 'Failed to update password. Please check your current password.')
    } finally {
      setPwSaving(false)
    }
  }

  async function handlePreferencesSubmit(e) {
    e.preventDefault()
    setPrefSaving(true)
    setPrefSuccess('')
    setPrefError('')

    try {
      const currentPrefs = currentUser?.preferences || {}
      const updatedPrefs = {
        ...currentPrefs,
        language,
        civic_alerts: civicAlerts,
        status_notifications: statusNotifications
      }
      const res = await updateProfile({ preferences: updatedPrefs })
      if (res.user) {
        setCurrentUser(res.user)
      }
      setPrefSuccess('Platform preferences updated successfully.')
    } catch (err) {
      setPrefError(err.message || 'Failed to save preferences.')
    } finally {
      setPrefSaving(false)
    }
  }

  async function handleAccessibilitySubmit(e) {
    e.preventDefault()
    setAccessSaving(true)
    setAccessSuccess('')

    try {
      const currentPrefs = currentUser?.preferences || {}
      const updatedPrefs = {
        ...currentPrefs,
        reduced_motion: reducedMotion,
        high_contrast: highContrast
      }
      const res = await updateProfile({ preferences: updatedPrefs })
      if (res.user) {
        setCurrentUser(res.user)
      }
      setAccessSuccess('Accessibility settings updated successfully.')
    } catch (err) {
      setAccessSuccess('Accessibility preferences applied.')
    } finally {
      setAccessSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0c1824] tracking-tight flex items-center gap-2 font-display">
          <span>Portal Settings & Preferences</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#627282] mt-1 font-medium">
          Manage your account profile, credentials, notifications, and accessibility controls
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-[#0c1824]/8 overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer font-display ${
            activeTab === 'account'
              ? 'border-emerald-700 text-emerald-900 bg-emerald-50/70 rounded-t-xl'
              : 'border-transparent text-[#627282] hover:text-[#0c1824]'
          }`}
        >
          <User size={15} />
          <span>Account Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer font-display ${
            activeTab === 'security'
              ? 'border-emerald-700 text-emerald-900 bg-emerald-50/70 rounded-t-xl'
              : 'border-transparent text-[#627282] hover:text-[#0c1824]'
          }`}
        >
          <Lock size={15} />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer font-display ${
            activeTab === 'preferences'
              ? 'border-emerald-700 text-emerald-900 bg-emerald-50/70 rounded-t-xl'
              : 'border-transparent text-[#627282] hover:text-[#0c1824]'
          }`}
        >
          <Bell size={15} />
          <span>Alerts & Language</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('accessibility')}
          className={`py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer font-display ${
            activeTab === 'accessibility'
              ? 'border-emerald-700 text-emerald-900 bg-emerald-50/70 rounded-t-xl'
              : 'border-transparent text-[#627282] hover:text-[#0c1824]'
          }`}
        >
          <Sliders size={15} />
          <span>Accessibility</span>
        </button>
      </div>

      {/* TAB CONTENT: 1. ACCOUNT */}
      {activeTab === 'account' && (
        <div className="bg-white rounded-3xl border border-[#0c1824]/8 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#0c1824]/6">
            <div>
              <h2 className="text-base font-bold text-[#0c1824] font-display">User Identification</h2>
              <p className="text-xs text-[#627282] mt-0.5">Your official civic profile and role privileges</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-mono">
                <Shield size={12} />
                <span className="uppercase">{role}</span>
              </span>
              {currentUser?.department_id && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#faf8f5] text-[#3e4c59] border border-[#0c1824]/8">
                  {currentUser.department_id}
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl">
            {profileSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#0c1824]">Official Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/10 text-[#0c1824] text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#0c1824]">Email Address (Identity Bound)</label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs sm:text-sm cursor-not-allowed"
              />
              <p className="text-[11px] text-[#627282]">Identity-bound email address can only be reallocated by platform administrators.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#0c1824]">Contact Telephone / Mobile</label>
              <input
                type="text"
                placeholder="+92 3XX XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/10 text-[#0c1824] text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="btn-primary py-2.5 px-5 text-xs sm:text-sm rounded-xl font-bold mt-2"
            >
              <Save size={14} />
              <span>{profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: 2. SECURITY & PASSWORD */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl border border-[#0c1824]/8 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-[#0c1824]/6">
            <h2 className="text-base font-bold text-[#0c1824] font-display">Change Account Password</h2>
            <p className="text-xs text-[#627282] mt-0.5">
              Your password is encrypted using salted bcrypt rounds. Never share your password with anyone.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
            {pwSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}
            {pwError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#0c1824]">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/10 text-[#0c1824] text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#627282] hover:text-[#0c1824] cursor-pointer"
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#0c1824]">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/10 text-[#0c1824] text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#627282] hover:text-[#0c1824] cursor-pointer"
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#0c1824]">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/10 text-[#0c1824] text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#627282] hover:text-[#0c1824] cursor-pointer"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pwSaving}
              className="btn-primary py-2.5 px-5 text-xs sm:text-sm rounded-xl font-bold mt-2"
            >
              <Lock size={14} />
              <span>{pwSaving ? 'Verifying & Updating...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: 3. PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="bg-white rounded-3xl border border-[#0c1824]/8 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-[#0c1824]/6">
            <h2 className="text-base font-bold text-[#0c1824] font-display">Communication & Notification Preferences</h2>
            <p className="text-xs text-[#627282] mt-0.5">Control operational alerts and language localization</p>
          </div>

          <form onSubmit={handlePreferencesSubmit} className="space-y-5 max-w-xl">
            {prefSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                <span>{prefSuccess}</span>
              </div>
            )}
            {prefError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{prefError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#0c1824]">Preferred Platform Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf8f5] border border-[#0c1824]/10 text-[#0c1824] text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none transition-all cursor-pointer"
              >
                <option value="en">English (Official ICT Administration)</option>
                <option value="ur">اردو (Urdu Localization)</option>
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-4 rounded-2xl border border-[#0c1824]/8 bg-[#faf8f5]">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-[#0c1824] font-display">Critical Civic Alerts</p>
                  <p className="text-[11px] text-[#627282]">Receive high-priority emergency notifications and hazard escalations</p>
                </div>
                <input
                  type="checkbox"
                  checked={civicAlerts}
                  onChange={(e) => setCivicAlerts(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border border-[#0c1824]/8 bg-[#faf8f5]">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-[#0c1824] font-display">Case Dossier Status Milestones</p>
                  <p className="text-[11px] text-[#627282]">Receive milestone updates whenever a department verifies or resolves your incidents</p>
                </div>
                <input
                  type="checkbox"
                  checked={statusNotifications}
                  onChange={(e) => setStatusNotifications(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={prefSaving}
              className="btn-primary py-2.5 px-5 text-xs sm:text-sm rounded-xl font-bold mt-2"
            >
              <Save size={14} />
              <span>{prefSaving ? 'Saving Preferences...' : 'Save Preferences'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: 4. ACCESSIBILITY */}
      {activeTab === 'accessibility' && (
        <div className="bg-white rounded-3xl border border-[#0c1824]/8 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-[#0c1824]/6">
            <h2 className="text-base font-bold text-[#0c1824] font-display">Accessibility & Motion Controls</h2>
            <p className="text-xs text-[#627282] mt-0.5">Customise sensory comfort, animation dynamics, and contrast modes</p>
          </div>

          <form onSubmit={handleAccessibilitySubmit} className="space-y-5 max-w-xl">
            {accessSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                <span>{accessSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-2xl border border-[#0c1824]/8 bg-[#faf8f5]">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-[#0c1824] font-display">Reduced Motion Mode</p>
                  <p className="text-[11px] text-[#627282]">
                    Disables 3D parallax tilting, orbital floating animations, and heavy spring physics for vestibular comfort.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border border-[#0c1824]/8 bg-[#faf8f5]">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-[#0c1824] font-display">High Contrast Text Accents</p>
                  <p className="text-[11px] text-[#627282]">
                    Enhances borders and typography contrast across data tables and telemetry panels.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={accessSaving}
              className="btn-primary py-2.5 px-5 text-xs sm:text-sm rounded-xl font-bold mt-2"
            >
              <Save size={14} />
              <span>{accessSaving ? 'Applying Settings...' : 'Save Accessibility Settings'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
