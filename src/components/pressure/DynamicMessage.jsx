/**
 * DynamicMessage Component
 * Displays context-aware pressure/motivation messages
 * Changes based on room status, streak, time, and user behavior
 */

import { getDynamicMessage, getUrgencyStyle } from '../../lib/pressure'

function DynamicMessage({ context = {}, className = '' }) {
  const message = getDynamicMessage(context)
  const style = getUrgencyStyle(message.urgency)

  return (
    <div 
      className={`
        rounded-lg border px-4 py-3
        ${style.bg} ${style.border}
        ${style.pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      <p className={`text-sm font-medium ${style.text} leading-relaxed`}>
        {message.text}
      </p>
    </div>
  )
}

/**
 * Inline message (no box, just text)
 */
export function InlineMessage({ context = {}, className = '' }) {
  const message = getDynamicMessage(context)
  const style = getUrgencyStyle(message.urgency)

  return (
    <p className={`text-sm ${style.text} ${style.pulse ? 'animate-pulse' : ''} ${className}`}>
      {message.text}
    </p>
  )
}

export default DynamicMessage
