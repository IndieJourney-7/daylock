/**
 * Activity Feed Service (Frontend)
 * Client-side helpers for social timeline
 */

import { api } from './api'

export const feedService = {
  /** Get personalized feed (user's rooms) */
  async getMyFeed(options = {}) {
    return api.feed.get(options)
  },

  /** Get feed for a specific room */
  async getForRoom(roomId, options = {}) {
    return api.feed.getForRoom(roomId, options)
  },

  /** Get global public feed */
  async getGlobal(options = {}) {
    return api.feed.getGlobal(options)
  },

  /** Event type config */
  EVENT_TYPES: {
    attendance: { icon: '✅', color: 'text-green-600', label: 'Attendance' },
    achievement: { icon: '🏆', color: 'text-yellow-500', label: 'Achievement' },
    challenge: { icon: '⚔️', color: 'text-purple-600', label: 'Challenge' },
    streak_milestone: { icon: '🔥', color: 'text-orange-500', label: 'Streak' },
    room_join: { icon: '👋', color: 'text-blue-500', label: 'Joined' },
    warning: { icon: '⚠️', color: 'text-red-500', label: 'Warning' }
  },

  /** Get event display config */
  getEventConfig(eventType) {
    return this.EVENT_TYPES[eventType] || { icon: '📌', color: 'text-gray-500', label: 'Activity' }
  },

  /** Format relative time */
  getRelativeTime(dateStr) {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }
}
