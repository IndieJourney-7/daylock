/**
 * Rooms Service
 * API client for room operations
 */

import { api } from './api'

export const roomsService = {
  /**
   * Get all rooms for current user
   */
  async getUserRooms() {
    return api.rooms.list()
  },

  /**
   * Get single room by ID
   */
  async getRoom(roomId) {
    return api.rooms.get(roomId)
  },

  /**
   * Get room with stats (attendance data)
   */
  async getRoomWithStats(roomId) {
    return api.rooms.getWithStats(roomId)
  },

  /**
   * Create a new room
   */
  async createRoom(roomData) {
    return api.rooms.create({
      name: roomData.name,
      emoji: roomData.emoji || '📋',
      time_start: roomData.time_start || roomData.timeStart,
      time_end: roomData.time_end || roomData.timeEnd
    })
  },

  /**
   * Update a room
   */
  async updateRoom(roomId, updates) {
    return api.rooms.update(roomId, updates)
  },

  /**
   * Delete a room
   */
  async deleteRoom(roomId) {
    return api.rooms.delete(roomId)
  },

  /**
   * Get rooms where current user is admin
   */
  async getAdminRooms() {
    return api.rooms.adminList()
  },

  /**
   * Check if room is currently open based on time window
   * This runs on frontend - no API call needed
   */
  isRoomOpen(room) {
    if (!room?.time_start || !room?.time_end) return false
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    return currentTime >= room.time_start && currentTime <= room.time_end
  }
}

export default roomsService
