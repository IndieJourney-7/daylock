/**
 * Challenges Service (Frontend)
 * Client-side helpers for friend competitions
 */

import { api } from './api'

export const challengesService = {
  /** Get active challenges for current user */
  async getActive() {
    return api.challenges.list()
  },

  /** Get challenge details */
  async getById(challengeId) {
    return api.challenges.get(challengeId)
  },

  /** Get challenges for a room */
  async getForRoom(roomId) {
    return api.challenges.getForRoom(roomId)
  },

  /** Create a new challenge */
  async create({ title, description, type, targetDays, roomId }) {
    return api.challenges.create({ title, description, type, targetDays, roomId })
  },

  /** Join a challenge */
  async join(challengeId) {
    return api.challenges.join(challengeId)
  },

  /** Leave a challenge */
  async leave(challengeId) {
    return api.challenges.leave(challengeId)
  },

  /** Log today as complete */
  async logDay(challengeId) {
    return api.challenges.logDay(challengeId)
  },

  /** Get participants of a challenge */
  async getParticipants(challengeId) {
    return api.challenges.getParticipants(challengeId)
  },

  /** Challenge type labels */
  CHALLENGE_TYPES: [
    { value: 'streak', label: 'Streak Challenge', description: 'Who can build the longest streak' },
    { value: 'attendance', label: 'Attendance Challenge', description: 'Most days attended wins' },
    { value: 'punctuality', label: 'Punctuality Challenge', description: 'No late submissions allowed' }
  ],

  /** Get status badge */
  getStatusBadge(status) {
    const badges = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500' }
    }
    return badges[status] || badges.active
  },

  /** Calculate days remaining */
  getDaysRemaining(endsAt) {
    const now = new Date()
    const end = new Date(endsAt)
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  },

  /** Calculate progress percentage */
  getProgress(completedDays, targetDays) {
    if (!targetDays) return 0
    return Math.min(100, Math.round((completedDays / targetDays) * 100))
  }
}
