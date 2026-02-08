/**
 * Protected Route Component
 * Wraps routes that require authentication
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts'

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  
  console.log('ProtectedRoute:', location.pathname, '- loading:', loading, 'user:', user?.id)
  
  // Show loading only during initial auth check
  if (loading) {
    console.log('ProtectedRoute: Showing loading spinner')
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Not logged in - redirect to login
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to /login')
    // Save the attempted location for redirect after login
    localStorage.setItem('auth_redirect', location.pathname)
    return <Navigate to="/login" replace />
  }
  
  // User must have valid id and email
  if (!user.id || !user.email) {
    console.log('ProtectedRoute: User missing id/email, redirecting to /login')
    return <Navigate to="/login" replace />
  }
  
  console.log('ProtectedRoute: Rendering protected content')
  return children
}

/**
 * Public Route Component
 * Redirects to dashboard if already logged in
 */
export function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

export default ProtectedRoute
