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
    throw new Error(
      result.error ||
      result.message ||
      `Request failed ${response.status}`
    )
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

// =================================
// CIVIC REPORTS APIs
// =================================

export async function getReports(params = {}) {
  const query = new URLSearchParams()
  if (params.status && params.status !== 'all') query.append('status', params.status)
  if (params.category && params.category !== 'all') query.append('category', params.category)
  if (params.department_id && params.department_id !== 'all') query.append('department_id', params.department_id)
  if (params.min_risk) query.append('min_risk', params.min_risk)
  if (params.search) query.append('search', params.search)
  if (params.page) query.append('page', params.page)
  if (params.limit) query.append('limit', params.limit)

  const qs = query.toString() ? `?${query.toString()}` : ''
  return requestJson(`/reports${qs}`, { method: "GET" })
}

export async function getMyReports() {
  return requestJson("/reports/my", { method: "GET" })
}

export async function getReportById(reportId) {
  return requestJson(`/reports/${reportId}`, { method: "GET" })
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

// =================================
// DEPARTMENT OPERATIONS APIs
// =================================

export async function getDepartments() {
  return requestJson("/departments", { method: "GET" })
}

export async function getOperationsQueue(params = {}) {
  const query = new URLSearchParams()
  if (params.department_id) query.append('department_id', params.department_id)
  if (params.status && params.status !== 'all') query.append('status', params.status)
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

export async function assignOfficer(reportId, { officer_id, officer_name }) {
  return requestJson(`/departments/reports/${reportId}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ officer_id, officer_name })
  })
}

export async function resolveReportWithProof(reportId, { resolution_notes, resolution_image_url }) {
  return requestJson(`/departments/reports/${reportId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolution_notes, resolution_image_url })
  })
}

export async function addInternalNote(reportId, { note, is_private = true }) {
  return requestJson(`/departments/reports/${reportId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note, is_private })
  })
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

export async function getTrends() {
  return requestJson("/insights/trends", { method: "GET" })
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