/**
 * CountdownTimer Component
 * Real-time countdown showing time until room closes/opens
 * Pulses and changes color based on urgency level
 */

import { useState, useEffect } from 'react'
import { getRoomCountdown, getUrgencyStyle } from '../../lib/pressure'

function CountdownTimer({ room, size = 'default', showLabel = true, className = '' }) {
  const [countdown, setCountdown] = useState(() => getRoomCountdown(room))

  // Update every second
  useEffect(() => {
    if (!room?.time_start || !room?.time_end) return

    const timer = setInterval(() => {
      setCountdown(getRoomCountdown(room))
    }, 1000)

    return () => clearInterval(timer)
  }, [room?.time_start, room?.time_end])

  if (!countdown.timeRemaining) return null

  const style = getUrgencyStyle(countdown.urgencyLevel)
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    default: 'text-sm px-3 py-1.5',
    lg: 'text-lg px-4 py-2 font-bold',
    xl: 'text-2xl px-5 py-3 font-bold',
  }

  return (
    <div 
      className={`
        inline-flex items-center gap-2 rounded-lg border
        ${style.bg} ${style.border} ${style.text}
        ${style.pulse ? 'animate-pulse' : ''}
        ${sizeClasses[size] || sizeClasses.default}
        ${className}
      `}
    >
      {/* Timer icon */}
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>

      <div className="flex items-center gap-1.5">
        {showLabel && (
          <span className="opacity-70 text-[0.85em]">{countdown.label}</span>
        )}
        <span className="font-mono font-bold tracking-wider">
          {countdown.timeRemaining}
        </span>
      </div>

      {/* Critical urgency indicator dot */}
      {countdown.urgencyLevel === 'critical' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
    </div>
  )
}

/**
 * Compact countdown for room cards
 */
export function CountdownBadge({ room, className = '' }) {
  const [countdown, setCountdown] = useState(() => getRoomCountdown(room))

  useEffect(() => {
    if (!room?.time_start || !room?.time_end) return
    const timer = setInterval(() => {
      setCountdown(getRoomCountdown(room))
    }, 1000)
    return () => clearInterval(timer)
  }, [room?.time_start, room?.time_end])

  if (!countdown.timeRemaining) return null
  
  const style = getUrgencyStyle(countdown.urgencyLevel)

  return (
    <span 
      className={`
        inline-flex items-center gap-1 text-xs font-mono font-medium rounded-md px-1.5 py-0.5
        ${style.bg} ${style.text} ${style.border} border
        ${style.pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {countdown.isOpen ? '⏳' : '🔒'} {countdown.timeRemaining}
    </span>
  )
}

export default CountdownTimer
