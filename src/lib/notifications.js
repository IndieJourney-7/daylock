/**
 * Notifications Service (Frontend)
 * Client-side helpers for notifications and push subscriptions
 */

import { api } from './api'

export const notificationsService = {
  /** Get notifications */
  async getAll(options = {}) {
    return api.notifications.list(options)
  },

  /** Get unread count */
  async getUnreadCount() {
    const result = await api.notifications.getUnreadCount()
    return result.count || 0
  },

  /** Mark a notification as read */
  async markRead(notificationId) {
    return api.notifications.markRead(notificationId)
  },

  /** Mark all as read */
  async markAllRead() {
    return api.notifications.markAllRead()
  },

  /** Get notification preferences */
  async getPreferences() {
    return api.notifications.getPreferences()
  },

  /** Update notification preferences */
  async updatePreferences(prefs) {
    return api.notifications.updatePreferences(prefs)
  },

  // ============ PUSH NOTIFICATIONS ============

  /** Check if push notifications are supported */
  isPushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  },

  /** Get current permission status */
  getPermissionStatus() {
    if (!('Notification' in window)) return 'unsupported'
    return Notification.permission // 'default', 'granted', 'denied'
  },

  /** Request push permission and subscribe */
  async subscribeToPush() {
    if (!this.isPushSupported()) {
      throw new Error('Push notifications not supported')
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Push notification permission denied')
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready

    // Get VAPID public key from env
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) {
      console.warn('VAPID public key not configured')
      return null
    }

    // Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    })

    // Send to server
    const subJson = subscription.toJSON()
    await api.notifications.subscribePush({
      endpoint: subJson.endpoint,
      keys: subJson.keys
    })

    return subscription
  },

  /** Unsubscribe from push */
  async unsubscribeFromPush() {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await api.notifications.unsubscribePush(subscription.endpoint)
      await subscription.unsubscribe()
    }
  },

  /** Check if currently subscribed */
  async isPushSubscribed() {
    if (!this.isPushSupported()) return false
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      return !!subscription
    } catch {
      return false
    }
  },

  /** Notification type icons */
  getTypeIcon(type) {
    const icons = {
      achievement: '🏆',
      streak_risk: '⚠️',
      room_opening: '🔓',
      room_closing: '🔒',
      proof_reviewed: '✅',
      challenge_update: '⚔️',
      warning: '🚨',
      general: '📢'
    }
    return icons[type] || '🔔'
  }
}

/**
 * Helper: Convert VAPID base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
