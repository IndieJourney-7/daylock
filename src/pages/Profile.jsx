/**
 * Profile Page
 * User identity, stats, and achievements from database
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Avatar, Icon, Button } from '../components/ui'
import { AchievementCard } from '../components/social'
import { useAuth } from '../contexts'
import { useRooms, useUserHistory, useMyAchievements, useAchievementDefinitions } from '../hooks'

// Rank colors and thresholds
const getRankInfo = (score) => {
  if (score >= 1000) return { name: 'Legendary', color: 'text-yellow-400', bg: 'bg-yellow-400/20' }
  if (score >= 750) return { name: 'Disciplined', color: 'text-accent', bg: 'bg-accent/20' }
  if (score >= 500) return { name: 'Committed', color: 'text-blue-400', bg: 'bg-blue-400/20' }
  if (score >= 250) return { name: 'Developing', color: 'text-purple-400', bg: 'bg-purple-400/20' }
  return { name: 'Beginner', color: 'text-gray-400', bg: 'bg-gray-400/20' }
}

// Loading skeleton
function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-48 bg-charcoal-600 rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-charcoal-600 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function Profile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { data: rooms } = useRooms(user?.id)
  const { data: history, loading } = useUserHistory(user?.id)
  
  // Phase 3: Real achievements from database
  const { achievements: earnedAchievements } = useMyAchievements()
  const { data: allAchievements } = useAchievementDefinitions()
  
  // Calculate stats from real data
  const stats = useMemo(() => {
    const records = history || []
    const approved = records.filter(r => r.status === 'approved')
    
    // Calculate streak
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    const dates = [...new Set(approved.map(r => r.date))].sort().reverse()
    
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i]
      const prevDate = i === 0 ? today : dates[i - 1]
      const expectedDate = new Date(new Date(prevDate).getTime() - 86400000).toISOString().split('T')[0]
      
      if (i === 0 && (date === today || date === yesterday)) {
        tempStreak = 1
      } else if (date === expectedDate) {
        tempStreak++
      } else {
        if (tempStreak > longestStreak) longestStreak = tempStreak
        tempStreak = 1
      }
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak
    currentStreak = dates[0] === today || dates[0] === yesterday ? tempStreak : 0
    
    // Perfect days (all rooms completed on a day)
    const roomCount = (rooms || []).length
    const dayGroups = {}
    records.forEach(r => {
      if (!dayGroups[r.date]) dayGroups[r.date] = []
      dayGroups[r.date].push(r)
    })
    const perfectDays = Object.values(dayGroups).filter(
      dayRecords => dayRecords.filter(r => r.status === 'approved').length >= roomCount && roomCount > 0
    ).length
    
    // Discipline score (simple calculation)
    const score = approved.length * 10 + currentStreak * 5 + perfectDays * 15
    
    return {
      currentStreak,
      longestStreak,
      perfectDays,
      daysActive: dates.length,
      roomsAttended: approved.length,
      totalProofs: records.length,
      avgDailyScore: records.length > 0 ? Math.round((approved.length / records.length) * 100) : 0,
      disciplineScore: Math.min(score, 1500),
      level: Math.floor(score / 100) + 1,
      xpProgress: score % 100
    }
  }, [history, rooms])
  
  const rankInfo = getRankInfo(stats.disciplineScore)
  
  // Format join date
  const joinedDate = useMemo(() => {
    if (!user?.created_at) return 'Recently joined'
    const date = new Date(user.created_at)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }, [user?.created_at])
  
  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }
  
  if (loading) {
    return <ProfileSkeleton />
  }
  
  // User info from auth
  const userName = profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null
  
  // Streak milestones
  const milestones = [
    { label: '7 Day Streak', achieved: stats.longestStreak >= 7 },
    { label: '14 Day Streak', achieved: stats.longestStreak >= 14 },
    { label: '21 Day Streak', achieved: stats.longestStreak >= 21 },
    { label: '30 Day Streak', achieved: stats.longestStreak >= 30 },
    { label: '60 Day Streak', achieved: stats.longestStreak >= 60 },
    { label: '100 Day Streak', achieved: stats.longestStreak >= 100 },
  ]
  
  // Badges based on real stats
  const badges = [
    { id: 1, name: 'First Room', description: 'Complete your first room', icon: '🎯', earned: stats.roomsAttended >= 1, progress: Math.min(stats.roomsAttended, 1) * 100 },
    { id: 2, name: 'Week Warrior', description: '7 day streak', icon: '🔥', earned: stats.longestStreak >= 7, progress: Math.min(stats.longestStreak / 7 * 100, 100) },
    { id: 3, name: 'Consistent', description: '10 rooms attended', icon: '📊', earned: stats.roomsAttended >= 10, progress: Math.min(stats.roomsAttended / 10 * 100, 100) },
    { id: 4, name: 'Perfect Day', description: 'Complete all rooms in a day', icon: '⭐', earned: stats.perfectDays >= 1, progress: Math.min(stats.perfectDays, 1) * 100 },
    { id: 5, name: 'Streak Master', description: '21 day streak', icon: '🏆', earned: stats.longestStreak >= 21, progress: Math.min(stats.longestStreak / 21 * 100, 100) },
    { id: 6, name: 'Century Club', description: '100 rooms attended', icon: '💯', earned: stats.roomsAttended >= 100, progress: Math.min(stats.roomsAttended / 100 * 100, 100) },
  ]
  
  const earnedBadges = badges.filter(b => b.earned)
  const inProgressBadges = badges.filter(b => !b.earned)
  
  // Phase 3: Map earned DB achievements 
  const earnedIds = new Set((earnedAchievements || []).map(a => a.achievement_id))
  const dbAchievements = (allAchievements || []).map(a => ({
    ...a,
    earned: earnedIds.has(a.id),
    earnedAt: (earnedAchievements || []).find(ea => ea.achievement_id === a.id)?.earned_at
  }))
  
  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Profile Header */}
      <Card className="text-center py-6">
        <Avatar src={avatarUrl} size="xl" className="mx-auto mb-4" />
        <h1 className="text-xl sm:text-2xl font-bold text-white">{userName}</h1>
        <p className="text-gray-500 text-sm mt-1">{userEmail}</p>
        <p className="text-gray-600 text-xs mt-1">Member since {joinedDate}</p>
        
        {/* Rank Badge */}
        <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full ${rankInfo.bg}`}>
          <Icon name="fire" className={`w-4 h-4 ${rankInfo.color}`} />
          <span className={`font-semibold ${rankInfo.color}`}>{rankInfo.name}</span>
        </div>
      </Card>
      
      {/* Discipline Score Card */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="fire" className="w-5 h-5 text-accent" />
            <h2 className="text-white font-semibold">Discipline Score</h2>
          </div>
          <span className="text-xs text-gray-500">Level {stats.level}</span>
        </div>
        
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="relative">
            <svg className="w-28 h-28 -rotate-90 transform">
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-charcoal-500"
              />
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${stats.xpProgress * 3.01} 301`}
                strokeLinecap="round"
                className="text-accent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{stats.disciplineScore}</span>
              <span className="text-xs text-gray-500">points</span>
            </div>
          </div>
        </div>
        
        {/* XP to next level */}
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-2">{stats.xpProgress}% to Level {stats.level + 1}</p>
          <div className="h-2 bg-charcoal-500/50 rounded-full overflow-hidden max-w-xs mx-auto">
            <div 
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${stats.xpProgress}%` }}
            />
          </div>
        </div>
      </Card>
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="text-center py-4">
          <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
            <Icon name="fire" className="w-4 h-4" />
            <span className="text-xl font-bold">{stats.currentStreak}</span>
          </div>
          <div className="text-xs text-gray-500">Current Streak</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-xl font-bold text-accent mb-1">{stats.perfectDays}</div>
          <div className="text-xs text-gray-500">Perfect Days</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-xl font-bold text-white mb-1">{stats.daysActive}</div>
          <div className="text-xs text-gray-500">Days Active</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-xl font-bold text-white mb-1">{stats.avgDailyScore}%</div>
          <div className="text-xs text-gray-500">Approval Rate</div>
        </Card>
      </div>
      
      {/* Detailed Stats */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="history" className="w-4 h-4 text-gray-400" />
          <h2 className="text-white font-semibold">Statistics</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-charcoal-500/30 rounded-lg">
            <p className="text-gray-500 text-xs">Rooms Attended</p>
            <p className="text-white font-bold text-lg mt-1">{stats.roomsAttended}</p>
          </div>
          <div className="p-3 bg-charcoal-500/30 rounded-lg">
            <p className="text-gray-500 text-xs">Proofs Submitted</p>
            <p className="text-white font-bold text-lg mt-1">{stats.totalProofs}</p>
          </div>
          <div className="p-3 bg-charcoal-500/30 rounded-lg">
            <p className="text-gray-500 text-xs">Longest Streak</p>
            <p className="text-white font-bold text-lg mt-1">{stats.longestStreak} days</p>
          </div>
          <div className="p-3 bg-charcoal-500/30 rounded-lg">
            <p className="text-gray-500 text-xs">Total Rooms</p>
            <p className="text-white font-bold text-lg mt-1">{(rooms || []).length}</p>
          </div>
        </div>
      </Card>
      
      {/* Achievements / Badges */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <h2 className="text-white font-semibold">Achievements</h2>
          </div>
          <span className="text-xs text-gray-500">
            {dbAchievements.filter(a => a.earned).length}/{dbAchievements.length} earned
          </span>
        </div>
        
        {/* DB Achievements Grid */}
        {dbAchievements.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {dbAchievements.filter(a => a.earned).map(a => (
              <AchievementCard key={a.id} achievement={a} earned earnedAt={a.earnedAt} />
            ))}
            {dbAchievements.filter(a => !a.earned).map(a => (
              <AchievementCard key={a.id} achievement={a} earned={false} />
            ))}
          </div>
        )}

        {/* Fallback: Local badges when DB not loaded */}
        {dbAchievements.length === 0 && (
          <>
            {earnedBadges.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-500 text-xs mb-3">Earned</p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {earnedBadges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="flex flex-col items-center p-2 rounded-xl bg-accent/10 border border-accent/30"
                      title={badge.description}
                    >
                      <span className="text-2xl">{badge.icon}</span>
                      <span className="text-xs text-gray-400 mt-1 text-center truncate w-full">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {inProgressBadges.length > 0 && (
              <div>
                <p className="text-gray-500 text-xs mb-3">In Progress</p>
                <div className="space-y-3">
                  {inProgressBadges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-charcoal-500/30"
                    >
                      <span className="text-2xl opacity-50">{badge.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white text-sm font-medium">{badge.name}</p>
                          <span className="text-xs text-gray-500">{Math.round(badge.progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-charcoal-500 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-accent/50 rounded-full"
                            style={{ width: `${badge.progress}%` }}
                          />
                        </div>
                        <p className="text-gray-500 text-xs mt-1">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>
      
      {/* Streak Milestones */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="fire" className="w-4 h-4 text-orange-400" />
          <h2 className="text-white font-semibold">Streak Milestones</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {milestones.map((milestone, index) => (
            <div 
              key={index}
              className={`
                px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2
                ${milestone.achieved 
                  ? 'bg-accent/20 text-accent border border-accent/30' 
                  : 'bg-charcoal-500/30 text-gray-500 border border-charcoal-400/10'
                }
              `}
            >
              {milestone.achieved && <Icon name="check" className="w-3 h-3" />}
              {milestone.label}
            </div>
          ))}
        </div>
        
        {/* Next milestone */}
        {stats.longestStreak < 100 && (
          <div className="mt-4 pt-4 border-t border-charcoal-400/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Next milestone</span>
              <span className="text-white">
                {stats.longestStreak < 7 ? '7 Day Streak' : 
                 stats.longestStreak < 14 ? '14 Day Streak' :
                 stats.longestStreak < 21 ? '21 Day Streak' :
                 stats.longestStreak < 30 ? '30 Day Streak' :
                 stats.longestStreak < 60 ? '60 Day Streak' : '100 Day Streak'}
              </span>
            </div>
          </div>
        )}
      </Card>
      
      {/* Sign Out */}
      <div>
        <Button 
          size="full" 
          variant="ghost" 
          className="text-gray-400 hover:text-red-400" 
          onClick={handleSignOut}
        >
          <Icon name="logout" className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export default Profile
