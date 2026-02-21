/**
 * API Client
 * HTTP client for backend API calls
 */

import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Debug: Log API URL on load
console.log('API Client initialized with URL:', API_URL)

/**
 * Cached auth token - updated by onAuthStateChange listener
 * This avoids calling getSession() which can deadlock during auth events
 */
let cachedToken = null

// Listen for auth changes and cache the token
supabase.auth.onAuthStateChange((event, session) => {
  cachedToken = session?.access_token || null
  console.log('API: Token updated from auth event:', event, cachedToken ? 'token set' : 'no token')
})

/**
 * Get current auth token
 * Uses cached token first, falls back to getSession()
 */
async function getAuthToken() {
  if (cachedToken) {
    return cachedToken
  }
  
  // Fallback: try getSession (may not work during onAuthStateChange)
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      cachedToken = session.access_token
      return cachedToken
    }
  } catch (err) {
    console.warn('getSession failed:', err.message)
  }
  
  console.warn('No auth token available')
  return null
}

/**
 * Make an authenticated API request
 */
async function request(endpoint, options = {}) {
  const token = await getAuthToken()
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    }
  }
  
  const url = `${API_URL}${endpoint}`
  console.log(`API Request: ${options.method || 'GET'} ${url}`)
  
  try {
    const response = await fetch(url, config)
    
    console.log(`API Response: ${response.status} ${response.statusText}`)
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        console.error(`API Error (non-JSON): ${response.status}`)
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return null
    }
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('API Error:', data)
      throw new Error(data.message || data.error || 'API request failed')
    }
    
    return data
  } catch (error) {
    console.error(`API Request failed: ${url}`, error.message)
    throw error
  }
}

/**
 * API methods
 */
export const api = {
  // Health check
  health: () => request('/api/health'),
  
  // Profile
  profile: {
    get: () => request('/api/profile'),
    update: (data) => request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    ensure: (data) => request('/api/profile/ensure', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  // Rooms
  rooms: {
    list: () => request('/api/rooms'),
    adminList: () => request('/api/rooms/admin'),
    get: (roomId) => request(`/api/rooms/${roomId}`),
    getWithStats: (roomId) => request(`/api/rooms/${roomId}/stats`),
    create: (data) => request('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (roomId, data) => request(`/api/rooms/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    adminUpdate: (roomId, data) => request(`/api/rooms/${roomId}/admin-update`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    togglePause: (roomId) => request(`/api/rooms/${roomId}/toggle-pause`, {
      method: 'POST'
    }),
    toggleLateUpload: (roomId) => request(`/api/rooms/${roomId}/toggle-late-upload`, {
      method: 'POST'
    }),
    delete: (roomId) => request(`/api/rooms/${roomId}`, {
      method: 'DELETE'
    })
  },
  
  // Attendance
  attendance: {
    list: (options = {}) => {
      const params = new URLSearchParams()
      if (options.fromDate) params.set('fromDate', options.fromDate)
      if (options.toDate) params.set('toDate', options.toDate)
      if (options.limit) params.set('limit', options.limit)
      const query = params.toString()
      return request(`/api/attendance${query ? `?${query}` : ''}`)
    },
    getForRoom: (roomId, userId) => {
      const params = new URLSearchParams()
      if (userId) params.set('userId', userId)
      const query = params.toString()
      return request(`/api/attendance/room/${roomId}${query ? `?${query}` : ''}`)
    },
    getTodayStatus: (roomId) => request(`/api/attendance/room/${roomId}/today`),
    getRoomStats: (roomId) => request(`/api/attendance/room/${roomId}/stats`),
    submit: (data) => request('/api/attendance/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getPending: () => request('/api/attendance/pending'),
    getPendingForRoom: (roomId) => request(`/api/attendance/pending/${roomId}`),
    approve: (attendanceId, options = {}) => request(`/api/attendance/${attendanceId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ quality_rating: options.quality_rating, admin_feedback: options.admin_feedback })
    }),
    reject: (attendanceId, reason, options = {}) => request(`/api/attendance/${attendanceId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, quality_rating: options.quality_rating, admin_feedback: options.admin_feedback })
    }),
    markAbsent: (roomId, userId, date) => request('/api/attendance/mark-absent', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, user_id: userId, date })
    })
  },
  
  // Invites
  invites: {
    getByCode: (code) => request(`/api/invites/code/${code}`),
    getForRoom: (roomId) => request(`/api/invites/room/${roomId}`),
    create: (roomId) => request('/api/invites', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId })
    }),
    accept: (inviteCode) => request('/api/invites/accept', {
      method: 'POST',
      body: JSON.stringify({ invite_code: inviteCode })
    }),
    revoke: (inviteId) => request(`/api/invites/${inviteId}/revoke`, {
      method: 'POST'
    })
  },
  
  // Rules
  rules: {
    getForRoom: (roomId) => request(`/api/rules/room/${roomId}`),
    add: (roomId, text) => request('/api/rules', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, text })
    }),
    update: (ruleId, data) => request(`/api/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    toggle: (ruleId) => request(`/api/rules/${ruleId}/toggle`, {
      method: 'POST'
    }),
    delete: (ruleId) => request(`/api/rules/${ruleId}`, {
      method: 'DELETE'
    })
  },
  
  // Analytics
  analytics: {
    user: () => request('/api/analytics/user'),
    userRoom: (roomId) => request(`/api/analytics/user/room/${roomId}`),
    admin: () => request('/api/analytics/admin'),
    adminUser: (userId) => request(`/api/analytics/admin/user/${userId}`)
  },

  // Gallery
  gallery: {
    getRooms: () => request('/api/gallery'),
    getRoomPhotos: (roomId, options = {}) => {
      const params = new URLSearchParams()
      if (options.fromDate) params.set('fromDate', options.fromDate)
      if (options.toDate) params.set('toDate', options.toDate)
      if (options.limit) params.set('limit', options.limit)
      const query = params.toString()
      return request(`/api/gallery/room/${roomId}${query ? `?${query}` : ''}`)
    },
    getAllPhotos: (options = {}) => {
      const params = new URLSearchParams()
      if (options.fromDate) params.set('fromDate', options.fromDate)
      if (options.toDate) params.set('toDate', options.toDate)
      if (options.limit) params.set('limit', options.limit)
      const query = params.toString()
      return request(`/api/gallery/all${query ? `?${query}` : ''}`)
    }
  },

  // Warnings & Consequences
  warnings: {
    getAll: () => request('/api/warnings'),
    getForRoom: (roomId) => request(`/api/warnings/room/${roomId}`),
    create: (data) => request('/api/warnings', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    createAuto: (data) => request('/api/warnings/auto', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    acknowledge: (warningId) => request(`/api/warnings/${warningId}/acknowledge`, {
      method: 'POST'
    }),
    dismiss: (warningId) => request(`/api/warnings/${warningId}/dismiss`, {
      method: 'POST'
    }),
    getConsequences: (roomId) => request(`/api/warnings/consequences/room/${roomId}`),
    issueConsequence: (data) => request('/api/warnings/consequences', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    resolveConsequence: (consequenceId) => request(`/api/warnings/consequences/${consequenceId}/resolve`, {
      method: 'POST'
    })
  },

  // Achievements
  achievements: {
    getAll: () => request('/api/achievements'),
    getMine: () => request('/api/achievements/me'),
    getUnnotified: () => request('/api/achievements/unnotified'),
    markNotified: (achievementIds) => request('/api/achievements/mark-notified', {
      method: 'POST',
      body: JSON.stringify({ achievementIds })
    }),
    check: () => request('/api/achievements/check', { method: 'POST' })
  },

  // Leaderboard
  leaderboard: {
    getGlobal: (options = {}) => {
      const params = new URLSearchParams()
      if (options.sortBy) params.set('sortBy', options.sortBy)
      if (options.period) params.set('period', options.period)
      if (options.limit) params.set('limit', options.limit)
      const query = params.toString()
      return request(`/api/leaderboard${query ? `?${query}` : ''}`)
    },
    getForRoom: (roomId) => request(`/api/leaderboard/room/${roomId}`),
    getMyRank: () => request('/api/leaderboard/me')
  },

  // Challenges
  challenges: {
    list: () => request('/api/challenges'),
    get: (id) => request(`/api/challenges/${id}`),
    getForRoom: (roomId) => request(`/api/challenges/room/${roomId}`),
    create: (data) => request('/api/challenges', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    join: (id) => request(`/api/challenges/${id}/join`, { method: 'POST' }),
    leave: (id) => request(`/api/challenges/${id}/leave`, { method: 'POST' }),
    logDay: (id) => request(`/api/challenges/${id}/log`, { method: 'POST' }),
    getParticipants: (id) => request(`/api/challenges/${id}/participants`)
  },

  // Notifications
  notifications: {
    list: (options = {}) => {
      const params = new URLSearchParams()
      if (options.limit) params.set('limit', options.limit)
      if (options.unreadOnly) params.set('unreadOnly', 'true')
      const query = params.toString()
      return request(`/api/notifications${query ? `?${query}` : ''}`)
    },
    getUnreadCount: () => request('/api/notifications/unread-count'),
    markRead: (id) => request(`/api/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => request('/api/notifications/read-all', { method: 'POST' }),
    getPreferences: () => request('/api/notifications/preferences'),
    updatePreferences: (data) => request('/api/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    getVapidKey: () => request('/api/notifications/vapid-public-key'),
    subscribePush: (subscription) => request('/api/notifications/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription)
    }),
    unsubscribePush: (endpoint) => request('/api/notifications/push/subscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint })
    })
  },

  // Room Reminders
  reminders: {
    getAll: () => request('/api/reminders'),
    getForRoom: (roomId) => request(`/api/reminders/room/${roomId}`),
    setForRoom: (roomId, minutesBefore) => request(`/api/reminders/room/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify({ minutesBefore })
    }),
    add: (roomId, minutesBefore) => request('/api/reminders', {
      method: 'POST',
      body: JSON.stringify({ roomId, minutesBefore })
    }),
    remove: (id) => request(`/api/reminders/${id}`, { method: 'DELETE' }),
    toggle: (id, enabled) => request(`/api/reminders/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled })
    })
  },

  // Activity Feed
  feed: {
    get: (options = {}) => {
      const params = new URLSearchParams()
      if (options.limit) params.set('limit', options.limit)
      if (options.before) params.set('before', options.before)
      const query = params.toString()
      return request(`/api/feed${query ? `?${query}` : ''}`)
    },
    getForRoom: (roomId, options = {}) => {
      const params = new URLSearchParams()
      if (options.limit) params.set('limit', options.limit)
      if (options.before) params.set('before', options.before)
      const query = params.toString()
      return request(`/api/feed/room/${roomId}${query ? `?${query}` : ''}`)
    },
    getGlobal: (options = {}) => {
      const params = new URLSearchParams()
      if (options.limit) params.set('limit', options.limit)
      if (options.before) params.set('before', options.before)
      const query = params.toString()
      return request(`/api/feed/global${query ? `?${query}` : ''}`)
    }
  }
}

export default api
