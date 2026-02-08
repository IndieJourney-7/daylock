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
    
    // Get initial session
    const initAuth = async () => {
      try {
        // Wait a tick for Supabase to process URL hash if present
        if (window.location.hash?.includes('access_token')) {
          console.log('OAuth callback detected, waiting for session...')
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        const session = await authService.getSession()
        console.log('Initial session:', session?.user?.id || 'none')
        if (!isMounted) return
        
        if (session?.user) {
          setUser(session.user)
          // Set loading false immediately - profile loads in background
          if (!initCompleted.current) {
            initCompleted.current = true
            setLoading(false)
          }
          
          // Load profile in background
          try {
            const userProfile = await authService.ensureProfile(session.user)
            if (isMounted) setProfile(userProfile)
          } catch (profileErr) {
            const isAbort = profileErr?.name === 'AbortError' || 
                           profileErr?.message?.includes('aborted')
            if (!isAbort) {
              console.error('Profile fetch error:', profileErr)
            }
          }
        } else {
          // No session - done loading
          if (!initCompleted.current) {
            initCompleted.current = true
            setLoading(false)
          }
        }
      } catch (err) {
        const isAbort = err?.name === 'AbortError' || 
                       err?.message?.includes('aborted')
        if (isAbort) return
        
        console.error('Auth init error:', err)
        if (isMounted) setError(err.message)
        
        // Still complete init on error
        if (!initCompleted.current) {
          initCompleted.current = true
          setLoading(false)
        }
      }
    }

    // Timeout fallback - don't hang forever (reduced to 3s)
    const timeout = setTimeout(() => {
      if (isMounted && !initCompleted.current) {
        console.warn('Auth init timeout - proceeding without session')
        initCompleted.current = true
        setLoading(false)
      }
    }, 3000)

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        console.log('Auth event:', event, 'user:', session?.user?.id || 'none')
        
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          setUser(session.user)
          setLoading(false) // User exists, stop loading
          
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
        } else {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )

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
