/**
 * MissConfrontation Component
 * Full-screen confrontation shown when user has missed attendance
 * Shows impact of the miss: streak lost, points lost, admin notified
 * Must acknowledge before continuing
 */

import { useState } from 'react'
import { getStreakPhase } from '../../lib/pressure'
import { Icon } from '../ui'

function MissConfrontation({ 
  missedRooms = [], 
  streak = 0, 
  lastStreak = 0,
  onAcknowledge,
  className = '' 
}) {
  const [acknowledged, setAcknowledged] = useState(false)
  const [step, setStep] = useState(0) // Multi-step confrontation

  const phase = getStreakPhase(lastStreak)
  const lostPhase = lastStreak > streak
  const pointsLost = missedRooms.length * 15

  const steps = [
    // Step 0: The miss revelation
    {
      title: 'You Missed.',
      content: (
        <div className="space-y-6 text-center">
          <div className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500/30 flex items-center justify-center mx-auto">
            <span className="text-5xl">❌</span>
          </div>
          
          <div>
            <p className="text-red-400 text-lg font-semibold">
              {missedRooms.length} room{missedRooms.length > 1 ? 's' : ''} missed today
            </p>
            <div className="mt-3 space-y-1">
              {missedRooms.map(room => (
                <div 
                  key={room.id}
                  className="flex items-center justify-center gap-2 text-gray-400 text-sm"
                >
                  <span>{room.emoji || '📋'}</span>
                  <span>{room.name}</span>
                  <span className="text-red-400/60">— No proof submitted</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            The window closed. The record is permanent. Your admin has been notified.
          </p>
        </div>
      )
    },
    // Step 1: The consequence
    {
      title: 'The Consequence',
      content: (
        <div className="space-y-6 text-center">
          {/* Streak impact */}
          {lastStreak > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <span>{phase.emoji}</span>
                    <span className={`text-2xl font-bold ${phase.color} line-through opacity-50`}>{lastStreak}</span>
                  </div>
                  <span className="text-gray-500 text-xs">was</span>
                </div>
                <span className="text-red-400 text-2xl">→</span>
                <div className="text-center">
                  <span className="text-2xl font-bold text-red-400">{streak}</span>
                  <span className="text-gray-500 text-xs block">now</span>
                </div>
              </div>
              {lostPhase && (
                <p className="text-red-400 text-sm font-medium">
                  Identity lost: {phase.emoji} {phase.label}
                </p>
              )}
            </div>
          )}

          {/* Points lost */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-red-400 text-3xl font-bold">-{pointsLost}</div>
              <span className="text-gray-500 text-xs">discipline points</span>
            </div>
          </div>

          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            {lastStreak > 7 
              ? `${lastStreak} days of discipline, erased by one choice. That's the weight of a miss.`
              : "Every miss leaves a mark on your record. It doesn't disappear."
            }
          </p>
        </div>
      )
    },
    // Step 2: The path forward
    {
      title: 'What Now?',
      content: (
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center mx-auto">
            <span className="text-4xl">🔄</span>
          </div>

          <div className="space-y-3">
            <p className="text-white font-medium">
              Recovery starts with honesty.
            </p>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Write a reflection about why you missed. What happened? What will you do differently? 
              Reflections earn back +5 discipline points each.
            </p>
          </div>

          <div className="rounded-lg border border-charcoal-400/20 bg-charcoal-500/20 p-3 text-left">
            <div className="text-xs text-gray-500 mb-2">Recovery path:</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-accent">1.</span>
                <span className="text-gray-300">Write a reflection (required)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-accent">2.</span>
                <span className="text-gray-300">Complete tomorrow's rooms on time</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-accent">3.</span>
                <span className="text-gray-300">Rebuild your streak from day 1</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
  ]

  const currentStep = steps[step]
  const isLast = step >= steps.length - 1

  const handleNext = () => {
    if (isLast) {
      setAcknowledged(true)
      onAcknowledge?.()
    } else {
      setStep(prev => prev + 1)
    }
  }

  if (acknowledged) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/95 backdrop-blur-sm ${className}`}>
      <div className="max-w-md w-full mx-4 space-y-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <div 
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-red-400 w-8' : 'bg-charcoal-400/30 w-4'
              }`}
            />
          ))}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center">
          {currentStep.title}
        </h2>

        {/* Content */}
        <div className="transition-all duration-300">
          {currentStep.content}
        </div>

        {/* Action button */}
        <button
          onClick={handleNext}
          className={`
            w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200
            ${isLast 
              ? 'bg-accent text-charcoal-900 hover:bg-accent/90' 
              : 'bg-charcoal-500/30 border border-charcoal-400/20 text-gray-300 hover:bg-charcoal-500/50'
            }
          `}
        >
          {isLast ? 'I understand. Let me continue.' : 'Next →'}
        </button>

        {/* Skip option (only after first step) */}
        {step > 0 && !isLast && (
          <button 
            onClick={() => { setAcknowledged(true); onAcknowledge?.() }}
            className="w-full text-center text-gray-600 text-xs hover:text-gray-400 transition-colors"
          >
            Skip — I'll reflect later
          </button>
        )}
      </div>
    </div>
  )
}

export default MissConfrontation
