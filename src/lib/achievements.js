/**
 * Achievements Service (Frontend)
 * Client-side helpers for achievements system
 */

import { api } from './api'

export const achievementsService = {
  /** Get all achievement definitions */
  async getAllDefinitions() {
    return api.achievements.getAll()
  },

  /** Get current user's earned achievements */
  async getMyAchievements() {
    return api.achievements.getMine()
  },

  /** Get new achievements user hasn't seen yet */
  async getUnnotified() {
    return api.achievements.getUnnotified()
  },

  /** Mark achievements as seen/notified */
  async markNotified(achievementIds) {
    return api.achievements.markNotified(achievementIds)
  },

  /** Trigger server-side achievement check */
  async checkForNew() {
    return api.achievements.check()
  },

  /** Achievement tier colors */
  getTierColor(tier) {
    const colors = {
      bronze: 'text-amber-600 bg-amber-100',
      silver: 'text-gray-500 bg-gray-100',
      gold: 'text-yellow-500 bg-yellow-100',
      platinum: 'text-purple-500 bg-purple-100',
      diamond: 'text-cyan-400 bg-cyan-100'
    }
    return colors[tier] || colors.bronze
  },

  /** Achievement category labels */
  getCategoryLabel(category) {
    const labels = {
      streak: 'Streak Master',
      attendance: 'Dedication',
      quality: 'Quality',
      social: 'Social',
      special: 'Special'
    }
    return labels[category] || category
  }
}
