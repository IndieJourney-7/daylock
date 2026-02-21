/**
 * Room Reminders Service (Frontend)
 * Client-side helpers for room reminder management + browser notification scheduling
 */

import { api } from './api'

/** Preset reminder options in minutes */
export const REMINDER_PRESETS = [
  { value: 1, label: '1 min' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
]

export const remindersService = {
  // ============ API CALLS ============

  /** Get all reminders with room info */
  async getAll() {
    return api.reminders.getAll()
  },

  /** Get reminders for a specific room */
  async getForRoom(roomId) {
    return api.reminders.getForRoom(roomId)
  },

  /** Set all reminders for a room (replaces existing) */
  async setForRoom(roomId, minutesBefore = []) {
    return api.reminders.setForRoom(roomId, minutesBefore)
  },

  /** Add a single reminder */
  async add(roomId, minutesBefore) {
    return api.reminders.add(roomId, minutesBefore)
  },

  /** Remove a reminder */
  async remove(reminderId) {
    return api.reminders.remove(reminderId)
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
