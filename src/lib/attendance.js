/**
 * Attendance Service
 * API client for attendance operations
 */

import { api } from './api'
import { supabase } from './supabase'

export const attendanceService = {
  /**
   * Submit attendance with proof
   * Uploads image to Supabase Storage, then submits to backend
   */
  async submitProof(roomId, userId, proofFile, note = '') {
    // Validate required params
    if (!roomId) {
      throw new Error('Room ID is required')
    }
    if (!userId) {
      throw new Error('User ID is required. Please log in again.')
    }
    
    let proofUrl = null
    
    // Upload proof image to Supabase Storage
    if (proofFile) {
      // === FILE VALIDATION ===
      const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
      const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg']
      const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic']
      
      // Validate file exists
      if (!proofFile || !proofFile.size) {
        throw new Error('Invalid file. Please select an image.')
      }
      
      // Validate file size
      if (proofFile.size > MAX_FILE_SIZE) {
        throw new Error('File size must be less than 10MB')
      }
      
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(proofFile.type)) {
        throw new Error('Only image files (JPG, PNG, WebP, HEIC) are allowed')
      }
      
      // Validate and sanitize file extension
      const ext = proofFile.name?.split('.').pop()?.toLowerCase()
      if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        throw new Error('Invalid file extension. Only JPG, PNG, WebP, and HEIC are allowed')
      }
      
      // === END VALIDATION ===
      
      const today = new Date().toISOString().split('T')[0]
      const fileName = `${userId}/${roomId}/${today}.${ext}`
      
      console.log('Uploading proof to:', fileName)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(fileName, proofFile, { upsert: true })
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Failed to upload image: ${uploadError.message}`)
      }
      
      console.log('Upload successful:', uploadData)
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('proofs')
        .getPublicUrl(fileName)
      
      proofUrl = urlData?.publicUrl
      console.log('Proof URL:', proofUrl)
      
      if (!proofUrl) {
        throw new Error('Failed to get image URL after upload')
      }
    }
    
    // Submit to backend API
    console.log('Submitting to backend:', { room_id: roomId, proof_url: proofUrl, note })
    return api.attendance.submit({
      room_id: roomId,
      proof_url: proofUrl,
      note
    })
  },

  /**
   * Approve attendance (admin action)
   */
  async approveAttendance(attendanceId, options = {}) {
    return api.attendance.approve(attendanceId, options)
  },

  /**
   * Reject attendance (admin action)
   */
  async rejectAttendance(attendanceId, reason = '', options = {}) {
    return api.attendance.reject(attendanceId, reason, options)
  },

  /**
   * Get user's attendance for a specific room
   * @param {string} roomId
   * @param {string} [userId] - Optional: pass when admin needs another user's attendance
   */
  async getUserAttendance(roomId, userId) {
    return api.attendance.getForRoom(roomId, userId)
  },

  /**
   * Get all user's attendance across all rooms
   */
  async getAllUserAttendance(options = {}) {
    return api.attendance.list(options)
  },

  /**
   * Get today's attendance status for a room
   */
  async getTodayStatus(roomId) {
    return api.attendance.getTodayStatus(roomId)
  },

  /**
   * Get pending proofs for a room (admin view)
   */
  async getPendingProofs(roomId) {
    return api.attendance.getPendingForRoom(roomId)
  },

  /**
   * Get all pending proofs for admin (across all their rooms)
   */
  async getAllPendingProofsForAdmin() {
    return api.attendance.getPending()
  },

  /**
   * Get room stats
   */
  async getRoomStats(roomId) {
    return api.attendance.getRoomStats(roomId)
  },

  /**
   * Mark user as absent for a date (admin action)
   */
  async markAbsent(roomId, userId, date) {
    return api.attendance.markAbsent(roomId, userId, date)
  }
}

export default attendanceService
