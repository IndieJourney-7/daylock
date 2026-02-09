/**
 * Admin Room Detail
 * Manage room rules, timings, and approve user's proof of work
 * Connected to real database - no hardcoded data
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, Badge, Icon, Button } from '../../components/ui'
import { useAuth } from '../../contexts'
import { useRoomRules, usePendingProofs } from '../../hooks'
import { invitesService, roomsService, attendanceService } from '../../lib'

const TABS = [
  { id: 'proofs', label: 'Proofs', icon: 'camera' },
  { id: 'rules', label: 'Rules', icon: 'list' },
  { id: 'history', label: 'History', icon: 'calendar' },
]

// Loading skeleton
function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-charcoal-600 rounded-lg" />
        <div className="flex-1">
          <div className="h-6 w-32 bg-charcoal-600 rounded mb-2" />
          <div className="h-4 w-24 bg-charcoal-600 rounded" />
        </div>
      </div>
      <div className="h-20 bg-charcoal-600 rounded-xl" />
      <div className="grid grid-cols-4 gap-2">
        {[1,2,3,4].map(i => <div key={i} className="h-16 bg-charcoal-600 rounded-xl" />)}
      </div>
      <div className="h-64 bg-charcoal-600 rounded-xl" />
    </div>
  )
}

function AdminRoomDetail() {
  const { roomId } = useParams()
  const { user } = useAuth()
  
  // State
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('proofs')
  const [newRule, setNewRule] = useState('')
  const [timeWindow, setTimeWindow] = useState({ start: '06:00', end: '07:00' })
  const [isSaving, setIsSaving] = useState(false)
  const [selectedProof, setSelectedProof] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [attendanceHistory, setAttendanceHistory] = useState([])
  
  // Hooks for real data
  const { rules, loading: rulesLoading, addRule: addRuleToDb, toggleRule: toggleRuleInDb, deleteRule: deleteRuleFromDb } = useRoomRules(roomId)
  const { proofs, loading: proofsLoading, approve, reject, refetch: refetchProofs } = usePendingProofs(roomId)
  
  // Fetch room details
  useEffect(() => {
    async function fetchRoom() {
      if (!user?.id || !roomId) return
      
      setLoading(true)
      try {
        // Get all admin rooms and find this one (now includes stats)
        const adminRooms = await invitesService.getAdminRooms(user.id)
        const foundRoom = adminRooms.find(r => r.id === roomId)
        
        if (!foundRoom) {
          setError('Room not found or you do not have access')
          return
        }
        
        setRoom(foundRoom)
        
        setTimeWindow({
          start: foundRoom.time_start || '06:00',
          end: foundRoom.time_end || '07:00'
        })
        
        // Fetch attendance history
        const history = await attendanceService.getUserAttendance(roomId, foundRoom.user_id)
        setAttendanceHistory(history || [])
        
      } catch (err) {
        console.error('Failed to fetch room:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRoom()
  }, [user?.id, roomId])
  
  // Add new rule
  const handleAddRule = async () => {
    if (!newRule.trim()) return
    try {
      await addRuleToDb(newRule.trim())
      setNewRule('')
    } catch (err) {
      console.error('Failed to add rule:', err)
    }
  }
  
  // Toggle rule
  const handleToggleRule = async (ruleId) => {
    try {
      await toggleRuleInDb(ruleId)
    } catch (err) {
      console.error('Failed to toggle rule:', err)
    }
  }
  
  // Delete rule
  const handleDeleteRule = async (ruleId) => {
    try {
      await deleteRuleFromDb(ruleId)
    } catch (err) {
      console.error('Failed to delete rule:', err)
    }
  }
  
  // Approve proof
  const handleApprove = async (proofId) => {
    try {
      await approve(proofId, user.id)
      setSelectedProof(null)
    } catch (err) {
      console.error('Failed to approve:', err)
    }
  }
  
  // Reject proof
  const handleReject = async (proofId) => {
    try {
      await reject(proofId, user.id, rejectReason)
      setSelectedProof(null)
      setRejectReason('')
    } catch (err) {
      console.error('Failed to reject:', err)
    }
  }
  
  // Save time window
  const handleSave = async () => {
    if (!room) return
    setIsSaving(true)
    try {
      await roomsService.updateRoom(roomId, {
        time_start: timeWindow.start,
        time_end: timeWindow.end
      })
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setIsSaving(false)
    }
  }
  
  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
  
  // Format time
  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  
  if (loading || rulesLoading) {
    return <DetailSkeleton />
  }
  
  if (error || !room) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center py-12">
          <Icon name="close" className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white font-medium mb-2">Error</h2>
          <p className="text-gray-500 text-sm mb-4">{error || 'Room not found'}</p>
          <Link to="/admin/rooms">
            <Button variant="secondary">Back to Rooms</Button>
          </Link>
        </Card>
      </div>
    )
  }
  
  const isOpen = roomsService.isRoomOpen(room)
  const userName = room.assignedBy?.name || room.user?.name || 'User'
  const userEmail = room.assignedBy?.email || room.user?.email || ''
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase()
  
  // Calculate stats from history
  const stats = {
    streak: room.stats?.streak || 0,
    attendanceRate: room.stats?.attendanceRate || 0,
    approvedDays: attendanceHistory.filter(a => a.status === 'approved').length,
    rejectedDays: attendanceHistory.filter(a => a.status === 'rejected').length,
    missedDays: attendanceHistory.filter(a => a.status === 'missed').length,
    totalDays: attendanceHistory.length
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            to="/admin/rooms" 
            className="p-2 rounded-lg bg-charcoal-500/50 hover:bg-charcoal-500 transition-colors"
          >
            <Icon name="chevronLeft" className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex items-center gap-3">
            <div className={`
              w-14 h-14 rounded-xl flex items-center justify-center text-2xl
              ${isOpen ? 'bg-accent/20' : 'bg-charcoal-500/50'}
            `}>
              {room.emoji || '🚪'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{room.name}</h1>
                <Badge variant={isOpen ? 'open' : 'locked'}>
                  {isOpen ? 'open' : 'locked'}
                </Badge>
              </div>
              <p className="text-gray-500 text-sm">
                {room.time_start || timeWindow.start} - {room.time_end || timeWindow.end}
              </p>
            </div>
          </div>
        </div>
        
        {proofs.length > 0 && (
          <Badge variant="warning">
            {proofs.length} pending
          </Badge>
        )}
      </div>
      
      {/* Assigned By Card - Real User Data */}
      <Card padding="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-charcoal-500 flex items-center justify-center">
              <span className="text-sm text-gray-400">{userInitials}</span>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Assigned by</p>
              <p className="text-white font-medium">{userName}</p>
              <p className="text-gray-500 text-xs">{userEmail}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs">Invite Code</p>
            <p className="text-accent font-mono text-sm">{room.inviteCode || 'N/A'}</p>
          </div>
        </div>
      </Card>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="text-center py-3">
          <p className="text-accent text-xl font-bold">{stats.streak}</p>
          <p className="text-gray-500 text-[10px]">Streak</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-white text-xl font-bold">{stats.attendanceRate}%</p>
          <p className="text-gray-500 text-[10px]">Rate</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-accent text-xl font-bold">{stats.approvedDays}</p>
          <p className="text-gray-500 text-[10px]">Approved</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-red-400 text-xl font-bold">{stats.missedDays}</p>
          <p className="text-gray-500 text-[10px]">Missed</p>
        </Card>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-charcoal-500/30">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm
              transition-all duration-200 relative
              ${activeTab === tab.id
                ? 'bg-charcoal-500 text-white'
                : 'text-gray-500 hover:text-gray-300'
              }
            `}
          >
            <Icon name={tab.icon} className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.id === 'proofs' && proofs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 text-charcoal-900 text-xs flex items-center justify-center font-bold">
                {proofs.length}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Proofs Tab - Approve/Reject */}
      {activeTab === 'proofs' && (
        <div className="space-y-4">
          {proofs.length > 0 ? (
            <>
              <p className="text-gray-400 text-sm">
                Review proof uploads from {userName}
              </p>
              
              {proofs.map((proof) => (
                <Card key={proof.id} className="border-yellow-500/20">
                  <div className="space-y-4">
                    {/* Proof Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{formatDate(proof.date)}</p>
                        <p className="text-gray-500 text-xs">
                          Uploaded at {formatTime(proof.submitted_at)}
                        </p>
                      </div>
                      <Badge variant="warning">Pending Review</Badge>
                    </div>
                    
                    {/* Proof Image */}
                    {proof.proof_url ? (
                      <div className="aspect-video rounded-lg overflow-hidden bg-charcoal-500/50">
                        <img 
                          src={proof.proof_url} 
                          alt="Proof" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video rounded-lg bg-charcoal-500/50 flex items-center justify-center border border-charcoal-500">
                        <div className="text-center">
                          <Icon name="camera" className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No image available</p>
                        </div>
                      </div>
                    )}
                    
                    {/* User Note */}
                    {proof.note && (
                      <div className="p-3 rounded-lg bg-charcoal-500/30">
                        <p className="text-gray-400 text-xs mb-1">User's Note:</p>
                        <p className="text-white text-sm">{proof.note}</p>
                      </div>
                    )}
                    
                    {/* Active Rules */}
                    {rules.filter(r => r.enabled).length > 0 && (
                      <div className="p-3 rounded-lg bg-charcoal-500/20">
                        <p className="text-gray-400 text-xs mb-2">Check against rules:</p>
                        <div className="space-y-1">
                          {rules.filter(r => r.enabled).map(rule => (
                            <div key={rule.id} className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded border border-gray-500 flex items-center justify-center">
                                <Icon name="check" className="w-2.5 h-2.5 text-gray-500" />
                              </div>
                              <span className="text-gray-400 text-xs">{rule.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => handleApprove(proof.id)}
                        className="flex-1"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Icon name="check" className="w-4 h-4" />
                          Approve
                        </span>
                      </Button>
                      <Button 
                        variant="danger"
                        onClick={() => setSelectedProof(proof.id)}
                        className="flex-1"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Icon name="close" className="w-4 h-4" />
                          Reject
                        </span>
                      </Button>
                    </div>
                    
                    {/* Reject Reason Input */}
                    {selectedProof === proof.id && (
                      <div className="space-y-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <input
                          type="text"
                          placeholder="Reason for rejection (optional)..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg bg-charcoal-500/50 border border-charcoal-500
                                   text-white placeholder-gray-500 text-sm
                                   focus:outline-none focus:border-red-500/50"
                        />
                        <div className="flex gap-2">
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => handleReject(proof.id)}
                            className="flex-1"
                          >
                            Confirm Reject
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => {
                              setSelectedProof(null)
                              setRejectReason('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </>
          ) : (
            <Card className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="check" className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-white font-medium mb-2">All caught up!</h3>
              <p className="text-gray-500 text-sm">
                No pending proofs to review from {userName}
              </p>
            </Card>
          )}
        </div>
      )}
      
      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Time Window */}
          <Card>
            <h3 className="text-white font-medium mb-4">Time Window</h3>
            <p className="text-gray-500 text-sm mb-4">
              Set when {userName.split(' ')[0]} can mark attendance
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-500 text-xs mb-2">Opens At</label>
                <input
                  type="time"
                  value={timeWindow.start}
                  onChange={(e) => setTimeWindow({ ...timeWindow, start: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-charcoal-500/50 border border-charcoal-500
                           text-white text-sm focus:outline-none focus:border-accent/50"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs mb-2">Closes At</label>
                <input
                  type="time"
                  value={timeWindow.end}
                  onChange={(e) => setTimeWindow({ ...timeWindow, end: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-charcoal-500/50 border border-charcoal-500
                           text-white text-sm focus:outline-none focus:border-accent/50"
                />
              </div>
            </div>
          </Card>
          
          {/* Rules List */}
          <Card>
            <h3 className="text-white font-medium mb-2">Attendance Rules</h3>
            <p className="text-gray-500 text-sm mb-4">
              Rules {userName.split(' ')[0]} must follow when uploading proof
            </p>
            
            <div className="space-y-3 mb-4">
              {rules.map(rule => (
                <div 
                  key={rule.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border transition-all
                    ${rule.enabled 
                      ? 'bg-charcoal-500/50 border-charcoal-500' 
                      : 'bg-charcoal-700/30 border-charcoal-600/50'
                    }
                  `}
                >
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                      transition-all
                      ${rule.enabled 
                        ? 'bg-accent border-accent' 
                        : 'border-gray-500 hover:border-gray-400'
                      }
                    `}
                  >
                    {rule.enabled && (
                      <Icon name="check" className="w-3 h-3 text-charcoal-900" />
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${rule.enabled ? 'text-white' : 'text-gray-500'}`}>
                    {rule.text}
                  </span>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Icon name="close" className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {rules.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No rules added yet. Add rules for {userName.split(' ')[0]} to follow.
                </p>
              )}
            </div>
            
            {/* Add New Rule */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a new rule..."
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddRule()}
                className="flex-1 px-4 py-2.5 rounded-lg bg-charcoal-500/50 border border-charcoal-500
                         text-white placeholder-gray-500 text-sm
                         focus:outline-none focus:border-accent/50"
              />
              <Button onClick={handleAddRule} size="sm" disabled={!newRule.trim()}>
                Add
              </Button>
            </div>
          </Card>
          
          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            className="w-full"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
      
      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-white font-medium mb-4">Attendance History for {userName}</h3>
            
            {attendanceHistory.length > 0 ? (
              <div className="space-y-2">
                {attendanceHistory.slice(0, 20).map((entry) => (
                  <div 
                    key={entry.id}
                    className={`
                      flex items-center justify-between p-3 rounded-lg
                      ${entry.status === 'approved' 
                        ? 'bg-accent/10 border border-accent/20' 
                        : entry.status === 'rejected'
                        ? 'bg-yellow-500/10 border border-yellow-500/20'
                        : entry.status === 'pending_review'
                        ? 'bg-blue-500/10 border border-blue-500/20'
                        : 'bg-red-500/10 border border-red-500/20'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${entry.status === 'approved' ? 'bg-accent/20' 
                          : entry.status === 'rejected' ? 'bg-yellow-500/20'
                          : entry.status === 'pending_review' ? 'bg-blue-500/20'
                          : 'bg-red-500/20'
                        }
                      `}>
                        <Icon 
                          name={entry.status === 'approved' ? 'check' 
                            : entry.status === 'rejected' ? 'close' 
                            : entry.status === 'pending_review' ? 'history'
                            : 'close'}
                          className={`w-5 h-5 ${
                            entry.status === 'approved' ? 'text-accent' 
                            : entry.status === 'rejected' ? 'text-yellow-400'
                            : entry.status === 'pending_review' ? 'text-blue-400'
                            : 'text-red-400'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-white font-medium">{formatDate(entry.date)}</p>
                        <p className="text-gray-500 text-xs">
                          {entry.status === 'approved' 
                            ? `Approved${entry.submitted_at ? ` - ${formatTime(entry.submitted_at)}` : ''}`
                            : entry.status === 'rejected'
                            ? `Rejected${entry.rejection_reason ? `: ${entry.rejection_reason}` : ''}`
                            : entry.status === 'pending_review'
                            ? 'Waiting for review'
                            : 'No proof uploaded'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {entry.proof_url && (
                        <a 
                          href={entry.proof_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-charcoal-500/50 hover:bg-charcoal-500 transition-colors"
                        >
                          <Icon name="camera" className="w-4 h-4 text-gray-400" />
                        </a>
                      )}
                      <Badge variant={
                        entry.status === 'approved' ? 'success' 
                        : entry.status === 'rejected' ? 'warning' 
                        : entry.status === 'pending_review' ? 'info'
                        : 'danger'
                      }>
                        {entry.status === 'approved' ? 'Approved' 
                         : entry.status === 'rejected' ? 'Rejected' 
                         : entry.status === 'pending_review' ? 'Pending'
                         : 'Missed'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">
                No attendance history yet for {userName}
              </p>
            )}
          </Card>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <Card className="text-center py-3">
              <p className="text-white font-bold">{stats.totalDays}</p>
              <p className="text-gray-500 text-xs">Total</p>
            </Card>
            <Card className="text-center py-3">
              <p className="text-accent font-bold">{stats.approvedDays}</p>
              <p className="text-gray-500 text-xs">Approved</p>
            </Card>
            <Card className="text-center py-3">
              <p className="text-yellow-400 font-bold">{stats.rejectedDays}</p>
              <p className="text-gray-500 text-xs">Rejected</p>
            </Card>
            <Card className="text-center py-3">
              <p className="text-red-400 font-bold">{stats.missedDays}</p>
              <p className="text-gray-500 text-xs">Missed</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRoomDetail
