/**
 * Leaderboard Page
 * Global and room-specific rankings
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Leaderboard</h1>
        <p className="text-gray-400 text-sm">See how you rank against the community</p>
      </div>

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
                  ? 'bg-blue-600 text-white'
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
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-gray-500 border-t-white rounded-full" />
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
        />
      )}
    </div>
  )
}
