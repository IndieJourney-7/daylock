/**
 * Feed Page
 * Social activity timeline across user's rooms
 */

import { useActivityFeed } from '../hooks'
import { ActivityFeed } from '../components/social/ActivityFeedItem'
import { PushPrompt, InstallPrompt } from '../components/social'
import { Card } from '../components/ui'

export default function Feed() {
  const { events, loading, hasMore, fetchMore, refetch } = useActivityFeed()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Activity Feed</h1>
          <p className="text-gray-400 text-sm">What's happening in your rooms</p>
        </div>
        <button
          onClick={refetch}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Prompts */}
      <div className="space-y-3">
        <PushPrompt />
        <InstallPrompt />
      </div>

      {/* Feed */}
      <Card className="bg-charcoal-500/20 border-charcoal-400/20 p-4">
        <ActivityFeed
          events={events}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={fetchMore}
          emptyMessage="No activity yet. Start attending your rooms to see the feed!"
        />
      </Card>
    </div>
  )
}
