/**
 * LeaderboardTable Component
 * Ranked list of users with score, streak, and attendance rate
 */

import { leaderboardService } from '../../lib/leaderboard'

function LeaderboardTable({ entries = [], currentUserId = null, compact = false }) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No leaderboard data yet. Start attending to rank up!
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-charcoal-400/20">
      <table className="w-full">
        <thead>
          <tr className="bg-charcoal-500/30 text-gray-400 text-xs uppercase tracking-wider">
            <th className="text-left py-2.5 px-3 w-12">#</th>
            <th className="text-left py-2.5 px-3">User</th>
            {!compact && <th className="text-center py-2.5 px-3">Streak</th>}
            <th className="text-right py-2.5 px-3">Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const rank = index + 1
            const badge = leaderboardService.getRankBadge(rank)
            const isCurrentUser = entry.user_id === currentUserId

            return (
              <tr
                key={entry.user_id || index}
                className={`border-t border-charcoal-400/10 transition-colors ${
                  isCurrentUser
                    ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
                    : 'hover:bg-charcoal-500/20'
                }`}
              >
                {/* Rank */}
                <td className="py-2.5 px-3">
                  <span className={`font-bold text-sm ${badge.color}`}>
                    {badge.icon || badge.label}
                  </span>
                </td>

                {/* User */}
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-charcoal-500/40 flex items-center justify-center text-xs font-medium text-gray-400">
                      {(entry.display_name || '?')[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-blue-400' : 'text-white'}`}>
                        {entry.display_name || 'Anonymous'}
                        {isCurrentUser && <span className="text-[10px] ml-1 text-blue-400">(you)</span>}
                      </p>
                      {!compact && (
                        <p className="text-[10px] text-gray-500">
                          {entry.total_days || 0} days • {Math.round((entry.attendance_rate || 0) * 100)}% rate
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Streak */}
                {!compact && (
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-orange-400 font-medium text-sm">
                      🔥 {entry.current_streak || 0}
                    </span>
                  </td>
                )}

                {/* Score */}
                <td className="py-2.5 px-3 text-right">
                  <span className="text-white font-bold text-sm">
                    {entry.discipline_score || 0}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default LeaderboardTable
