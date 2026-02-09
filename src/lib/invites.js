/**
 * Invites Service
 * Handle room invite codes for admin assignment
 */

import { supabase } from './supabase'

/**
 * Generate a random invite code (XXX-XXXX format)
 */
function generateInviteCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  
  // 3-letter prefix
  for (let i = 0; i < 3; i++) {
    code += chars[Math.floor(Math.random() * 24)]
  }
  code += '-'
  // 4 alphanumeric
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  
  return code
}

export const invitesService = {
  /**
   * Create a new invite for a room
   */
  async createInvite(roomId) {
    console.log('Creating invite for room:', roomId)
    
    if (!roomId) {
      throw new Error('Room ID is required')
    }
    
    const code = generateInviteCode()
    console.log('Generated code:', code)
    
    const { data, error } = await supabase
      .from('room_invites')
      .insert({
        room_id: roomId,
        invite_code: code,
        status: 'pending'
      })
      .select()
      .single()
    
    console.log('Supabase response:', { data, error })
    
    if (error) {
      console.error('Invite creation error:', error)
      // If code collision, retry
      if (error.code === '23505') {
        return this.createInvite(roomId)
      }
      throw error
    }
    
    return data
  },

  /**
   * Get invite by code
   */
  async getInviteByCode(code) {
    const { data, error } = await supabase
      .from('room_invites')
      .select(`
        *,
        room:rooms (
          id, name, emoji, time_start, time_end,
          user:profiles!rooms_user_id_fkey (
            id, name, email
          )
        )
      `)
      .eq('invite_code', code.toUpperCase())
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  /**
   * Accept an invite (admin joins room)
   */
  async acceptInvite(inviteCode, adminId) {
    // First get the invite
    const invite = await this.getInviteByCode(inviteCode)
    
    if (!invite) {
      throw new Error('Invalid invite code')
    }
    
    if (invite.status !== 'pending') {
      throw new Error('This invite has already been used')
    }
    
    // Check if admin already manages this room (prevent duplicates)
    const { data: existing } = await supabase
      .from('room_invites')
      .select('id')
      .eq('room_id', invite.room_id)
      .eq('admin_id', adminId)
      .eq('status', 'accepted')
      .maybeSingle()
    
    if (existing) {
      throw new Error('You are already managing this room')
    }
    
    // Check if admin is the room owner
    if (invite.room?.user?.id === adminId) {
      throw new Error('You cannot be admin of your own room')
    }
    
    // Update invite with admin
    const { data, error } = await supabase
      .from('room_invites')
      .update({
        admin_id: adminId,
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invite.id)
      .select(`
        *,
        room:rooms (
          id, name, emoji
        )
      `)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Revoke an invite
   */
  async revokeInvite(inviteId) {
    const { data, error } = await supabase
      .from('room_invites')
      .update({ status: 'revoked' })
      .eq('id', inviteId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Get all invites for a room
   */
  async getRoomInvites(roomId) {
    const { data, error } = await supabase
      .from('room_invites')
      .select(`
        *,
        admin:profiles!room_invites_admin_id_fkey (
          id, name, email
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  /**
   * Get all rooms where user is admin
   */
  async getAdminRooms(adminId) {
    const { data, error } = await supabase
      .from('room_invites')
      .select(`
        *,
        room:rooms (
          *,
          user:profiles!rooms_user_id_fkey (
            id, name, email
          ),
          room_rules (
            id, text, enabled, sort_order
          )
        )
      `)
      .eq('admin_id', adminId)
      .eq('status', 'accepted')
      .order('accepted_at', { ascending: false })
    
    if (error) throw error
    
    const today = new Date().toISOString().split('T')[0]
    
    // For each room, fetch attendance stats and today's status
    const roomsWithStats = await Promise.all(
      data.map(async (invite) => {
        const room = invite.room
        const userId = room.user_id
        
        // Fetch attendance for this room+user
        const { data: attendance, error: attError } = await supabase
          .from('attendance')
          .select('*')
          .eq('room_id', room.id)
          .eq('user_id', userId)
          .order('date', { ascending: false })
        
        if (attError) {
          console.error('Failed to fetch attendance for room:', room.id, attError)
        }
        
        const records = attendance || []
        const approvedDays = records.filter(a => a.status === 'approved').length
        const totalDays = records.length
        const attendanceRate = totalDays > 0 ? Math.round((approvedDays / totalDays) * 100) : 0
        
        // Calculate streak
        let streak = 0
        for (const record of records) {
          if (record.status === 'approved') streak++
          else break
        }
        
        // Today's record
        const todayRecord = records.find(a => a.date === today) || null
        
        // Count pending proofs
        const pendingCount = records.filter(a => a.status === 'pending_review').length
        
        return {
          ...room,
          inviteCode: invite.invite_code,
          assignedBy: room.user,
          assignedAt: invite.accepted_at,
          stats: {
            streak,
            attendanceRate,
            approvedDays,
            totalDays,
            missedDays: records.filter(a => a.status === 'missed').length,
            rejectedDays: records.filter(a => a.status === 'rejected').length,
          },
          today_attendance: todayRecord,
          pending_proofs_count: pendingCount
        }
      })
    )
    
    return roomsWithStats
  }
}

export default invitesService
