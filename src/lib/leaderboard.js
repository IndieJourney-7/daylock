/**
 * Leaderboard Service (Frontend)
 * Client-side helpers for leaderboard system
 */

import { api } from './api'

export const leaderboardService = {
  /** Get global leaderboard */
  async getGlobal(options = {}) {
    return api.leaderboard.getGlobal(options)
  },

  /** Get room-specific leaderboard */
  async getForRoom(roomId) {
    return api.leaderboard.getForRoom(roomId)
  },

  /** Get current user's rank */
  async getMyRank() {
    return api.leaderboard.getMyRank()
  },

  /** Get rank badge info */
  getRankBadge(rank) {
    if (rank === 1) return { icon: '👑', label: '1st', color: 'text-yellow-500' }
    if (rank === 2) return { icon: '🥈', label: '2nd', color: 'text-gray-400' }
    if (rank === 3) return { icon: '🥉', label: '3rd', color: 'text-amber-600' }
    return { icon: '', label: `#${rank}`, color: 'text-gray-500' }
  },

  /** Sort labels */
  SORT_OPTIONS: [
    { value: 'discipline_score', label: 'Discipline Score' },
    { value: 'streak', label: 'Current Streak' },
    { value: 'attendance_rate', label: 'Attendance Rate' }
  ],

  PERIOD_OPTIONS: [
    { value: 'all', label: 'All Time' },
    { value: 'month', label: 'This Month' },
    { value: 'week', label: 'This Week' }
  ]
}
