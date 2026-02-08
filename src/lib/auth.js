/**
 * Authentication Service
 * Handles user auth with Supabase
 */

import { supabase } from './supabase'

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
   * Get user profile from profiles table
   */
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  },

  /**
   * Ensure user profile exists - creates or updates from OAuth user data
   */
  async ensureProfile(user) {
    if (!user?.id) return null
    
    // Get name from Google OAuth metadata
    const metadata = user.user_metadata || {}
    const googleName = metadata.full_name || metadata.name || null
    const avatarUrl = metadata.avatar_url || metadata.picture || null
    
    console.log('ensureProfile - Google metadata:', { googleName, avatarUrl, metadata })
    
    // Try to get existing profile
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (existing) {
      // Always update if we have a Google name and current name is missing/default
      const needsUpdate = googleName && (
        !existing.name || 
        existing.name === 'User' || 
        existing.name === user.email?.split('@')[0]
      )
      
      if (needsUpdate) {
        console.log('Updating profile name from:', existing.name, 'to:', googleName)
        const { data, error } = await supabase
          .from('profiles')
          .update({ 
            name: googleName, 
            avatar_url: avatarUrl || existing.avatar_url,
            updated_at: new Date().toISOString() 
          })
          .eq('id', user.id)
          .select()
          .single()
        if (!error) return data
      }
      return existing
    }
    
    // Create new profile
    const name = googleName || user.email?.split('@')[0] || 'User'
    console.log('Creating new profile with name:', name)
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        name,
        avatar_url: avatarUrl
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating profile:', error)
      // Return a minimal fallback profile
      return { id: user.id, email: user.email, name }
    }
    return data
  },

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
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
