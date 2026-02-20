/**
 * WeeklySummary - Weekly attendance stats with mini bar chart
 * Phase 2: Admin Authority System
 */

import { computeWeeklyStats, computeTrend, getAverageQuality, getQualityLevel } from '../../lib/adminAuthority'

// ============ TREND BADGE ============

export function TrendBadge({ trend }) {
  if (!trend) return null
  
  const config = {
    improving: { icon: '↑', color: 'text-accent', bg: 'bg-accent/10', label: 'Improving' },
    declining: { icon: '↓', color: 'text-red-400', bg: 'bg-red-500/10', label: 'Declining' },
    stable: { icon: '→', color: 'text-gray-400', bg: 'bg-charcoal-500/30', label: 'Stable' }
  }
  
  const c = config[trend.direction] || config.stable
  
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${c.bg} ${c.color}`}>
      <span>{c.icon}</span>
      <span>{c.label}</span>
      {trend.change !== 0 && <span>({trend.change > 0 ? '+' : ''}{trend.change}%)</span>}
    </span>
  )
}

// ============ WEEKLY BAR ============

function WeeklyBar({ week, maxRate = 100 }) {
  const barHeight = Math.max(4, (week.rate / maxRate) * 60)
  const weekLabel = new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="w-full max-w-[28px] flex flex-col items-center justify-end h-16">
        <span className="text-[9px] text-gray-500 mb-0.5">{week.rate}%</span>
        <div
          className={`w-full rounded-t transition-all ${
            week.rate >= 80 ? 'bg-accent' : week.rate >= 50 ? 'bg-yellow-400' : 'bg-red-400'
          }`}
          style={{ height: `${barHeight}px` }}
        />
      </div>
      <span className="text-[9px] text-gray-600 whitespace-nowrap">{weekLabel}</span>
    </div>
  )
}

// ============ WEEKLY SUMMARY (Full) ============

export function WeeklySummary({ records = [] }) {
  const weeklyStats = computeWeeklyStats(records)
  const trend = computeTrend(weeklyStats)
  const avgQuality = getAverageQuality(records)
  
  if (weeklyStats.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 text-center">
        <p className="text-gray-500 text-xs">Not enough data for weekly summary</p>
      </div>
    )
  }
  
  const thisWeek = weeklyStats[0]
  const displayWeeks = weeklyStats.slice(0, 6)

  return (
    <div className="p-4 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Weekly Summary</p>
        <TrendBadge trend={trend} />
      </div>
      
      {/* This week stats */}
      {thisWeek && (
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-accent font-bold text-lg">{thisWeek.approved}</p>
            <p className="text-gray-500 text-[10px]">Approved</p>
          </div>
          <div className="text-center">
            <p className="text-red-400 font-bold text-lg">{thisWeek.missed}</p>
            <p className="text-gray-500 text-[10px]">Missed</p>
          </div>
          <div className="text-center">
            <p className="text-yellow-400 font-bold text-lg">{thisWeek.rejected}</p>
            <p className="text-gray-500 text-[10px]">Rejected</p>
          </div>
          <div className="text-center">
            <p className={`font-bold text-lg ${thisWeek.rate >= 80 ? 'text-accent' : thisWeek.rate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {thisWeek.rate}%
            </p>
            <p className="text-gray-500 text-[10px]">Rate</p>
          </div>
        </div>
      )}
      
      {/* Weekly bars */}
      {displayWeeks.length > 1 && (
        <div>
          <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Past Weeks</p>
          <div className="flex gap-1 items-end justify-center">
            {[...displayWeeks].reverse().map((week, i) => (
              <WeeklyBar key={i} week={week} />
            ))}
          </div>
        </div>
      )}
      
      {/* Quality average */}
      {avgQuality !== null && (
        <div className="flex items-center justify-between pt-2 border-t border-charcoal-400/10">
          <p className="text-gray-500 text-xs">Avg Quality</p>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-bold ${getQualityLevel(Math.round(avgQuality)).color}`}>
              {avgQuality}
            </span>
            <span className="text-gray-500 text-xs">/ 5</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ WEEKLY SUMMARY COMPACT ============

export function WeeklySummaryCompact({ records = [] }) {
  const weeklyStats = computeWeeklyStats(records)
  const trend = computeTrend(weeklyStats)
  
  if (weeklyStats.length === 0) return null
  
  const thisWeek = weeklyStats[0]

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-charcoal-500/10">
      <div className="flex-1 min-w-0">
        <p className="text-gray-400 text-[10px] uppercase tracking-wider">This Week</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-sm font-bold ${thisWeek.rate >= 80 ? 'text-accent' : thisWeek.rate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {thisWeek.rate}%
          </span>
          <span className="text-gray-600 text-xs">
            {thisWeek.approved}/{thisWeek.total}
          </span>
        </div>
      </div>
      <TrendBadge trend={trend} />
    </div>
  )
}

export default WeeklySummary
