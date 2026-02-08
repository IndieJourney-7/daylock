/**
 * Auth Context
 * Provides authentication state across the app
 */

import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase, authService } from '../lib'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const initCompleted = useRef(false)

  // Initialize auth state
  useEffect(() => {
    let isMounted = true

    // Listen for auth changes - this is the PRIMARY auth mechanism
    // onAuthStateChange fires INITIAL_SESSION immediately with cached session
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        console.log('Auth event:', event, 'user:', session?.user?.id || 'none')
        
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
          initCompleted.current = true
          return
        }
        
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user)
            
            // Mark init complete - user is authenticated
            if (!initCompleted.current) {
              initCompleted.current = true
              setLoading(false)
            }
            
            // Load profile in background
            try {
              const userProfile = await authService.ensureProfile(session.user)
              console.log('Profile loaded:', userProfile?.name)
              if (isMounted) setProfile(userProfile)
            } catch (err) {
              const isAbort = err?.name === 'AbortError' || 
                             err?.message?.includes('aborted')
              if (!isAbort) {
                console.error('Profile fetch error:', err)
              }
            }
          } else if (event === 'INITIAL_SESSION') {
            // No session on init - user is not logged in
            if (!initCompleted.current) {
              initCompleted.current = true
              setLoading(false)
            }
          }
        }
      }
    )

    // Timeout fallback - if onAuthStateChange never fires (shouldn't happen)
    const timeout = setTimeout(() => {
      if (isMounted && !initCompleted.current) {
        console.warn('Auth init timeout - proceeding without session')
        initCompleted.current = true
        setLoading(false)
      }
    }, 5000)

    return () => {
      isMounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  // Sign up
  const signUp = async (email, password, name) => {
    setLoading(true)
    setError(null)
    try {
      const data = await authService.signUp(email, password, name)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Sign in
  const signIn = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const data = await authService.signIn(email, password)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Sign in with OAuth
  const signInWithOAuth = async (provider, redirectPath = null) => {
    setError(null)
    try {
      await authService.signInWithOAuth(provider, redirectPath)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      await authService.signOut()
      // Clear all auth-related localStorage
      localStorage.removeItem('auth_redirect')
      localStorage.removeItem('pending_invite_code')
      setUser(null)
      setProfile(null)
      // Don't set loading - we want immediate redirect to login
    } catch (err) {
      setError(err.message)
    }
  }

  // Update profile
  const updateProfile = async (updates) => {
    if (!user) return
    try {
      const updated = await authService.updateProfile(user.id, updates)
      setProfile(updated)
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const value = {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
