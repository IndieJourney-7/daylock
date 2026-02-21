/**
 * Challenges Page
 * Create and participate in friend competitions
 */

import { useState } from 'react'
import { Card, Button } from '../components/ui'
import { useAuth } from '../contexts'
import { useChallenges } from '../hooks'
import { ChallengeCard } from '../components/social'
import { challengesService } from '../lib/challenges'

function CreateChallengeModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('streak')
  const [targetDays, setTargetDays] = useState(7)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      await onCreate({ title: title.trim(), description: description.trim(), type, targetDays })
      onClose()
    } catch (err) {
      console.error('Create challenge failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-charcoal-600 border border-charcoal-400/30 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-white text-lg font-bold mb-4">Create Challenge</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1 block">Challenge Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., 7-Day Streak Battle"
              className="w-full bg-charcoal-500/50 border border-charcoal-400/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500/50"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1 block">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's this challenge about?"
              rows={2}
              className="w-full bg-charcoal-500/50 border border-charcoal-400/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500/50 resize-none"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-gray-400 text-xs font-medium mb-2 block">Challenge Type</label>
            <div className="grid grid-cols-1 gap-2">
              {challengesService.CHALLENGE_TYPES.map(ct => (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => setType(ct.value)}
                  className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                    type === ct.value
                      ? 'border-green-500/50 bg-green-500/10 text-white'
                      : 'border-charcoal-400/20 bg-charcoal-500/20 text-gray-400 hover:border-charcoal-400/40'
                  }`}
                >
                  <span className="font-medium">{ct.label}</span>
                  <span className="text-xs text-gray-500 ml-2">{ct.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-gray-400 text-xs font-medium mb-2 block">Duration (days)</label>
            <div className="flex gap-2 mb-2">
              {[7, 14, 21, 30].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setTargetDays(d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    targetDays === d && ![7, 14, 21, 30].includes(targetDays) === false
                      ? 'bg-green-600 text-white'
                      : 'bg-charcoal-500/30 text-gray-400 hover:text-white'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">or custom:</span>
              <input
                type="number"
                min={1}
                max={365}
                value={targetDays}
                onChange={e => setTargetDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
                className="w-20 bg-charcoal-500/50 border border-charcoal-400/20 rounded-lg px-3 py-1.5 text-white text-sm text-center focus:outline-none focus:border-green-500/50"
              />
              <span className="text-gray-500 text-xs">days</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-charcoal-500/30 hover:bg-charcoal-500/50 text-gray-400 py-2.5 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Challenges() {
  const { user } = useAuth()
  const { challenges, loading, error, refetch, joinChallenge, leaveChallenge, logDay } = useChallenges()
  const [showCreate, setShowCreate] = useState(false)

  const handleCreate = async (data) => {
    await challengesService.create(data)
    refetch()
  }

  const active = challenges.filter(c => c.status === 'active')
  const completed = challenges.filter(c => c.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Challenges</h1>
          <p className="text-gray-400 text-sm">Compete with friends to build better habits</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Challenge
        </button>
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
          Failed to load challenges: {error}
        </Card>
      )}

      {/* Active Challenges */}
      {!loading && active.length > 0 && (
        <div>
          <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="text-green-400">●</span> Active Challenges
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {active.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                currentUserId={user?.id}
                onJoin={joinChallenge}
                onLeave={leaveChallenge}
                onLogDay={logDay}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Challenges */}
      {!loading && completed.length > 0 && (
        <div>
          <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="text-gray-500">●</span> Completed
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completed.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                currentUserId={user?.id}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && challenges.length === 0 && (
        <div className="text-center py-16">
          <span className="text-4xl block mb-3">⚔️</span>
          <h3 className="text-white font-semibold mb-1">No Challenges Yet</h3>
          <p className="text-gray-500 text-sm mb-4">Create your first challenge and invite friends to compete</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            Create a Challenge
          </button>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateChallengeModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
