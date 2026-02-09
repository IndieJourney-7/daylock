/**
 * Invites Service
 * API client for room invite operations
 */

import { api } from './api'

export const invitesService = {
  /**
   * Create a new invite for a room
   */
  async createInvite(roomId) {
    return api.invites.create(roomId)
  },

  /**
   * Get invite by code
   */
  async getInviteByCode(code) {
    return api.invites.getByCode(code)
  },

  /**
   * Accept an invite (admin joins room)
   */
  async acceptInvite(inviteCode) {
    return api.invites.accept(inviteCode)
  },

  /**
   * Revoke an invite
   */
  async revokeInvite(inviteId) {
    return api.invites.revoke(inviteId)
  },

  /**
   * Get invites for a room
   */
  async getRoomInvites(roomId) {
    return api.invites.getForRoom(roomId)
  },

  /**
   * Get rooms where current user is admin
   */
  async getAdminRooms() {
    return api.rooms.adminList()
  }
}

export default invitesService
