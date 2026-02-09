/**
 * Authentication Service
 * Handles user auth with Supabase
 * Profile operations go through backend API
 */

import { supabase } from './supabase'
import { api } from './api'

export const authService = {
  /**
   * Sign up with email and password
   */
  async signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    })
    if (error) throw error
    return data
  },

  /**
   * Sign in with email and password
   */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  /**
   * Sign in with OAuth (Google, GitHub, etc.)
   * Always redirects to /login, which handles post-auth navigation
   */
  async signInWithOAuth(provider, redirectPath = null) {
    // Check if we're on admin join page with a pending invite
    const pendingCode = localStorage.getItem('pending_invite_code')
    const isAdminJoin = window.location.pathname.includes('/admin/join')
    
    // Save the destination for after OAuth completes
    if (redirectPath) {
      localStorage.setItem('auth_redirect', redirectPath)
    } else if (pendingCode || isAdminJoin) {
      localStorage.setItem('auth_redirect', `/admin/join${pendingCode ? `?code=${pendingCode}` : ''}`)
    }
    
    // Always redirect to /login - it will handle post-auth navigation
    const redirectTo = `${window.location.origin}/login`
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo
      }
    })
    if (error) throw error
    return data
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  /**
   * Get current user
   */
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  /**
   * Get user profile via API
   */
  async getProfile() {
    try {
      return await api.profile.get()
    } catch (error) {
      console.error('Failed to get profile:', error)
      return null
    }
  },

  /**
   * Ensure user profile exists - creates via API
   */
  async ensureProfile(user) {
    if (!user?.id) return null
    
    // Get name from Google OAuth metadata
    const metadata = user.user_metadata || {}
    const googleName = metadata.full_name || metadata.name || null
    const avatarUrl = metadata.avatar_url || metadata.picture || null
    
    console.log('ensureProfile - Google metadata:', { googleName, avatarUrl })
    
    try {
      // Call API to ensure profile exists
      const profile = await api.profile.ensure({
        email: user.email,
        name: googleName || user.email?.split('@')[0] || 'User',
        avatar_url: avatarUrl
      })
      return profile
    } catch (error) {
      console.error('Error ensuring profile:', error)
      // Return a minimal fallback profile
      return { 
        id: user.id, 
        email: user.email, 
        name: googleName || user.email?.split('@')[0] || 'User' 
      }
    }
  },

  /**
   * Update user profile via API
   */
  async updateProfile(userId, updates) {
    return api.profile.update(updates)
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },

  /**
   * Send password reset email
   */
  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
    return data
  }
}

export default authService
