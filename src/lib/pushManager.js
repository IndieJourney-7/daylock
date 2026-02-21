/**
 * Push Subscription Manager (Frontend)
 * 
 * Handles the full Web Push subscription lifecycle:
 * 1. Fetches VAPID public key from backend
 * 2. Requests notification permission
 * 3. Subscribes to push via the service worker
 * 4. Sends the subscription to the backend for storage
 * 
 * This enables notifications even when the PWA is closed.
 */

import { api } from './api'

/**
 * Convert a base64 URL-safe string to a Uint8Array (required for applicationServerKey)
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export const pushManager = {
  /**
   * Check if push is supported in this browser
   */
  isSupported() {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  },

  /**
   * Get current notification permission
   */
  getPermission() {
    if (!this.isSupported()) return 'unsupported'
    return Notification.permission
  },

  /**
   * Get the existing push subscription (if any) from the service worker
   */
  async getExistingSubscription() {
    if (!this.isSupported()) return null
    try {
      const registration = await navigator.serviceWorker.ready
      return await registration.pushManager.getSubscription()
    } catch {
      return null
    }
  },

  /**
   * Full subscribe flow:
   * 1. Request notification permission
   * 2. Get VAPID key from backend
   * 3. Subscribe with service worker
   * 4. Send subscription to backend
   * 
   * @returns {{ success: boolean, subscription?: PushSubscription, error?: string }}
   */
  async subscribe() {
    if (!this.isSupported()) {
      return { success: false, error: 'Push notifications not supported in this browser' }
    }

    try {
      // Step 1: Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        return { success: false, error: 'Notification permission denied' }
      }

      // Step 2: Get VAPID public key from backend
      const { publicKey } = await api.notifications.getVapidKey()
      if (!publicKey) {
        return { success: false, error: 'Push not configured on server' }
      }

      // Step 3: Subscribe via service worker
      const registration = await navigator.serviceWorker.ready
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        })
      }

      // Step 4: Send subscription to backend
      const subJSON = subscription.toJSON()
      await api.notifications.subscribePush({
        endpoint: subJSON.endpoint,
        keys: subJSON.keys,
        userAgent: navigator.userAgent
      })

      return { success: true, subscription }
    } catch (err) {
      console.error('Push subscribe error:', err)
      return { success: false, error: err.message || 'Failed to subscribe' }
    }
  },

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    try {
      const subscription = await this.getExistingSubscription()
      if (subscription) {
        // Tell backend to remove
        await api.notifications.unsubscribePush(subscription.endpoint)
        // Unsubscribe locally
        await subscription.unsubscribe()
      }
      return { success: true }
    } catch (err) {
      console.error('Push unsubscribe error:', err)
      return { success: false, error: err.message }
    }
  },

  /**
   * Check if user is currently subscribed to push
   */
  async isSubscribed() {
    const sub = await this.getExistingSubscription()
    return !!sub
  }
}
