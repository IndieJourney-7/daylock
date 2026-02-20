/**
 * DisciplineScore Component
 * Shows user's discipline points with level indicator
 * Points are calculated from attendance history
 */

import { calculateDisciplinePoints, getDisciplineLevel, POINT_VALUES } from '../../lib/pressure'

/**
 * Full discipline score card
 */
function DisciplineScore({ attendanceRecords = [], streak = 0, showBreakdown = false, className = '' }) {
  const score = calculateDisciplinePoints(attendanceRecords, streak)

  // Progress to next level
  const levelThresholds = [0, 10, 50, 150, 300, 500]
  const currentThreshold = levelThresholds[score.level] || 0
  const nextThreshold = levelThresholds[score.level + 1] || score.total + 100
  const levelProgress = Math.min(100, Math.round(
    ((score.total - currentThreshold) / (nextThreshold - currentThreshold)) * 100
  ))

  return (
    <div className={`rounded-xl border border-charcoal-400/20 bg-charcoal-500/20 p-4 ${className}`}>
      {/* Score header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-white font-semibold text-sm">Discipline Score</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${score.levelColor}`}>{score.total}</span>
          <span className="text-gray-500 text-xs">pts</span>
        </div>
      </div>

      {/* Level indicator */}
      <div className="flex items-center justify-between text-xs mb-2">
        <span className={`font-medium ${score.levelColor}`}>
          Lv.{score.level} — {score.title}
        </span>
        {score.level < 5 && (
          <span className="text-gray-500">
            {nextThreshold - score.total} pts to next level
          </span>
        )}
      </div>

      {/* Level progress bar */}
      <div className="h-2 bg-charcoal-500/50 rounded-full overflow-hidden mb-3">
        <div 
          className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-accent to-accent/60"
          style={{ width: `${levelProgress}%` }}
        />
      </div>

      {/* Points breakdown */}
      {showBreakdown && (
        <div className="space-y-1.5 pt-3 border-t border-charcoal-400/10">
          <div className="text-xs text-gray-500 font-medium mb-2">Points Breakdown</div>
          <BreakdownRow icon="✅" label="Approved days" value={score.breakdown.approved} positive />
          <BreakdownRow icon="🔥" label="Streak bonus" value={score.breakdown.streakBonus} positive />
          <BreakdownRow icon="❌" label="Missed days" value={score.breakdown.missed} />
          <BreakdownRow icon="🚫" label="Rejected proofs" value={score.breakdown.rejected} />
          {score.breakdown.reflections > 0 && (
            <BreakdownRow icon="📝" label="Reflections" value={score.breakdown.reflections} positive />
          )}
        </div>
      )}
    </div>
  )
}

function BreakdownRow({ icon, label, value, positive = false }) {
  if (value === 0) return null
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-400">
        {icon} {label}
      </span>
      <span className={positive ? 'text-green-400' : 'text-red-400'}>
        {positive ? '+' : ''}{value}
      </span>
    </div>
  )
}

/**
 * Compact inline discipline score
 */
export function DisciplineScoreBadge({ attendanceRecords = [], streak = 0, className = '' }) {
  const score = calculateDisciplinePoints(attendanceRecords, streak)

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border border-charcoal-400/20 bg-charcoal-500/20 ${className}`}>
      <span className="text-sm">⚡</span>
      <span className={`text-xs font-bold ${score.levelColor}`}>{score.total}</span>
      <span className="text-gray-500 text-[10px]">pts</span>
    </div>
  )
}

export default DisciplineScore
