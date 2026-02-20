/**
 * StreakIdentity Component
 * Shows user's streak phase with visual identity
 * Includes progress bar toward next phase
 */

import { getStreakPhase, getPhaseProgress, getNextPhase, getDaysToNextPhase } from '../../lib/pressure'

/**
 * Full streak identity card
 */
function StreakIdentity({ streak = 0, size = 'default', showProgress = true, className = '' }) {
  const phase = getStreakPhase(streak)
  const progress = getPhaseProgress(streak)
  const nextPhase = getNextPhase(streak)
  const daysToNext = getDaysToNextPhase(streak)

  const sizeConfig = {
    sm: { emoji: 'text-lg', label: 'text-xs', streak: 'text-sm' },
    default: { emoji: 'text-2xl', label: 'text-sm', streak: 'text-base' },
    lg: { emoji: 'text-4xl', label: 'text-base', streak: 'text-xl' },
  }

  const sizes = sizeConfig[size] || sizeConfig.default

  return (
    <div className={`rounded-xl border ${phase.bg} ${phase.border} p-3 ${className}`}>
      <div className="flex items-center gap-3">
        {/* Phase emoji */}
        <div className={`${sizes.emoji} flex-shrink-0`}>
          {phase.emoji}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Phase label & streak count */}
          <div className="flex items-center justify-between">
            <span className={`font-bold ${phase.color} ${sizes.label}`}>
              {phase.label}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-orange-400">🔥</span>
              <span className={`font-bold ${phase.color} ${sizes.streak}`}>
                {streak}
              </span>
              <span className="text-gray-500 text-xs">days</span>
            </div>
          </div>

          {/* Progress to next phase */}
          {showProgress && nextPhase && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">
                  Next: {nextPhase.emoji} {nextPhase.label}
                </span>
                <span className={`${phase.color} font-medium`}>
                  {daysToNext} day{daysToNext !== 1 ? 's' : ''} left
                </span>
              </div>
              <div className="h-1.5 bg-charcoal-500/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${phase.bg.replace('/20', '/60')}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Max phase reached */}
          {showProgress && !nextPhase && (
            <p className="text-xs text-gray-500 mt-1">
              Maximum phase reached! You are a legend. 👑
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Compact inline streak badge
 */
export function StreakBadge({ streak = 0, className = '' }) {
  const phase = getStreakPhase(streak)

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border ${phase.bg} ${phase.border} ${className}`}>
      <span className="text-sm">{phase.emoji}</span>
      <span className={`text-xs font-bold ${phase.color}`}>{phase.label}</span>
      <span className="text-gray-500 text-xs">•</span>
      <span className="text-orange-400 text-xs">🔥 {streak}</span>
    </div>
  )
}

export default StreakIdentity
