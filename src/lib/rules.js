/**
 * Rules Service
 * API client for room rules operations
 */

import { api } from './api'

export const rulesService = {
  /**
   * Get rules for a room
   */
  async getRoomRules(roomId) {
    return api.rules.getForRoom(roomId)
  },

  /**
   * Add a rule to a room
   */
  async addRule(roomId, text) {
    return api.rules.add(roomId, text)
  },

  /**
   * Update a rule
   */
  async updateRule(ruleId, updates) {
    return api.rules.update(ruleId, updates)
  },

  /**
   * Toggle rule enabled status
   */
  async toggleRule(ruleId) {
    return api.rules.toggle(ruleId)
  },

  /**
   * Delete a rule
   */
  async deleteRule(ruleId) {
    return api.rules.delete(ruleId)
  }
}

export default rulesService
