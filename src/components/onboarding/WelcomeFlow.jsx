/**
 * Welcome Flow — 3-screen onboarding for first-time users
 * Shows once after first login, stored in localStorage
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'daylock_onboarding_done'

const steps = [
  {
    emoji: '🚪',
    title: 'Create Rooms for Your Habits',
    description: 'Gym at 6 AM. Work at 9 AM. Study at 7 PM. Each room has a time window — miss it and the door locks.',
    visual: '/Assets/dayblocks.png',
  },
  {
    emoji: '🤝',
    title: 'Assign an Accountability Partner',
    description: 'Your trainer, friend, or mentor becomes the admin. They set the rules, verify your proof, and see every miss.',
    visual: null,
    icon: (
      <div className="flex items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center text-2xl">👤</div>
        <div className="text-accent text-3xl">→</div>
        <div className="w-16 h-16 rounded-full bg-charcoal-500/50 border-2 border-charcoal-400/30 flex items-center justify-center text-2xl">🔑</div>
      </div>
    ),
  },
  {
    emoji: '📸',
    title: 'Show Up. Submit Proof. Build Streaks.',
    description: 'Take a photo, submit before the timer runs out. No proof = no streak. The record is permanent.',
    visual: null,
    icon: (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🔥</span>
          <span className="text-white font-bold text-2xl">12</span>
          <span className="text-gray-400 text-sm">day streak</span>
        </div>
        <div className="h-2 w-48 bg-charcoal-600 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent to-green-400 rounded-full" style={{ width: '80%' }} />
        </div>
      </div>
    ),
  },
]

export function shouldShowWelcome() {
  return !localStorage.getItem(STORAGE_KEY)
}

export function markWelcomeDone() {
  localStorage.setItem(STORAGE_KEY, new Date().toISOString())
}

export default function WelcomeFlow({ onComplete }) {
  const [step, setStep] = useState(0)
  const current = steps[step]
  const isLast = step === steps.length - 1

  const handleNext = () => {
    if (isLast) {
      markWelcomeDone()
      onComplete?.()
    } else {
      setStep(s => s + 1)
    }
  }

  const handleSkip = () => {
    markWelcomeDone()
    onComplete?.()
  }

  return (
    <div className="fixed inset-0 z-50 bg-charcoal-900/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-accent' : i < step ? 'w-4 bg-accent/40' : 'w-4 bg-charcoal-500'
              }`}
            />
          ))}
        </div>

        {/* Visual */}
        <div className="flex justify-center mb-8">
          {current.visual ? (
            <div className="w-48 h-48 rounded-2xl overflow-hidden border-2 border-charcoal-400/20 bg-charcoal-800/80 p-2">
              <img src={current.visual} alt="" className="w-full h-full object-contain rounded-xl" />
            </div>
          ) : current.icon ? (
            <div className="w-48 h-48 rounded-2xl border-2 border-charcoal-400/20 bg-charcoal-800/50 flex items-center justify-center">
              {current.icon}
            </div>
          ) : (
            <div className="text-7xl mb-2">{current.emoji}</div>
          )}
        </div>

        {/* Content */}
        <div className="text-center mb-10">
          <div className="text-3xl mb-3">{current.emoji}</div>
          <h2 className="text-2xl font-bold text-white mb-3">{current.title}</h2>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm mx-auto">
            {current.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isLast ? (
            <Link
              to="/rooms"
              onClick={handleNext}
              className="w-full py-3.5 bg-accent hover:bg-accent-dark text-charcoal-900 font-semibold rounded-xl text-center transition-all duration-200 hover:shadow-glow text-lg"
            >
              Create Your First Room →
            </Link>
          ) : (
            <button
              onClick={handleNext}
              className="w-full py-3.5 bg-accent hover:bg-accent-dark text-charcoal-900 font-semibold rounded-xl transition-all duration-200 hover:shadow-glow text-lg"
            >
              Next
            </button>
          )}

          {!isLast && (
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors py-2"
            >
              Skip intro
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
