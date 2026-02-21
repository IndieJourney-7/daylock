/**
 * ChallengeCard Component
 * Shows a challenge with participants, progress, and actions
 */

import { challengesService } from '../../lib/challenges'

function ChallengeCard({ challenge, currentUserId, onJoin, onLeave, onLogDay, compact = false }) {
  if (!challenge) return null

  const participants = challenge.challenge_participants || []
  const myParticipation = participants.find(p => p.user_id === currentUserId)
  const isParticipant = !!myParticipation
  const statusBadge = challengesService.getStatusBadge(challenge.status)
  const daysLeft = challengesService.getDaysRemaining(challenge.end_date)
  const isActive = challenge.status === 'active'

  // Sort participants by completed days
  const sorted = [...participants]
    .filter(p => p.status === 'joined' || p.status === 'won' || p.status === 'completed')
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))

  if (compact) {
    return (
      <div className="rounded-xl border border-charcoal-400/20 bg-charcoal-500/20 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚔️</span>
            <span className="text-white font-medium text-sm truncate">{challenge.title}</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge.color}`}>
            {statusBadge.label}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{sorted.length} participants</span>
          {isActive && <span>{daysLeft}d left</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-charcoal-400/20 bg-charcoal-500/20 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">⚔️</span>
            <h3 className="text-white font-semibold">{challenge.title}</h3>
          </div>
          {challenge.description && (
            <p className="text-gray-500 text-xs ml-8">{challenge.description}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${statusBadge.color}`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div className="bg-charcoal-500/30 rounded-lg p-2">
          <p className="text-white font-bold text-sm">{sorted.length}</p>
          <p className="text-gray-500 text-[10px]">Players</p>
        </div>
        <div className="bg-charcoal-500/30 rounded-lg p-2">
          <p className="text-white font-bold text-sm">{challenge.goal || '—'}</p>
          <p className="text-gray-500 text-[10px]">Target Days</p>
        </div>
        <div className="bg-charcoal-500/30 rounded-lg p-2">
          <p className={`font-bold text-sm ${daysLeft <= 3 ? 'text-red-400' : 'text-white'}`}>
            {isActive ? daysLeft : '—'}
          </p>
          <p className="text-gray-500 text-[10px]">Days Left</p>
        </div>
      </div>

      {/* Participants leaderboard */}
      {sorted.length > 0 && (
        <div className="mb-4">
          <p className="text-gray-400 text-xs font-medium mb-2">Standings</p>
          <div className="space-y-1.5">
            {sorted.slice(0, 5).map((p, i) => {
              const isMe = p.user_id === currentUserId
                  const progressPct = challengesService.getProgress(p.progress, challenge.goal)
              return (
                <div
                  key={p.user_id}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                    isMe ? 'bg-green-500/10 border border-green-500/20' : 'bg-charcoal-500/20'
                  }`}
                >
                  <span className="text-gray-500 w-4 text-center font-medium">{i + 1}</span>
                  <span className={`flex-1 truncate ${isMe ? 'text-green-400 font-medium' : 'text-white'}`}>
                    {p.display_name || (isMe ? 'You' : `Player ${i + 1}`)}
                  </span>
                  <span className="text-orange-400">🔥{p.current_streak || 0}</span>
                  <div className="w-16 h-1.5 bg-charcoal-500/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-gray-400 w-10 text-right">{p.progress || 0}d</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {isActive && (
        <div className="flex gap-2">
          {isParticipant ? (
            <>
              <button
                onClick={() => onLogDay?.(challenge.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                ✓ Log Today
              </button>
              <button
                onClick={() => onLeave?.(challenge.id)}
                className="px-3 bg-charcoal-500/30 hover:bg-charcoal-500/50 text-gray-400 text-sm py-2 rounded-lg transition-colors"
              >
                Leave
              </button>
            </>
          ) : (
            <button
              onClick={() => onJoin?.(challenge.id)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              Join Challenge
            </button>
          )}
        </div>
      )}

      {/* Winner display */}
      {challenge.status === 'completed' && (() => {
        const winner = participants.find(p => p.status === 'won')
        if (!winner) return null
        return (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
            <span className="text-lg">👑</span>
            <p className="text-yellow-400 font-medium text-sm">
              {winner.user_id === currentUserId ? 'You won!' : 'Challenge Complete'}
            </p>
          </div>
        )
      })()}
    </div>
  )
}

export default ChallengeCard
