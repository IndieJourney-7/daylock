/**
 * ReflectionLock Component
 * Blocks room access until user writes a reflection about their miss
 * Minimum 20 characters required for a meaningful reflection
 */

import { useState } from 'react'
import { Icon } from '../ui'

const REFLECTION_PROMPTS = [
  "What prevented you from completing this task?",
  "What was going through your mind when the window closed?",
  "What will you do differently next time?",
  "Be honest with yourself — what really happened?",
  "If your admin asked why you missed, what would you say?",
]

function ReflectionLock({ 
  missedRecord,
  roomName = 'Room',
  roomEmoji = '📋',
  onSubmit,
  onSkip,
  className = '' 
}) {
  const [reflection, setReflection] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const minLength = 20
  const isValid = reflection.trim().length >= minLength
  const charsNeeded = Math.max(0, minLength - reflection.trim().length)

  // Pick a prompt based on day
  const promptIndex = new Date().getDate() % REFLECTION_PROMPTS.length
  const prompt = REFLECTION_PROMPTS[promptIndex]

  const handleSubmit = async () => {
    if (!isValid) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit?.(reflection.trim())
    } catch (err) {
      setError(err.message || 'Failed to save reflection')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/95 backdrop-blur-sm ${className}`}>
      <div className="max-w-md w-full mx-4 space-y-5">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mx-auto">
            <span className="text-3xl">📝</span>
          </div>
          <h2 className="text-xl font-bold text-white">Reflection Required</h2>
          <p className="text-gray-400 text-sm">
            You missed <span className="text-white font-medium">{roomEmoji} {roomName}</span> on{' '}
            <span className="text-white font-medium">{missedRecord?.date || 'recently'}</span>. 
            Write a reflection before continuing.
          </p>
        </div>

        {/* Prompt */}
        <div className="rounded-lg border border-charcoal-400/20 bg-charcoal-500/10 px-4 py-3">
          <p className="text-gray-300 text-sm italic">"{prompt}"</p>
        </div>

        {/* Reflection textarea */}
        <div>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Be honest with yourself..."
            rows={4}
            className="w-full bg-charcoal-500/30 border border-charcoal-400/20 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 resize-none transition-colors"
            autoFocus
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className={`text-xs ${isValid ? 'text-accent' : 'text-gray-600'}`}>
              {isValid ? '✓ Ready to submit' : `${charsNeeded} more character${charsNeeded !== 1 ? 's' : ''} needed`}
            </span>
            <span className="text-xs text-gray-600">
              {reflection.trim().length}/{minLength} min
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-xs text-center">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className={`
            w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200
            ${isValid 
              ? 'bg-accent text-charcoal-900 hover:bg-accent/90' 
              : 'bg-charcoal-500/30 text-gray-600 cursor-not-allowed'
            }
          `}
        >
          {submitting ? 'Saving reflection...' : 'Submit Reflection (+5 pts)'}
        </button>

        {/* Info */}
        <div className="text-center space-y-2">
          <p className="text-gray-600 text-xs">
            Reflections are visible to your admin and stored permanently.
          </p>
          {onSkip && (
            <button 
              onClick={onSkip}
              className="text-gray-600 text-xs hover:text-gray-400 transition-colors underline"
            >
              Skip for now (no points earned)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReflectionLock
