/**
 * Room Reminders Service (Frontend)
 * Uses Supabase directly (RLS secures per-user access).
 * The backend cron reads the same table for server-side push notifications.
 */

import { supabase } from './supabase'

/** Preset reminder options in minutes */
export const REMINDER_PRESETS = [
  { value: 1, label: '1 min' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
]

/** Get user's IANA timezone */
function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

export const remindersService = {
  // ============ SUPABASE DIRECT CALLS ============

  /** Get all reminders for current user (with room info) */
  async getAll() {
    const { data, error } = await supabase
      .from('room_reminders')
      .select('*, rooms(id, name, emoji, time_start, time_end)')
      .eq('enabled', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getAll reminders error:', error)
      throw new Error(error.message)
    }
    return data || []
  },

  /** Get reminders for a specific room */
  async getForRoom(roomId) {
    const { data, error } = await supabase
      .from('room_reminders')
      .select('*')
      .eq('room_id', roomId)
      .order('minutes_before', { ascending: true })

    if (error) {
      console.error('getForRoom reminders error:', error)
      throw new Error(error.message)
    }
    return data || []
  },

  /** Set all reminders for a room (replaces existing) */
  async setForRoom(roomId, minutesBefore = []) {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Delete existing reminders for this room
    const { error: delError } = await supabase
      .from('room_reminders')
      .delete()
      .eq('room_id', roomId)

    if (delError) {
      console.error('Delete reminders error:', delError)
      throw new Error(delError.message)
    }

    // If no reminders requested, done
    if (!minutesBefore || minutesBefore.length === 0) {
      return []
    }

    // Insert new reminders
    const timezone = getUserTimezone()
    const rows = minutesBefore.map(min => ({
      user_id: user.id,
      room_id: roomId,
      minutes_before: min,
      enabled: true,
      timezone
    }))

    const { data, error } = await supabase
      .from('room_reminders')
      .insert(rows)
      .select()

    if (error) {
      // If timezone column doesn't exist yet, retry without it
      if (error.message?.includes('timezone') || error.code === '42703') {
        console.warn('timezone column not found, retrying without it')
        const rowsNoTz = minutesBefore.map(min => ({
          user_id: user.id,
          room_id: roomId,
          minutes_before: min,
          enabled: true
        }))
        const { data: data2, error: error2 } = await supabase
          .from('room_reminders')
          .insert(rowsNoTz)
          .select()
        if (error2) {
          console.error('Insert reminders error (no tz):', error2)
          throw new Error(error2.message)
        }
        return data2 || []
      }

      console.error('Insert reminders error:', error)
      throw new Error(error.message)
    }
    return data || []
  },

  /** Remove a reminder by id */
  async remove(reminderId) {
    const { error } = await supabase
      .from('room_reminders')
      .delete()
      .eq('id', reminderId)

    if (error) {
      console.error('Remove reminder error:', error)
      throw new Error(error.message)
    }
  },

  // ============ BROWSER NOTIFICATIONS ============

  /** Check if browser notifications are supported */
  isSupported() {
    return 'Notification' in window
  },

  /** Get current permission status */
  getPermission() {
    if (!this.isSupported()) return 'unsupported'
    return Notification.permission
  },

  /** Request browser notification permission */
  async requestPermission() {
    if (!this.isSupported()) return 'unsupported'
    return await Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()
  },

  /**
   * Calculate ms until the next occurrence of a room's open time minus the reminder offset.
   * Returns null if the reminder time already passed today and tomorrow is the next one.
   * @param {string} timeStart - Room open time, e.g. "09:00" or "09:00:00"
   * @param {number} minutesBefore - Minutes before to fire
   * @returns {{ ms: number, targetTime: Date } | null}
   */
  getNextReminderTime(timeStart, minutesBefore) {
    if (!timeStart) return null

    const now = new Date()
    const [hours, minutes] = timeStart.split(':').map(Number)

    // Room opening time today
    const roomOpensToday = new Date(now)
    roomOpensToday.setHours(hours, minutes, 0, 0)

    // Reminder fires X minutes before opening
    const reminderToday = new Date(roomOpensToday.getTime() - minutesBefore * 60 * 1000)

    // If reminder time is in the future today, use it
    if (reminderToday > now) {
      return {
        ms: reminderToday.getTime() - now.getTime(),
        targetTime: reminderToday
      }
    }

    // Otherwise, schedule for tomorrow
    const roomOpensTomorrow = new Date(roomOpensToday)
    roomOpensTomorrow.setDate(roomOpensTomorrow.getDate() + 1)
    const reminderTomorrow = new Date(roomOpensTomorrow.getTime() - minutesBefore * 60 * 1000)

    return {
      ms: reminderTomorrow.getTime() - now.getTime(),
      targetTime: reminderTomorrow
    }
  },

  /**
   * Show a browser notification
   */
  showNotification(title, options = {}) {
    if (!this.isSupported() || Notification.permission !== 'granted') return null

    return new Notification(title, {
      icon: '/Assets/daylock_logo.png',
      badge: '/favicon.svg',
      tag: options.tag || 'room-reminder',
      renotify: true,
      ...options
    })
  },

  /**
   * Format a reminder for display
   */
  formatReminder(minutesBefore) {
    if (minutesBefore < 60) return `${minutesBefore} min before`
    const hours = Math.floor(minutesBefore / 60)
    const mins = minutesBefore % 60
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''} before`
    return `${hours}h ${mins}m before`
  }
}
