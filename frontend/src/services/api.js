const rawApiUrl = import.meta.env.VITE_API_URL || "/api"
const trimmedApiUrl = rawApiUrl.replace(/\/+$/, "")
const API_BASE = trimmedApiUrl === "" || trimmedApiUrl === "/api"
  ? "/api"
  : (trimmedApiUrl.endsWith("/api") ? trimmedApiUrl : `${trimmedApiUrl}/api`)

function getAuthHeaders() {
  const token = localStorage.getItem('raabta_token')
  return token ? { "Authorization": `Bearer ${token}` } : {}
}

export async function checkHealth() {
  return requestJson("/health", {
    method: "GET"
  })
}

async function requestJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  }

  let response
  try {
    response = await fetch(url, {
      ...options,
      headers
    })
  } catch (err) {
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      if (API_BASE.includes("127.0.0.1") || API_BASE.includes("localhost")) {
        throw new Error(
          `Cannot reach backend at ${API_BASE}. In production on Vercel, you must configure VITE_API_URL in Vercel Project Settings to your deployed backend HTTPS URL.`
        )
      }
      throw new Error(
        `Failed to connect to backend at ${API_BASE}. Please verify that your backend server is awake and accepting requests.`
      )
    }
    throw err
  }

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorObj = new Error(
      result.error ||
      result.message ||
      `Request failed ${response.status}`
    )
    errorObj.status = response.status
    errorObj.data = result
    throw errorObj
  }

  return result
}

// =================================
// AUTHENTICATION APIs
// =================================

export async function signup(userData) {
  return requestJson("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  })
}

export async function login(credentials) {
  return requestJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  })
}

export async function getMe() {
  return requestJson("/auth/me", {
    method: "GET"
  })
}

export async function logout() {
  return requestJson("/auth/logout", {
    method: "POST"
  })
}

export async function forgotPassword(email) {
  return requestJson("/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
}

export async function verifyResetToken(token) {
  return requestJson(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`, {
    method: "GET"
  })
}

export async function resetPassword({ token, password, confirm_password }) {
  return requestJson("/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password, confirm_password })
  })
}

export async function changePassword({ current_password, new_password, confirm_password }) {
  return requestJson("/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password, new_password, confirm_password })
  })
}

export async function updateProfile(profileData) {
  return requestJson("/auth/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData)
  })
}

// =================================
// CIVIC REPORTS APIs
// =================================

export async function getReports(params = {}) {
  const query = new URLSearchParams()
  if (params.status && params.status !== 'all') query.append('status', params.status)
  if (params.category && params.category !== 'all') query.append('category', params.category)
  const dept = params.department_id || params.department
  if (dept && dept !== 'all') query.append('department_id', dept)
  if (params.min_risk) query.append('min_risk', params.min_risk)
  if (params.priority && params.priority !== 'all') query.append('priority', params.priority)
  if (params.area && params.area !== 'all') query.append('area', params.area)
  if (params.repeated) query.append('repeated', params.repeated)
  if (params.sort_by) query.append('sort_by', params.sort_by)
  if (params.search) query.append('search', params.search)
  if (params.page) query.append('page', params.page)
  if (params.limit) query.append('limit', params.limit)

  const qs = query.toString() ? `?${query.toString()}` : ''
  return requestJson(`/reports${qs}`, { method: "GET" })
}

export async function getMyReports() {
  return requestJson("/reports/my", { method: "GET" })
}

export async function getReportById(reportId, params = {}) {
  const cleanId = encodeURIComponent(String(reportId || '').trim())
  const query = new URLSearchParams()
  if (params.gov) query.append('gov', '1')
  const qs = query.toString() ? `?${query.toString()}` : ''
  return requestJson(`/reports/${cleanId}${qs}`, { method: "GET" })
}

export async function analyzeCivicReport(data) {
  if (data.image instanceof File || data.audio instanceof Blob || data.audio instanceof File) {
    const formData = new FormData()
    if (data.image) formData.append("image", data.image)
    if (data.audio) formData.append("audio", data.audio)
    if (data.text || data.description) formData.append("description", data.text || data.description)
    if (data.latitude) formData.append("latitude", data.latitude)
    if (data.longitude) formData.append("longitude", data.longitude)
    if (data.address) formData.append("address", data.address)
    return requestJson("/reports/analyze", {
      method: "POST",
      body: formData
    })
  }
  return requestJson("/reports/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
}

export async function createCivicReport(reportData) {
  return requestJson("/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reportData)
  })
}

export async function submitMissingInfo(reportId, answers) {
  return requestJson(`/reports/${reportId}/missing-info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers })
  })
}

export async function verifyResolution(reportId, { action, feedback, rating }) {
  return requestJson(`/reports/${reportId}/verify-resolution`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, feedback, rating })
  })
}

export function getReportPdfUrl(reportId) {
  return `${API_BASE}/reports/${reportId}/pdf`
}

export async function calculatePriority(data) {
  return requestJson("/reports/calculate-priority", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
}

export async function respondToInfoRequest(reportId, responseText) {
  return requestJson(`/reports/${reportId}/respond-info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ response: responseText })
  })
}

// =================================
// DEPARTMENT OPERATIONS APIs
// =================================

export async function getDepartments() {
  return requestJson("/departments", { method: "GET" })
}

export async function getOfficers(params = {}) {
  const query = new URLSearchParams()
  if (params.department_id) query.append('department_id', params.department_id)
  const qs = query.toString() ? `?${query.toString()}` : ''
  return requestJson(`/departments/officers${qs}`, { method: "GET" })
}

export async function getOperationsQueue(params = {}) {
  const query = new URLSearchParams()
  if (params.department_id) query.append('department_id', params.department_id)
  if (params.status && params.status !== 'all') query.append('status', params.status)
  if (params.assigned_to) query.append('assigned_to', params.assigned_to)
  if (params.min_risk) query.append('min_risk', params.min_risk)

  const qs = query.toString() ? `?${query.toString()}` : ''
  return requestJson(`/departments/queue${qs}`, { method: "GET" })
}

export async function updateReportStatus(reportId, { status, notes }) {
  return requestJson(`/departments/reports/${reportId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, notes })
  })
}

export async function assignOfficer(reportId, { officer_id, officer_name, department_id, department_name, reason, notes }) {
  return requestJson(`/departments/reports/${reportId}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ officer_id, officer_name, department_id, department_name, reason, notes })
  })
}

export async function resolveReportWithProof(reportId, { resolution_notes, resolution_image_url, resolution_image_base64 }) {
  return requestJson(`/departments/reports/${reportId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolution_notes, resolution_image_url, resolution_image_base64 })
  })
}

export async function overrideReport(reportId, { department_id, severity, priority, reason }) {
  return requestJson(`/departments/reports/${reportId}/override`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ department_id, severity, priority, reason })
  })
}

export async function requestMoreInfo(reportId, { note }) {
  return requestJson(`/departments/reports/${reportId}/request-info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note })
  })
}

export async function addInternalNote(reportId, { note, is_private = true }) {
  return requestJson(`/departments/reports/${reportId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note, is_private })
  })
}

export async function getInternalNotes(reportId) {
  return requestJson(`/departments/reports/${reportId}/notes`, { method: "GET" })
}


// =================================
// CLUSTERS APIs
// =================================

export async function getClusters(params = {}) {
  const query = params.status ? `?status=${params.status}` : ''
  return requestJson(`/clusters${query}`, { method: "GET" })
}

export async function getClusterById(clusterId) {
  return requestJson(`/clusters/${clusterId}`, { method: "GET" })
}

// =================================
// INSIGHTS & HOTSPOTS APIs
// =================================

export async function getHotspots() {
  return requestJson("/insights/hotspots", { method: "GET" })
}

export async function getTrends(params = {}) {
  const query = new URLSearchParams()
  if (params.department_id) query.append("department_id", params.department_id)
  if (params.department) query.append("department", params.department)
  const qs = query.toString() ? `?${query.toString()}` : ''
  return requestJson(`/insights/trends${qs}`, { method: "GET" })
}

// =================================
// NOTIFICATIONS APIs
// =================================

export async function getNotifications() {
  return requestJson("/notifications", { method: "GET" })
}

export async function markNotificationRead(notificationId) {
  return requestJson(`/notifications/${notificationId}/read`, { method: "POST" })
}

export async function markAllNotificationsRead() {
  return requestJson("/notifications/read-all", { method: "POST" })
}

// =================================
// SYSTEM ADMINISTRATION APIs
// =================================

export async function getAdminOverview() {
  return requestJson("/admin/overview", { method: "GET" })
}

export async function getAdminUsers() {
  return requestJson("/admin/users", { method: "GET" })
}

export async function updateUserRole(userId, { role, department_id }) {
  return requestJson(`/admin/users/${userId}/role`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, department_id })
  })
}

export async function getAuditLogs() {
  return requestJson("/admin/audit-logs", { method: "GET" })
}

// =================================
// DEMO SEEDING APIs
// =================================

export async function seedDemo() {
  return requestJson("/demo/seed", { method: "POST" })
}

export async function resetDemo() {
  return requestJson("/demo/reset", { method: "POST" })
}

export async function getDemoAccounts() {
  return requestJson("/demo/accounts", { method: "GET" })
}

// =================================
// LEGACY COMPATIBILITY METHODS
// =================================

export async function submitImageComplaint({
  image,
  latitude,
  longitude,
  location
}) {
  const formData = new FormData()
  if (image) formData.append("image", image)
  if (latitude) formData.append("latitude", latitude)
  if (longitude) formData.append("longitude", longitude)
  if (location) formData.append("location", location)

  return requestJson("/report", {
    method: "POST",
    body: formData
  })
}

export async function submitVoiceComplaint(audioFile, location) {
  const formData = new FormData()
  formData.append("audio", audioFile)
  if (location) formData.append("location", location)

  return requestJson("/voice-report", {
    method: "POST",
    body: formData
  })
}

export async function submitTextComplaint({
  text,
  latitude,
  longitude,
  location
}) {
  const formData = new FormData()
  formData.append("text", text)
  if (latitude) formData.append("latitude", latitude)
  if (longitude) formData.append("longitude", longitude)
  if (location) formData.append("location", location)

  return requestJson("/text-report", {
    method: "POST",
    body: formData
  })
}

export async function submitReport(data) {
  return submitImageComplaint(data)
}