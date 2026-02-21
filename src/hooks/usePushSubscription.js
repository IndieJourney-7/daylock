/**
 * usePushSubscription Hook
 * 
 * Manages the Web Push subscription lifecycle.
 * Auto-subscribes when notification permission is granted.
 * Provides subscribe/unsubscribe functions and subscription status.
 */

import { useState, useEffect, useCallback } from 'react'
import { pushManager } from '../lib/pushManager'

export function usePushSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [permission, setPermission] = useState('default')
  const [error, setError] = useState(null)

  // Check initial state
  useEffect(() => {
    async function check() {
      if (!pushManager.isSupported()) {
        setPermission('unsupported')
        setIsLoading(false)
        return
      }

      setPermission(Notification.permission)
      const subscribed = await pushManager.isSubscribed()
      setIsSubscribed(subscribed)
      setIsLoading(false)
    }
    check()
  }, [])

  /**
   * Subscribe to push notifications
   * Handles permission request + VAPID subscription + backend registration
   */
  const subscribe = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const result = await pushManager.subscribe()
    
    if (result.success) {
      setIsSubscribed(true)
      setPermission('granted')
    } else {
      setError(result.error)
      // Update permission status in case it was denied
      if (pushManager.isSupported()) {
        setPermission(Notification.permission)
      }
    }

    setIsLoading(false)
    return result
  }, [])

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const result = await pushManager.unsubscribe()
    
    if (result.success) {
      setIsSubscribed(false)
    } else {
      setError(result.error)
    }

    setIsLoading(false)
    return result
  }, [])

  return {
    isSupported: pushManager.isSupported(),
    isSubscribed,
    isLoading,
    permission,
    error,
    subscribe,
    unsubscribe
  }
}

export default usePushSubscription
