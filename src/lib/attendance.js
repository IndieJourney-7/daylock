/**
 * Attendance Service
 * Handle attendance records and proof uploads
 */

import { supabase } from './supabase'

export const attendanceService = {
  /**
   * Submit attendance with proof
   */
  async submitProof(roomId, userId, proofFile, note = '') {
    const today = new Date().toISOString().split('T')[0]
    
    // Upload proof image to storage
    let proofUrl = null
    if (proofFile) {
      const fileExt = proofFile.name.split('.').pop()
      const fileName = `${userId}/${roomId}/${today}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(fileName, proofFile, { upsert: true })
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('proofs')
        .getPublicUrl(fileName)
      
      proofUrl = publicUrl
    }
    
    // Upsert attendance record
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        room_id: roomId,
        user_id: userId,
        date: today,
        status: 'pending_review',
        proof_url: proofUrl,
        note,
        submitted_at: new Date().toISOString()
      }, {
        onConflict: 'room_id,user_id,date'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Approve attendance (admin action)
   */
  async approveAttendance(attendanceId, adminId) {
    const { data, error } = await supabase
      .from('attendance')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId
      })
      .eq('id', attendanceId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Reject attendance (admin action)
   */
  async rejectAttendance(attendanceId, adminId, reason = '') {
    const { data, error } = await supabase
      .from('attendance')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId
      })
      .eq('id', attendanceId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Get user's attendance for a specific room
   */
  async getUserAttendance(roomId, userId) {
    if (!roomId || !userId) return []
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data
  },

  /**
   * Get all user's attendance across all rooms
   */
  async getAllUserAttendance(userId, options = {}) {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        room:rooms (
          id, name, emoji
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
    
    if (options.fromDate) {
      query = query.gte('date', options.fromDate)
    }
    
    if (options.toDate) {
      query = query.lte('date', options.toDate)
    }
    
    if (options.limit) {
      query = query.limit(options.limit)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  /**
   * Get attendance for a room
   */
  async getRoomAttendance(roomId, options = {}) {
    let query = supabase
      .from('attendance')
      .select('*')
      .eq('room_id', roomId)
      .order('date', { ascending: false })
    
    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }
    
    if (options.status) {
      query = query.eq('status', options.status)
    }
    
    if (options.fromDate) {
      query = query.gte('date', options.fromDate)
    }
    
    if (options.toDate) {
      query = query.lte('date', options.toDate)
    }
    
    if (options.limit) {
      query = query.limit(options.limit)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  /**
   * Get pending proofs for admin to review
   */
  async getPendingProofs(roomId) {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        user:profiles!attendance_user_id_fkey (
          id, name, email
        )
      `)
      .eq('room_id', roomId)
      .eq('status', 'pending_review')
      .order('submitted_at', { ascending: true })
    
    if (error) throw error
    return data
  },

  /**
   * Get all pending proofs for admin across all rooms
   */
  async getAllPendingProofsForAdmin(adminId) {
    // First get rooms where user is admin
    const { data: invites, error: invitesError } = await supabase
      .from('room_invites')
      .select('room_id')
      .eq('admin_id', adminId)
      .eq('status', 'accepted')
    
    if (invitesError) throw invitesError
    
    if (invites.length === 0) return []
    
    const roomIds = invites.map(i => i.room_id)
    
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        room:rooms (
          id, name, emoji
        ),
        user:profiles!attendance_user_id_fkey (
          id, name, email
        )
      `)
      .in('room_id', roomIds)
      .eq('status', 'pending_review')
      .order('submitted_at', { ascending: true })
    
    if (error) throw error
    return data
  },

  /**
   * Get user's attendance history across all rooms
   */
  async getUserAttendanceHistory(userId, options = {}) {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        room:rooms (
          id, name, emoji
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
    
    if (options.limit) {
      query = query.limit(options.limit)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  /**
   * Get today's attendance status for a room
   */
  async getTodayStatus(roomId, userId) {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  /**
   * Mark attendance as missed (called by cron job or manual)
   */
  async markMissed(roomId, userId, date) {
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        room_id: roomId,
        user_id: userId,
        date,
        status: 'missed'
      }, {
        onConflict: 'room_id,user_id,date',
        ignoreDuplicates: true
      })
      .select()
    
    if (error) throw error
    return data
  },

  /**
   * Calculate stats for a room
   */
  async getRoomStats(roomId, userId) {
    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
    
    if (error) throw error
    
    const approved = attendance.filter(a => a.status === 'approved').length
    const rejected = attendance.filter(a => a.status === 'rejected').length
    const missed = attendance.filter(a => a.status === 'missed').length
    const total = attendance.length
    const rate = total > 0 ? Math.round((approved / total) * 100) : 0
    
    // Calculate current streak
    let streak = 0
    const sortedDates = [...attendance]
      .filter(a => a.status === 'approved')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    
    if (sortedDates.length > 0) {
      let currentDate = new Date()
      currentDate.setHours(0, 0, 0, 0)
      
      for (const record of sortedDates) {
        const recordDate = new Date(record.date)
        recordDate.setHours(0, 0, 0, 0)
        
        const diffDays = Math.floor((currentDate - recordDate) / (1000 * 60 * 60 * 24))
        
        if (diffDays <= 1) {
          streak++
          currentDate = recordDate
        } else {
          break
        }
      }
    }
    
    return {
      approvedDays: approved,
      rejectedDays: rejected,
      missedDays: missed,
      totalDays: total,
      attendanceRate: rate,
      streak
    }
  }
}

export default attendanceService
