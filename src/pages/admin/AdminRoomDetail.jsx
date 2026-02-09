/**
 * Admin Room Detail
 * Full room management: toggles, proof gallery, rules, time window, history
 * 4 Tabs: Overview, Proofs, Rules, History
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, Badge, Icon, Button } from '../../components/ui'
import { useAuth } from '../../contexts'
import { useRoomRules, usePendingProofs } from '../../hooks'
import { invitesService, roomsService, attendanceService } from '../../lib'

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
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
      <div className="grid grid-cols-4 gap-2">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-charcoal-600 rounded-xl" />)}
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
  const [activeTab, setActiveTab] = useState('overview')
  const [newRule, setNewRule] = useState('')
  const [timeWindow, setTimeWindow] = useState({ start: '06:00', end: '07:00' })
  const [isSaving, setIsSaving] = useState(false)
  const [isTogglingPause, setIsTogglingPause] = useState(false)
  const [isTogglingLate, setIsTogglingLate] = useState(false)
  const [selectedProof, setSelectedProof] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [lightboxImage, setLightboxImage] = useState(null)
  
  // Hooks
  const { rules, loading: rulesLoading, addRule: addRuleToDb, toggleRule: toggleRuleInDb, deleteRule: deleteRuleFromDb } = useRoomRules(roomId)
  const { proofs, loading: proofsLoading, approve, reject, refetch: refetchProofs } = usePendingProofs(roomId)
  
  // Fetch room details
  useEffect(() => {
    async function fetchRoom() {
      if (!user?.id || !roomId) return
      setLoading(true)
      try {
        const adminRooms = await invitesService.getAdminRooms(user.id)
        const foundRoom = adminRooms.find(r => r.id === roomId)
        if (!foundRoom) { setError('Room not found or no access'); return }
        
        setRoom(foundRoom)
        setTimeWindow({ start: foundRoom.time_start || '06:00', end: foundRoom.time_end || '07:00' })
        
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
  
  // Handlers
  const handleAddRule = async () => {
    if (!newRule.trim()) return
    try { await addRuleToDb(newRule.trim()); setNewRule('') } catch (err) { console.error('Failed to add rule:', err) }
  }
  
  const handleToggleRule = async (ruleId) => {
    try { await toggleRuleInDb(ruleId) } catch (err) { console.error('Failed to toggle rule:', err) }
  }
  
  const handleDeleteRule = async (ruleId) => {
    try { await deleteRuleFromDb(ruleId) } catch (err) { console.error('Failed to delete rule:', err) }
  }
  
  const handleApprove = async (proofId) => {
    try { await approve(proofId, user.id); setSelectedProof(null) } catch (err) { console.error('Approve failed:', err) }
  }
  
  const handleReject = async (proofId) => {
    try { await reject(proofId, user.id, rejectReason); setSelectedProof(null); setRejectReason('') } catch (err) { console.error('Reject failed:', err) }
  }
  
  const handleSaveTime = async () => {
    if (!room) return
    setIsSaving(true)
    try {
      const updated = await roomsService.adminUpdateRoom(roomId, { time_start: timeWindow.start, time_end: timeWindow.end })
      setRoom(prev => ({ ...prev, ...updated }))
    } catch (err) { console.error('Save failed:', err) }
    finally { setIsSaving(false) }
  }
  
  const handleTogglePause = async () => {
    setIsTogglingPause(true)
    try {
      const updated = await roomsService.toggleRoomPause(roomId)
      setRoom(prev => ({ ...prev, is_paused: updated.is_paused }))
    } catch (err) { console.error('Toggle pause failed:', err) }
    finally { setIsTogglingPause(false) }
  }
  
  const handleToggleLateUpload = async () => {
    setIsTogglingLate(true)
    try {
      const updated = await roomsService.toggleLateUpload(roomId)
      setRoom(prev => ({ ...prev, allow_late_upload: updated.allow_late_upload }))
    } catch (err) { console.error('Toggle late upload failed:', err) }
    finally { setIsTogglingLate(false) }
  }
  
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const formatTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''
  
  if (loading || rulesLoading) return <DetailSkeleton />
  
  if (error || !room) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <Icon name="alertCircle" className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white font-medium mb-2">Error</h2>
          <p className="text-gray-500 text-sm mb-4">{error || 'Room not found'}</p>
          <Link to="/admin/rooms"><Button variant="secondary">Back to Rooms</Button></Link>
        </div>
      </div>
    )
  }
  
  const isOpen = roomsService.isRoomOpen(room)
  const userName = room.assignedBy?.name || room.user?.name || 'User'
  const userEmail = room.assignedBy?.email || room.user?.email || ''
  const userAvatar = room.assignedBy?.avatar_url || room.user?.avatar_url
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase()
  
  const stats = {
    streak: room.stats?.streak || 0,
    attendanceRate: room.stats?.attendanceRate || 0,
    approvedDays: attendanceHistory.filter(a => a.status === 'approved').length,
    rejectedDays: attendanceHistory.filter(a => a.status === 'rejected').length,
    missedDays: attendanceHistory.filter(a => a.status === 'missed').length,
    totalDays: attendanceHistory.length
  }
  
  // Gallery: all proofs with images
  const allProofsWithImages = attendanceHistory.filter(a => a.proof_url)
  
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Icon name="close" className="w-6 h-6 text-white" />
          </button>
          <img src={lightboxImage} alt="Proof" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/rooms" className="p-2 rounded-lg bg-charcoal-500/30 hover:bg-charcoal-500/50 transition-colors">
          <Icon name="chevronLeft" className="w-5 h-5 text-gray-400" />
        </Link>
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center text-xl
          ${room.is_paused ? 'bg-orange-500/10 border border-orange-500/20' :
            isOpen ? 'bg-accent/10 border border-accent/20' : 'bg-charcoal-500/50 border border-charcoal-400/10'}
        `}>
          {room.is_paused ? <Icon name="pause" className="w-5 h-5 text-orange-400" /> : room.emoji || '📋'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white truncate">{room.name}</h1>
            {room.is_paused ? <Badge variant="paused" size="sm">Paused</Badge> :
             isOpen ? <Badge variant="open" size="sm">Open</Badge> : <Badge variant="locked" size="sm">Locked</Badge>}
          </div>
          <p className="text-gray-500 text-xs">{room.time_start} – {room.time_end}</p>
        </div>
        {proofs.length > 0 && (
          <Badge variant="warning">{proofs.length} pending</Badge>
        )}
      </div>
      
      {/* User info bar */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10">
        {userAvatar ? (
          <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-charcoal-500/50 flex items-center justify-center">
            <span className="text-xs text-gray-400">{userInitials}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{userName}</p>
          <p className="text-gray-500 text-xs truncate">{userEmail}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-accent font-mono text-xs">{room.invite_code || 'N/A'}</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium
              transition-all duration-200 relative
              ${activeTab === tab.id
                ? 'bg-charcoal-500/80 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'}
            `}
          >
            <Icon name={tab.icon} className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.id === 'proofs' && proofs.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-yellow-500 text-charcoal-900 text-[10px] flex items-center justify-center font-bold">
                {proofs.length}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* ========== OVERVIEW TAB ========== */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-3 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 text-center">
              <p className="text-accent text-xl font-bold">{stats.streak}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">Streak</p>
            </div>
            <div className="p-3 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 text-center">
              <p className="text-white text-xl font-bold">{stats.attendanceRate}%</p>
              <p className="text-gray-500 text-[10px] mt-0.5">Rate</p>
            </div>
            <div className="p-3 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 text-center">
              <p className="text-accent text-xl font-bold">{stats.approvedDays}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">Approved</p>
            </div>
            <div className="p-3 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 text-center">
              <p className="text-red-400 text-xl font-bold">{stats.missedDays}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">Missed</p>
            </div>
          </div>
          
          {/* Room Controls */}
          <div className="p-4 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 space-y-4">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Room Controls</p>
            
            {/* Pause Room Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${room.is_paused ? 'bg-orange-500/10' : 'bg-charcoal-500/30'}`}>
                  <Icon name={room.is_paused ? 'pause' : 'play'} className={`w-4 h-4 ${room.is_paused ? 'text-orange-400' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Pause Room</p>
                  <p className="text-gray-500 text-xs">Temporarily stop attendance tracking</p>
                </div>
              </div>
              <button
                onClick={handleTogglePause}
                disabled={isTogglingPause}
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${room.is_paused ? 'bg-orange-500' : 'bg-charcoal-500'}
                  ${isTogglingPause ? 'opacity-50' : ''}
                `}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${room.is_paused ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            
            {/* Allow Late Upload Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${room.allow_late_upload ? 'bg-blue-500/10' : 'bg-charcoal-500/30'}`}>
                  <Icon name="upload" className={`w-4 h-4 ${room.allow_late_upload ? 'text-blue-400' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Allow Late Upload</p>
                  <p className="text-gray-500 text-xs">Let user upload proof after time window</p>
                </div>
              </div>
              <button
                onClick={handleToggleLateUpload}
                disabled={isTogglingLate}
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${room.allow_late_upload ? 'bg-accent' : 'bg-charcoal-500'}
                  ${isTogglingLate ? 'opacity-50' : ''}
                `}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${room.allow_late_upload ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
          
          {/* Time Window */}
          <div className="p-4 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Time Window</p>
              <button
                onClick={handleSaveTime}
                disabled={isSaving || (timeWindow.start === room.time_start && timeWindow.end === room.time_end)}
                className={`
                  text-xs font-medium px-3 py-1 rounded-lg transition-colors
                  ${(timeWindow.start !== room.time_start || timeWindow.end !== room.time_end)
                    ? 'bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20'
                    : 'text-gray-600 cursor-not-allowed'}
                `}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 text-xs mb-1.5">Opens At</label>
                <input
                  type="time"
                  value={timeWindow.start}
                  onChange={(e) => setTimeWindow({ ...timeWindow, start: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-charcoal-500/30 border border-charcoal-400/10 text-white text-sm focus:outline-none focus:border-accent/30"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs mb-1.5">Closes At</label>
                <input
                  type="time"
                  value={timeWindow.end}
                  onChange={(e) => setTimeWindow({ ...timeWindow, end: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-charcoal-500/30 border border-charcoal-400/10 text-white text-sm focus:outline-none focus:border-accent/30"
                />
              </div>
            </div>
          </div>
          
          {/* Quick rules count */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <Icon name="list" className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{rules.filter(r => r.enabled).length} Active Rules</p>
              <p className="text-gray-500 text-xs">{rules.length} total rules defined</p>
            </div>
            <button onClick={() => setActiveTab('rules')} className="text-accent text-xs hover:underline">Manage</button>
          </div>
          
          {/* Proof Gallery Preview */}
          {allProofsWithImages.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Recent Proofs</p>
                <button onClick={() => setActiveTab('history')} className="text-accent text-xs hover:underline">View All</button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {allProofsWithImages.slice(0, 8).map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setLightboxImage(entry.proof_url)}
                    className="aspect-square rounded-xl overflow-hidden bg-charcoal-500/30 border border-charcoal-400/10 hover:border-accent/30 transition-colors relative group"
                  >
                    <img src={entry.proof_url} alt="Proof" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Icon name="eye" className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-1 left-1">
                      <span className={`
                        px-1.5 py-0.5 rounded text-[9px] font-medium
                        ${entry.status === 'approved' ? 'bg-accent/80 text-charcoal-900' : 
                          entry.status === 'rejected' ? 'bg-red-500/80 text-white' : 'bg-yellow-500/80 text-charcoal-900'}
                      `}>
                        {entry.status === 'approved' ? '✓' : entry.status === 'rejected' ? '✗' : '?'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* ========== PROOFS TAB ========== */}
      {activeTab === 'proofs' && (
        <div className="space-y-4">
          {proofs.length > 0 ? (
            <>
              <p className="text-gray-400 text-xs">
                {proofs.length} proof{proofs.length > 1 ? 's' : ''} from {userName} waiting for review
              </p>
              
              {proofs.map((proof) => (
                <div key={proof.id} className="p-4 rounded-xl bg-charcoal-500/20 border border-yellow-500/15 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{formatDate(proof.date)}</p>
                      <p className="text-gray-500 text-xs">Uploaded {formatTime(proof.submitted_at)}</p>
                    </div>
                    <Badge variant="warning" size="sm">Pending</Badge>
                  </div>
                  
                  {/* Proof Image */}
                  {proof.proof_url ? (
                    <button 
                      onClick={() => setLightboxImage(proof.proof_url)}
                      className="w-full aspect-video rounded-xl overflow-hidden bg-charcoal-500/30 hover:opacity-90 transition-opacity"
                    >
                      <img src={proof.proof_url} alt="Proof" className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <div className="aspect-video rounded-xl bg-charcoal-500/30 border border-charcoal-400/10 flex items-center justify-center">
                      <div className="text-center">
                        <Icon name="image" className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 text-xs">No image</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Note */}
                  {proof.note && (
                    <div className="p-3 rounded-lg bg-charcoal-500/30">
                      <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Note</p>
                      <p className="text-white text-sm">{proof.note}</p>
                    </div>
                  )}
                  
                  {/* Rules checklist */}
                  {rules.filter(r => r.enabled).length > 0 && (
                    <div className="p-3 rounded-lg bg-charcoal-500/10 border border-charcoal-400/5">
                      <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-2">Check Against Rules</p>
                      <div className="space-y-1.5">
                        {rules.filter(r => r.enabled).map(rule => (
                          <div key={rule.id} className="flex items-start gap-2">
                            <div className="w-4 h-4 mt-0.5 rounded border border-gray-500/50 flex items-center justify-center flex-shrink-0">
                              <Icon name="check" className="w-2.5 h-2.5 text-gray-600" />
                            </div>
                            <span className="text-gray-400 text-xs leading-relaxed">{rule.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button onClick={() => handleApprove(proof.id)} className="flex-1" size="sm">
                      <span className="flex items-center justify-center gap-1.5">
                        <Icon name="check" className="w-4 h-4" /> Approve
                      </span>
                    </Button>
                    <Button variant="danger" onClick={() => setSelectedProof(proof.id)} className="flex-1" size="sm">
                      <span className="flex items-center justify-center gap-1.5">
                        <Icon name="close" className="w-4 h-4" /> Reject
                      </span>
                    </Button>
                  </div>
                  
                  {/* Reject reason */}
                  {selectedProof === proof.id && (
                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15 space-y-2">
                      <input
                        type="text"
                        placeholder="Reason (optional)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-charcoal-500/30 border border-charcoal-400/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-500/30"
                      />
                      <div className="flex gap-2">
                        <Button variant="danger" size="sm" onClick={() => handleReject(proof.id)} className="flex-1">Confirm</Button>
                        <Button variant="secondary" size="sm" onClick={() => { setSelectedProof(null); setRejectReason('') }}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                <Icon name="check" className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-white font-medium mb-1">All caught up!</h3>
              <p className="text-gray-500 text-xs">No pending proofs from {userName}</p>
            </div>
          )}
        </div>
      )}
      
      {/* ========== RULES TAB ========== */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* Rules List */}
          <div className="space-y-2">
            {rules.map(rule => (
              <div 
                key={rule.id}
                className={`
                  flex items-center gap-3 p-3 rounded-xl transition-all
                  ${rule.enabled 
                    ? 'bg-charcoal-500/20 border border-charcoal-400/10' 
                    : 'bg-charcoal-700/10 border border-charcoal-600/5 opacity-60'}
                `}
              >
                <button
                  onClick={() => handleToggleRule(rule.id)}
                  className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${rule.enabled ? 'bg-accent border-accent' : 'border-gray-600 hover:border-gray-500'}
                  `}
                >
                  {rule.enabled && <Icon name="check" className="w-3 h-3 text-charcoal-900" />}
                </button>
                <span className={`flex-1 text-sm ${rule.enabled ? 'text-white' : 'text-gray-500'}`}>{rule.text}</span>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-1 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Icon name="close" className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            
            {rules.length === 0 && (
              <div className="text-center py-10">
                <Icon name="list" className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">No rules yet. Add rules for {userName.split(' ')[0]} to follow.</p>
              </div>
            )}
          </div>
          
          {/* Add Rule */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a new rule..."
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
              className="flex-1 px-3 py-2.5 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent/30"
            />
            <Button onClick={handleAddRule} size="sm" disabled={!newRule.trim()}>Add</Button>
          </div>
        </div>
      )}
      
      {/* ========== HISTORY TAB ========== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 text-center">
              <p className="text-white font-bold text-sm">{stats.totalDays}</p>
              <p className="text-gray-500 text-[10px]">Total</p>
            </div>
            <div className="p-2.5 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 text-center">
              <p className="text-accent font-bold text-sm">{stats.approvedDays}</p>
              <p className="text-gray-500 text-[10px]">Approved</p>
            </div>
            <div className="p-2.5 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 text-center">
              <p className="text-yellow-400 font-bold text-sm">{stats.rejectedDays}</p>
              <p className="text-gray-500 text-[10px]">Rejected</p>
            </div>
            <div className="p-2.5 rounded-xl bg-charcoal-500/20 border border-charcoal-400/10 text-center">
              <p className="text-red-400 font-bold text-sm">{stats.missedDays}</p>
              <p className="text-gray-500 text-[10px]">Missed</p>
            </div>
          </div>
          
          {/* Gallery view toggle */}
          {allProofsWithImages.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">Proof Gallery</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {allProofsWithImages.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setLightboxImage(entry.proof_url)}
                    className="aspect-square rounded-xl overflow-hidden bg-charcoal-500/30 border border-charcoal-400/10 hover:border-accent/30 transition-colors relative group"
                  >
                    <img src={entry.proof_url} alt="Proof" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                      <div className="w-full p-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-[10px]">{formatDate(entry.date)}</p>
                      </div>
                    </div>
                    <div className="absolute top-1 right-1">
                      <span className={`
                        w-3 h-3 rounded-full block
                        ${entry.status === 'approved' ? 'bg-accent' : entry.status === 'rejected' ? 'bg-red-400' : 'bg-yellow-400'}
                      `} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Timeline */}
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">Attendance Timeline</p>
            <div className="space-y-1.5">
              {attendanceHistory.slice(0, 30).map((entry) => {
                const statusColors = {
                  approved: { bg: 'bg-accent/5 border-accent/10', icon: 'check', iconColor: 'text-accent', label: 'Approved' },
                  rejected: { bg: 'bg-yellow-500/5 border-yellow-500/10', icon: 'close', iconColor: 'text-yellow-400', label: 'Rejected' },
                  pending_review: { bg: 'bg-blue-500/5 border-blue-500/10', icon: 'clock', iconColor: 'text-blue-400', label: 'Pending' },
                  missed: { bg: 'bg-red-500/5 border-red-500/10', icon: 'close', iconColor: 'text-red-400', label: 'Missed' },
                  waiting: { bg: 'bg-charcoal-500/20 border-charcoal-400/5', icon: 'clock', iconColor: 'text-gray-500', label: 'Waiting' }
                }
                const s = statusColors[entry.status] || statusColors.waiting
                
                return (
                  <div key={entry.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${s.bg}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                      <Icon name={s.icon} className={`w-4 h-4 ${s.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm">{formatDate(entry.date)}</p>
                      <p className="text-gray-500 text-xs truncate">
                        {entry.status === 'rejected' && entry.rejection_reason ? entry.rejection_reason :
                         entry.submitted_at ? `Submitted ${formatTime(entry.submitted_at)}` : s.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {entry.proof_url && (
                        <button
                          onClick={() => setLightboxImage(entry.proof_url)}
                          className="p-1.5 rounded-lg bg-charcoal-500/30 hover:bg-charcoal-500/50 transition-colors"
                        >
                          <Icon name="image" className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      )}
                      <Badge variant={
                        entry.status === 'approved' ? 'success' : 
                        entry.status === 'rejected' ? 'warning' : 
                        entry.status === 'pending_review' ? 'info' : 'danger'
                      } size="sm">
                        {s.label}
                      </Badge>
                    </div>
                  </div>
                )
              })}
              
              {attendanceHistory.length === 0 && (
                <div className="text-center py-10">
                  <Icon name="calendar" className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs">No history yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRoomDetail
