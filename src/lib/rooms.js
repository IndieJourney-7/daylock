/**
 * Rooms Service
 * CRUD operations for rooms
 */

import { supabase } from './supabase'

export const roomsService = {
  /**
   * Get all rooms for current user
   */
  async getUserRooms(userId) {
    console.log('roomsService.getUserRooms called with:', userId)
    
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        room_invites!room_invites_room_id_fkey (
          id,
          invite_code,
          status,
          admin_id,
          admin:profiles!room_invites_admin_id_fkey (
            id, name, email
          )
        ),
        room_rules (
          id, text, enabled, sort_order
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    console.log('Supabase response - data:', data, 'error:', error)
    
    if (error) throw error
    
    // Transform room_invites into convenient properties
    return (data || []).map(this._transformRoom)
  },

  /**
   * Transform room data to add pending_invite, admin_id, admin from invites
   */
  _transformRoom(room) {
    const invites = room.room_invites || []
    const acceptedInvite = invites.find(i => i.status === 'accepted')
    const pendingInvite = invites.find(i => i.status === 'pending')
    
    return {
      ...room,
      admin_id: acceptedInvite?.admin_id || null,
      admin: acceptedInvite?.admin || null,
      pending_invite: pendingInvite || null
    }
  },

  /**
   * Get single room by ID
   */
  async getRoom(roomId) {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        room_invites!room_invites_room_id_fkey (
          id,
          invite_code,
          status,
          admin_id,
          admin:profiles!room_invites_admin_id_fkey (
            id, name, email
          )
        ),
        room_rules (
          id, text, enabled, sort_order
        )
      `)
      .eq('id', roomId)
      .single()
    
    if (error) throw error
    return this._transformRoom(data)
  },

  /**
   * Create a new room
   */
  async createRoom(userId, roomData) {
    if (!userId) {
      throw new Error('User ID is required to create a room')
    }
    
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        user_id: userId,
        name: roomData.name,
        emoji: roomData.emoji || '📋',
        time_start: roomData.time_start || roomData.timeStart,
        time_end: roomData.time_end || roomData.timeEnd
      })
      .select()
      .single()
    
    if (error) {
      console.error('Room creation error:', error)
      throw new Error(error.message || 'Failed to create room')
    }
    return data
  },

  /**
   * Update a room
   */
  async updateRoom(roomId, updates) {
    const { data, error } = await supabase
      .from('rooms')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Delete a room
   */
  async deleteRoom(roomId) {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId)
    
    if (error) throw error
  },

  /**
   * Get room with stats (attendance data)
   */
  async getRoomWithStats(roomId, userId) {
    // Get room
    const room = await this.getRoom(roomId)
    
    // If no userId, return room without attendance stats
    if (!userId) {
      return {
        ...room,
        stats: { approvedDays: 0, totalDays: 0, attendanceRate: 0, streak: 0 },
        todayStatus: null,
        todayProofNote: null,
        rejectionReason: null,
        attendance: []
      }
    }
    
    // Get attendance stats
    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .order('date', { ascending: false })
    
    if (error) throw error
    
    // Calculate stats
    const approvedDays = attendance.filter(a => a.status === 'approved').length
    const totalDays = attendance.length
    const attendanceRate = totalDays > 0 ? Math.round((approvedDays / totalDays) * 100) : 0
    
    // Calculate streak
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    const sortedAttendance = [...attendance].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )
    
    for (const record of sortedAttendance) {
      if (record.status === 'approved') {
        streak++
      } else if (record.status === 'missed' || record.status === 'rejected') {
        break
      }
    }
    
    // Get today's status
    const todayRecord = attendance.find(a => a.date === today)
    
    return {
      ...room,
      stats: {
        approvedDays,
        totalDays,
        attendanceRate,
        streak
      },
      todayStatus: todayRecord?.status || null,
      todayProofNote: todayRecord?.note || null,
      rejectionReason: todayRecord?.rejection_reason || null,
      attendance
    }
  },

  /**
   * Check if room is currently open based on time window
   */
  isRoomOpen(room) {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    return currentTime >= room.time_start && currentTime <= room.time_end
  }
}

export default roomsService
