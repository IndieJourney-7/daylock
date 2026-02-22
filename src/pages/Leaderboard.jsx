/**
 * Leaderboard Page
 * Global and room-specific rankings with real user data
 */

import { useState } from 'react'
import { Card } from '../components/ui'
import { useAuth } from '../contexts'
import { useLeaderboard } from '../hooks'
import { LeaderboardTable } from '../components/social'
import { leaderboardService } from '../lib/leaderboard'

export default function Leaderboard() {
  const { user } = useAuth()
  const [sortBy, setSortBy] = useState('discipline_score')
  const [period, setPeriod] = useState('all')

  const { data: entries, loading, error } = useLeaderboard({ sortBy, period })

  // Find current user's entry
  const myEntry = entries?.find(e => e.user_id === user?.id)
  const totalUsers = entries?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Leaderboard</h1>
        <p className="text-gray-400 text-sm">
          {totalUsers} user{totalUsers !== 1 ? 's' : ''} ranked
          {myEntry ? ` — You're #${myEntry.rank}` : ''}
        </p>
      </div>

      {/* Your Rank Card */}
      {myEntry && (
        <Card className="p-4 bg-green-500/5 border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                {myEntry.avatar_url ? (
                  <img src={myEntry.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="text-green-400 font-bold">{(myEntry.display_name || '?')[0]?.toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Your Rank: #{myEntry.rank}</p>
                <p className="text-gray-500 text-xs">
                  {myEntry.total_approved || 0} approved • {myEntry.attendance_rate || 0}% rate • 🔥 {myEntry.current_streak || 0} streak
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-green-400 text-lg font-bold">{myEntry.discipline_score || 0}</p>
              <p className="text-gray-600 text-xs">score</p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Sort */}
        <div className="flex bg-charcoal-500/30 rounded-lg p-0.5">
          {leaderboardService.SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sortBy === opt.value
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Period */}
        <div className="flex bg-charcoal-500/30 rounded-lg p-0.5">
          {leaderboardService.PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === opt.value
                  ? 'bg-charcoal-400/50 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 bg-charcoal-600 rounded-xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/20 p-4 text-red-400 text-sm text-center">
          Failed to load leaderboard: {error}
        </Card>
      )}

      {/* Table */}
      {!loading && !error && (
        <LeaderboardTable
          entries={entries || []}
          currentUserId={user?.id}
          sortBy={sortBy}
        />
      )}
    </div>
  )
}
