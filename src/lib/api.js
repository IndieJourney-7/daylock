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
    getForRoom: (roomId) => request(`/api/attendance/room/${roomId}`),
    getTodayStatus: (roomId) => request(`/api/attendance/room/${roomId}/today`),
    getRoomStats: (roomId) => request(`/api/attendance/room/${roomId}/stats`),
    submit: (data) => request('/api/attendance/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getPending: () => request('/api/attendance/pending'),
    getPendingForRoom: (roomId) => request(`/api/attendance/pending/${roomId}`),
    approve: (attendanceId) => request(`/api/attendance/${attendanceId}/approve`, {
      method: 'POST'
    }),
    reject: (attendanceId, reason) => request(`/api/attendance/${attendanceId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
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
  }
}

export default api
