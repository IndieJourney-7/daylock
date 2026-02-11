/**
 * Gallery Service
 * API client for gallery operations (approved proof photos)
 */

import { api } from './api'

export const galleryService = {
  /**
   * Get all rooms with approved proof counts for gallery overview
   */
  async getGalleryRooms() {
    return api.gallery.getRooms()
  },

  /**
   * Get all approved proof photos for a specific room
   */
  async getRoomPhotos(roomId, options = {}) {
    return api.gallery.getRoomPhotos(roomId, options)
  },

  /**
   * Get all approved proof photos across all rooms
   */
  async getAllPhotos(options = {}) {
    return api.gallery.getAllPhotos(options)
  }
}

export default galleryService
