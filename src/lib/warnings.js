/**
 * Warnings Service
 * Frontend API client for warnings and consequences
 */

import { api } from './api'

export const warningsService = {
  /** Get all active warnings for admin */
  async getAdminWarnings() {
    return api.warnings.getAll()
  },

  /** Get warnings for a specific room */
  async getRoomWarnings(roomId) {
    return api.warnings.getForRoom(roomId)
  },

  /** Create a manual warning */
  async createWarning({ room_id, user_id, severity, message }) {
    return api.warnings.create({ room_id, user_id, severity, message })
  },

  /** Create an auto-detected warning */
  async createAutoWarning({ room_id, user_id, trigger_reason, severity, message }) {
    return api.warnings.createAuto({ room_id, user_id, trigger_reason, severity, message })
  },

  /** Acknowledge a warning */
  async acknowledgeWarning(warningId) {
    return api.warnings.acknowledge(warningId)
  },

  /** Dismiss a warning */
  async dismissWarning(warningId) {
    return api.warnings.dismiss(warningId)
  },

  /** Get consequences for a room */
  async getConsequences(roomId) {
    return api.warnings.getConsequences(roomId)
  },

  /** Issue a consequence */
  async issueConsequence({ room_id, user_id, level, reason, notes, expires_at }) {
    return api.warnings.issueConsequence({ room_id, user_id, level, reason, notes, expires_at })
  },

  /** Resolve a consequence */
  async resolveConsequence(consequenceId) {
    return api.warnings.resolveConsequence(consequenceId)
  }
}

export default warningsService
