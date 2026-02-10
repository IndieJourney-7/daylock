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
      const today = new Date().toISOString().split('T')[0]
      const fileExt = proofFile.name?.split('.').pop() || 'jpg'
      const fileName = `${userId}/${roomId}/${today}.${fileExt}`
      
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
  async approveAttendance(attendanceId) {
    return api.attendance.approve(attendanceId)
  },

  /**
   * Reject attendance (admin action)
   */
  async rejectAttendance(attendanceId, reason = '') {
    return api.attendance.reject(attendanceId, reason)
  },

  /**
   * Get user's attendance for a specific room
   */
  async getUserAttendance(roomId) {
    return api.attendance.getForRoom(roomId)
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
  }
}

export default attendanceService
