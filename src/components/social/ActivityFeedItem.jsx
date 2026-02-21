/**
 * ActivityFeedItem Component
 * Single event in the social activity timeline
 */

import { feedService } from '../../lib/feed'

function ActivityFeedItem({ event }) {
  if (!event) return null

  const config = feedService.getEventConfig(event.event_type)
  const timeAgo = feedService.getRelativeTime(event.created_at)

  return (
    <div className="flex gap-3 py-3 border-b border-charcoal-400/10 last:border-0">
      {/* Event icon */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-charcoal-500/30 flex items-center justify-center text-sm">
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="text-white font-medium">{event.actor_name || 'Someone'}</span>
          {' '}
          <span className="text-gray-400">{event.title}</span>
        </p>
        {event.description && (
          <p className="text-gray-500 text-xs mt-0.5">{event.description}</p>
        )}
        <p className="text-gray-600 text-[10px] mt-1">{timeAgo}</p>
      </div>
    </div>
  )
}

/**
 * ActivityFeed Component
 * List of feed items with optional load-more
 */
export function ActivityFeed({ events = [], loading = false, hasMore = false, onLoadMore, emptyMessage = 'No activity yet' }) {
  if (!loading && events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div>
      {events.map(event => (
        <ActivityFeedItem key={event.id} event={event} />
      ))}

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin w-5 h-5 border-2 border-gray-500 border-t-white rounded-full mx-auto" />
        </div>
      )}

      {!loading && hasMore && (
        <button
          onClick={onLoadMore}
          className="w-full py-2.5 text-gray-400 text-xs hover:text-white transition-colors"
        >
          Load more...
        </button>
      )}
    </div>
  )
}

export default ActivityFeedItem
