/**
 * AchievementCard Component
 * Displays a single achievement badge with unlock status
 */

import { achievementsService } from '../../lib/achievements'

function AchievementCard({ achievement, earned = false, earnedAt = null, compact = false }) {
  const tierColor = achievementsService.getTierColor(achievement?.tier || 'bronze')

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg p-2 transition-all ${
          earned
            ? 'bg-charcoal-500/30 border border-charcoal-400/20'
            : 'bg-charcoal-500/10 border border-charcoal-400/10 opacity-50'
        }`}
        title={achievement?.description}
      >
        <span className="text-xl">{achievement?.icon || '🏆'}</span>
        <div className="min-w-0">
          <p className={`text-xs font-medium truncate ${earned ? 'text-white' : 'text-gray-500'}`}>
            {achievement?.name}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        earned
          ? 'bg-charcoal-500/30 border-charcoal-400/30 hover:border-charcoal-400/50'
          : 'bg-charcoal-500/10 border-charcoal-400/10 opacity-40 grayscale'
      }`}
    >
      {/* Icon + tier badge */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{achievement?.icon || '🏆'}</span>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${tierColor}`}>
          {achievement?.tier}
        </span>
      </div>

      {/* Name */}
      <h4 className={`font-semibold text-sm mb-1 ${earned ? 'text-white' : 'text-gray-500'}`}>
        {achievement?.name}
      </h4>

      {/* Description */}
      <p className="text-gray-500 text-xs leading-relaxed">
        {achievement?.description}
      </p>

      {/* Points + unlock info */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-charcoal-400/10">
        <span className="text-xs text-gray-500">
          +{achievement?.points || 0} pts
        </span>
        {earned && earnedAt && (
          <span className="text-[10px] text-green-400">
            ✓ {new Date(earnedAt).toLocaleDateString()}
          </span>
        )}
        {!earned && (
          <span className="text-[10px] text-gray-600">Locked</span>
        )}
      </div>
    </div>
  )
}

export default AchievementCard
