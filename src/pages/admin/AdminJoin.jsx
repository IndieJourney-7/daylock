/**
 * Admin Join Page
 * Admin enters invite code, signs in with Google, then accepts room management
 * 
 * Flow:
 * 1. Enter invite code → verify it's valid
 * 2. If not logged in → sign in with Google
 * 3. Accept invite → link admin account to room
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Card, Button, Icon } from '../../components/ui'
import { useAuth } from '../../contexts'
import { invitesService } from '../../lib'

function AdminJoin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const codeFromUrl = searchParams.get('code') || ''
  
  const { user, loading: authLoading, signInWithOAuth } = useAuth()
  
  const [inviteCode, setInviteCode] = useState(codeFromUrl)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState(null)
  const [roomInfo, setRoomInfo] = useState(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  
  // Store invite code in localStorage for OAuth callback
  useEffect(() => {
    if (roomInfo) {
      localStorage.setItem('pending_invite_code', roomInfo.invite_code)
    }
  }, [roomInfo])
  
  // Check for pending invite after OAuth callback
  useEffect(() => {
    const checkPendingInvite = async () => {
      const pendingCode = localStorage.getItem('pending_invite_code')
      if (user && pendingCode && !roomInfo) {
        try {
          const invite = await invitesService.getInviteByCode(pendingCode)
          if (invite && invite.status === 'pending') {
            setRoomInfo(invite)
            setInviteCode(pendingCode)
          }
        } catch (err) {
          console.error('Error fetching pending invite:', err)
        }
      }
    }
    
    if (!authLoading) {
      checkPendingInvite()
    }
  }, [user, authLoading, roomInfo])
  
  // Verify invite code
  const handleVerifyCode = async () => {
    if (!inviteCode.trim()) return
    
    setIsVerifying(true)
    setError(null)
    
    try {
      const invite = await invitesService.getInviteByCode(inviteCode.trim())
      
      if (!invite) {
        setError('Invalid invite code. Please check and try again.')
        return
      }
      
      if (invite.status === 'accepted') {
        setError('This invite has already been used.')
        return
      }
      
      if (invite.status === 'revoked') {
        setError('This invite has been revoked.')
        return
      }
      
      setRoomInfo(invite)
    } catch (err) {
      setError(err.message || 'Failed to verify code')
    } finally {
      setIsVerifying(false)
    }
  }
  
  // Sign in with Google
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signInWithOAuth('google')
    } catch (err) {
      console.error('Sign in error:', err)
      setError(err.message || 'Failed to sign in')
      setIsSigningIn(false)
    }
  }
  
  // Accept the invite
  const handleAcceptInvite = async () => {
    if (!user || !roomInfo) return
    
    setIsAccepting(true)
    setError(null)
    
    try {
      await invitesService.acceptInvite(roomInfo.invite_code, user.id)
      localStorage.removeItem('pending_invite_code')
      navigate('/admin', { 
        state: { success: `You are now managing ${roomInfo.room?.name || 'the room'}!` }
      })
    } catch (err) {
      setError(err.message || 'Failed to accept invite')
      setIsAccepting(false)
    }
  }
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-charcoal-900 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-charcoal-900 font-bold text-sm">D</span>
          </div>
          <span className="text-white font-semibold">Daylock</span>
          <span className="text-gray-500 text-sm ml-2">Admin</span>
        </Link>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-accent text-2xl font-bold">A</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Join as Admin</h1>
            <p className="text-gray-500 text-sm mt-2">
              {!roomInfo 
                ? 'Enter your invite code to manage a room'
                : user 
                  ? 'Review and accept the invite'
                  : 'Sign in to continue'
              }
            </p>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2">
                <Icon name="close" className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}
          
          {!roomInfo ? (
            /* Step 1: Enter Code Form */
            <Card>
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">Invite Code</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value.toUpperCase())
                    setError(null)
                  }}
                  placeholder="e.g., GYM-X4K9"
                  className="w-full bg-charcoal-500/30 border border-charcoal-400/20 rounded-lg px-4 py-4 text-white text-center text-xl font-mono tracking-wider placeholder-gray-600 focus:outline-none focus:border-accent/50 transition-colors"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                />
              </div>
              
              <Button 
                size="full"
                disabled={!inviteCode.trim() || isVerifying}
                onClick={handleVerifyCode}
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Verifying...
                  </span>
                ) : (
                  'Verify Code'
                )}
              </Button>
              
              <p className="text-gray-600 text-xs text-center mt-4">
                Don't have a code? Ask the room owner to share one with you.
              </p>
            </Card>
          ) : !user ? (
            /* Step 2: Sign in with Google */
            <Card>
              {/* Room Preview */}
              <div className="text-center mb-6 pb-6 border-b border-charcoal-400/10">
                <div className="w-16 h-16 rounded-xl bg-accent/20 flex items-center justify-center text-3xl mx-auto mb-4">
                  {roomInfo.room?.emoji || '🚪'}
                </div>
                <h2 className="text-xl font-bold text-white">{roomInfo.room?.name || 'Room'}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {roomInfo.room?.time_start} - {roomInfo.room?.time_end}
                </p>
                <p className="text-gray-600 text-xs mt-2">
                  Invited by {roomInfo.room?.user?.name || 'user'}
                </p>
              </div>
              
              {/* Sign in prompt */}
              <div className="text-center mb-6">
                <Icon name="lock" className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  Sign in with your Google account to accept this invite
                </p>
              </div>
              
              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-charcoal-900 font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningIn ? (
                  <>
                    <div className="w-5 h-5 border-2 border-charcoal-400/30 border-t-charcoal-900 rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
              
              {/* Cancel */}
              <button
                onClick={() => {
                  setRoomInfo(null)
                  localStorage.removeItem('pending_invite_code')
                }}
                className="w-full mt-3 text-gray-500 text-sm hover:text-gray-400 transition-colors"
              >
                Use different code
              </button>
            </Card>
          ) : (
            /* Step 3: Accept Invite */
            <Card>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-xl bg-accent/20 flex items-center justify-center text-3xl mx-auto mb-4">
                  {roomInfo.room?.emoji || '🚪'}
                </div>
                <h2 className="text-xl font-bold text-white">{roomInfo.room?.name || 'Room'}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {roomInfo.room?.time_start} - {roomInfo.room?.time_end}
                </p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-charcoal-500/30 rounded-lg">
                  <span className="text-gray-400 text-sm">Room Owner</span>
                  <span className="text-white text-sm font-medium">
                    {roomInfo.room?.user?.name || 'User'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-charcoal-500/30 rounded-lg">
                  <span className="text-gray-400 text-sm">Your Account</span>
                  <span className="text-white text-sm font-medium truncate max-w-[180px]">
                    {user.email}
                  </span>
                </div>
              </div>
              
              <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl mb-6">
                <p className="text-gray-300 text-sm">
                  <strong className="text-white">You will be able to:</strong>
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <Icon name="check" className="w-3 h-3 text-accent" />
                    Set room rules and requirements
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check" className="w-3 h-3 text-accent" />
                    Review and approve daily proofs
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check" className="w-3 h-3 text-accent" />
                    View user's attendance history
                  </li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="secondary"
                  onClick={() => {
                    setRoomInfo(null)
                    localStorage.removeItem('pending_invite_code')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAcceptInvite}
                  disabled={isAccepting}
                  className="flex-1"
                >
                  {isAccepting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Accepting...
                    </span>
                  ) : (
                    'Accept Invite'
                  )}
                </Button>
              </div>
            </Card>
          )}
          
          {/* Footer links */}
          <div className="text-center mt-6">
            {user ? (
              <button 
                onClick={() => navigate('/admin')}
                className="text-gray-500 text-sm hover:text-gray-400 transition-colors"
              >
                Go to <span className="text-accent">Admin Dashboard</span>
              </button>
            ) : (
              <Link 
                to="/login"
                className="text-gray-500 text-sm hover:text-gray-400 transition-colors"
              >
                Not an admin? <span className="text-accent">Sign in as user</span>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminJoin
