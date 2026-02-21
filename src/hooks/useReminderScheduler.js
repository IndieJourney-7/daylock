/**
 * useReminderScheduler
 * Background hook that schedules browser notifications for room reminders.
 * 
 * How it works:
 * 1. Fetches all user reminders (with room info) on mount
 * 2. For each reminder, calculates the next fire time based on room.time_start - minutes_before
 * 3. Sets a setTimeout for each upcoming reminder
 * 4. When the timer fires, shows a browser Notification
 * 5. Re-schedules every 60 seconds to handle edge cases (sleep, tab reactivation)
 * 
 * Usage: Call once in a top-level component (e.g., DashboardLayout)
 *   useReminderScheduler()
 */

import { useEffect, useRef, useCallback } from 'react'
import { remindersService } from '../lib/reminders'

export function useReminderScheduler() {
  const timersRef = useRef([])
  const intervalRef = useRef(null)
  const firedRef = useRef(new Set()) // Track which reminders already fired this session

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(id => clearTimeout(id))
    timersRef.current = []
  }, [])

  const scheduleReminders = useCallback(async () => {
    // Clear previous timers
    clearAllTimers()

    // Check permission
    if (!remindersService.isSupported() || Notification.permission !== 'granted') {
      return
    }

    try {
      const reminders = await remindersService.getAll()
      if (!reminders || reminders.length === 0) return

      const now = Date.now()

      reminders.forEach(reminder => {
        const room = reminder.rooms
        if (!room || !room.time_start) return

        const timing = remindersService.getNextReminderTime(room.time_start, reminder.minutes_before)
        if (!timing) return

        // Only schedule if within the next 24 hours + 1 minute
        const MAX_TIMEOUT = 24 * 60 * 60 * 1000 + 60000
        if (timing.ms > MAX_TIMEOUT || timing.ms < 0) return

        // Generate a unique key for today's instance
        const dateKey = timing.targetTime.toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM
        const fireKey = `${reminder.id}-${dateKey}`

        // Skip if already fired
        if (firedRef.current.has(fireKey)) return

        const timerId = setTimeout(() => {
          // Mark as fired
          firedRef.current.add(fireKey)

          // Clean old keys (keep only last 50)
          if (firedRef.current.size > 50) {
            const arr = Array.from(firedRef.current)
            firedRef.current = new Set(arr.slice(-30))
          }

          const minLabel = remindersService.formatReminder(reminder.minutes_before)
          remindersService.showNotification(
            `${room.emoji || '📋'} ${room.name} opens soon!`,
            {
              body: `Your room opens ${minLabel.replace(' before', '')} from now. Get ready!`,
              tag: `room-reminder-${reminder.room_id}-${reminder.minutes_before}`,
              data: { roomId: reminder.room_id }
            }
          )
        }, timing.ms)

        timersRef.current.push(timerId)
      })
    } catch (err) {
      console.warn('Reminder scheduler error:', err)
    }
  }, [clearAllTimers])

  useEffect(() => {
    // Initial schedule
    scheduleReminders()

    // Re-schedule every 60 seconds to handle:
    // - New reminders added while app is open
    // - Computer wake from sleep
    // - Timer drift
    intervalRef.current = setInterval(scheduleReminders, 60 * 1000)

    // Also re-schedule when tab becomes visible (after sleep/background)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        scheduleReminders()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearAllTimers()
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [scheduleReminders, clearAllTimers])
}

export default useReminderScheduler
