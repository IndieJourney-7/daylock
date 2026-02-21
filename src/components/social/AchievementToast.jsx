/**
 * AchievementToast Component
 * Animated toast notification when a user earns a new achievement
 */

import { useState, useEffect } from 'react'

function AchievementToast({ achievement, onDismiss }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    // Slide in
    const showTimer = setTimeout(() => setVisible(true), 100)
    // Auto-dismiss after 5 seconds
    const hideTimer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onDismiss?.(), 400)
    }, 5000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [onDismiss])

  if (!achievement) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-400 ease-out ${
        visible && !exiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 rounded-xl p-4 shadow-2xl backdrop-blur-sm max-w-sm cursor-pointer"
        onClick={() => {
          setExiting(true)
          setTimeout(() => onDismiss?.(), 400)
        }}
      >
        <div className="flex items-center gap-3">
          {/* Achievement icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <span className="text-2xl">{achievement.icon || '🏆'}</span>
          </div>

          <div className="min-w-0">
            <p className="text-yellow-400 font-bold text-xs uppercase tracking-wider">
              Achievement Unlocked!
            </p>
            <p className="text-white font-semibold text-sm truncate">
              {achievement.name}
            </p>
            <p className="text-gray-400 text-xs truncate">
              {achievement.description}
            </p>
          </div>
        </div>

        {/* Progress bar for auto-dismiss */}
        <div className="mt-3 h-0.5 bg-charcoal-500/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-500/60 rounded-full transition-all ease-linear"
            style={{
              width: visible && !exiting ? '0%' : '100%',
              transitionDuration: '5000ms'
            }}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * AchievementToastManager
 * Manages a queue of achievement toasts
 */
export function AchievementToastManager({ achievements = [], onAllDismissed }) {
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)

  useEffect(() => {
    if (achievements.length > 0) {
      setQueue(prev => [...prev, ...achievements])
    }
  }, [achievements])

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0])
      setQueue(prev => prev.slice(1))
    }
  }, [current, queue])

  useEffect(() => {
    if (!current && queue.length === 0 && achievements.length > 0) {
      onAllDismissed?.()
    }
  }, [current, queue, achievements.length, onAllDismissed])

  return (
    <AchievementToast
      achievement={current}
      onDismiss={() => setCurrent(null)}
    />
  )
}

export default AchievementToast
