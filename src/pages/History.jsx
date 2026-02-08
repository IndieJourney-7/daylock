/**
 * History Page
 * Long-term attendance history with calendar view
 * View past attendance by date, monthly stats, and trends
 */

import { useState, useMemo } from 'react'
import { Card, Badge, Icon } from '../components/ui'
import { DAYS, MONTHS } from '../constants'
import { useAuth } from '../contexts'
import { useUserHistory, useRooms } from '../hooks'

// Get calendar data for a month
function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }
  
  return days
}

// Loading skeleton
function HistorySkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 w-32 bg-charcoal-600 rounded" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-charcoal-600 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-charcoal-600 rounded-xl" />
    </div>
  )
}

function History() {
  const { user } = useAuth()
  const { data: historyData, loading, error } = useUserHistory(user?.id)
  const { data: rooms } = useRooms(user?.id)
  
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState(today.getDate())
  
  // Group attendance by date
  const attendanceByDate = useMemo(() => {
    const grouped = {}
    ;(historyData || []).forEach(record => {
      const dateKey = record.date
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(record)
    })
    return grouped
  }, [historyData])
  
  // Get day status for calendar
  const getDayStatus = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayRecords = attendanceByDate[dateStr]
    
    if (!dayRecords || dayRecords.length === 0) return null
    
    const approvedCount = dayRecords.filter(r => r.status === 'approved').length
    const total = dayRecords.length
    const score = approvedCount / total
    
    if (score === 1) return 'perfect'
    if (score >= 0.5) return 'partial'
    return 'poor'
  }
  
  // Calculate monthly stats
  const monthStats = useMemo(() => {
    const stats = { totalDays: 0, perfectDays: 0, approvedCount: 0, totalRooms: 0 }
    
    for (let day = 1; day <= new Date(selectedYear, selectedMonth + 1, 0).getDate(); day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayRecords = attendanceByDate[dateStr]
      
      if (dayRecords && dayRecords.length > 0) {
        stats.totalDays++
        const approvedInDay = dayRecords.filter(r => r.status === 'approved').length
        if (approvedInDay === dayRecords.length) stats.perfectDays++
        stats.approvedCount += approvedInDay
        stats.totalRooms += dayRecords.length
      }
    }
    
    return stats
  }, [attendanceByDate, selectedMonth, selectedYear])
  
  const monthAttendanceRate = monthStats.totalRooms > 0 
    ? Math.round((monthStats.approvedCount / monthStats.totalRooms) * 100) 
    : 0
  
  const calendarDays = getCalendarDays(selectedYear, selectedMonth)
  
  // Selected day data
  const selectedDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`
  const selectedDayRecords = attendanceByDate[selectedDateStr] || []
  
  // Navigation
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
    setSelectedDate(1)
  }
  
  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
    setSelectedDate(1)
  }
  
  const handleDayClick = (day) => {
    if (day) {
      setSelectedDate(day)
    }
  }
  
  const formatSelectedDate = () => {
    const date = new Date(selectedYear, selectedMonth, selectedDate)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  if (loading) {
    return <HistorySkeleton />
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Icon name="x" className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-1">Error loading history</h3>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">History</h1>
          <p className="text-gray-500 text-sm mt-1">View your past attendance</p>
        </div>
      </div>
      
      {/* Monthly Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-accent">{monthAttendanceRate}%</div>
          <div className="text-xs text-gray-500 mt-1">This Month</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-white">{monthStats.perfectDays}</div>
          <div className="text-xs text-gray-500 mt-1">Perfect Days</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-white">{monthStats.approvedCount}</div>
          <div className="text-xs text-gray-500 mt-1">Rooms Done</div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Calendar Card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={prevMonth}
              className="p-2 text-gray-400 hover:text-white hover:bg-charcoal-500/50 rounded-lg transition-colors"
            >
              <Icon name="chevronLeft" className="w-5 h-5" />
            </button>
            <h2 className="text-white font-semibold">
              {MONTHS[selectedMonth]} {selectedYear}
            </h2>
            <button 
              onClick={nextMonth}
              className="p-2 text-gray-400 hover:text-white hover:bg-charcoal-500/50 rounded-lg transition-colors"
            >
              <Icon name="chevronRight" className="w-5 h-5" />
            </button>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
              <span className="text-gray-500">Perfect</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
              <span className="text-gray-500">Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="text-gray-500">Poor</span>
            </div>
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {DAYS.map((day) => (
              <div key={day} className="text-gray-500 py-2 font-medium">{day}</div>
            ))}
            {calendarDays.map((day, index) => {
              const status = day ? getDayStatus(selectedYear, selectedMonth, day) : null
              const isSelected = day === selectedDate
              const isToday = day === today.getDate() && 
                              selectedMonth === today.getMonth() && 
                              selectedYear === today.getFullYear()
              
              return (
                <div 
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={`
                    py-2 rounded-md transition-colors
                    ${day ? 'cursor-pointer' : ''}
                    ${isSelected ? 'ring-2 ring-accent' : ''}
                    ${isToday && !isSelected ? 'ring-1 ring-gray-500' : ''}
                    ${status === 'perfect' ? 'bg-accent/20 text-accent' : ''}
                    ${status === 'partial' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                    ${status === 'poor' ? 'bg-red-500/20 text-red-400' : ''}
                    ${!status && day ? 'text-gray-600 hover:bg-charcoal-500/50' : ''}
                  `}
                >
                  {day || ''}
                </div>
              )
            })}
          </div>
        </Card>
        
        {/* Day Detail Card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="calendar" className="w-4 h-4 text-gray-400" />
              <h2 className="text-white font-semibold">Day Details</h2>
            </div>
          </div>
          
          <p className="text-gray-400 text-sm mb-4">{formatSelectedDate()}</p>
          
          {selectedDayRecords.length > 0 ? (
            <>
              <div className="space-y-3">
                {selectedDayRecords.map((record) => (
                  <div 
                    key={record.id}
                    className={`
                      p-3 rounded-xl border transition-colors
                      ${record.status === 'approved' 
                        ? 'bg-accent/5 border-accent/20' 
                        : record.status === 'pending_review'
                        ? 'bg-yellow-500/5 border-yellow-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{record.room?.emoji || '📋'}</span>
                        <div>
                          <p className="text-white text-sm font-medium">{record.room?.name || 'Room'}</p>
                          <p className="text-gray-500 text-xs">
                            {record.submitted_at ? new Date(record.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>
                      <Badge variant={record.status === 'approved' ? 'present' : record.status === 'pending_review' ? 'pending' : 'absent'}>
                        {record.status}
                      </Badge>
                    </div>
                    {record.note && (
                      <div className="mt-2 pt-2 border-t border-charcoal-400/10">
                        <span className="text-gray-400 text-xs italic">"{record.note}"</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Day summary */}
              <div className="mt-4 pt-4 border-t border-charcoal-400/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Day Score</span>
                  <span className="text-white font-medium">
                    {selectedDayRecords.filter(r => r.status === 'approved').length}/{selectedDayRecords.length} rooms
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Icon name="calendar" className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No data for this date</p>
              <p className="text-gray-600 text-xs mt-1">Select a highlighted date to view details</p>
            </div>
          )}
        </Card>
      </div>
      
      {/* Monthly Breakdown by Room */}
      {(rooms || []).length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="history" className="w-4 h-4 text-gray-400" />
              <h2 className="text-white font-semibold">Monthly Breakdown</h2>
            </div>
            <span className="text-gray-400 text-sm">{MONTHS[selectedMonth]}</span>
          </div>
          
          <div className="space-y-4">
            {(rooms || []).map((room) => {
              // Calculate room-specific stats for the month
              let approved = 0, total = 0
              for (let day = 1; day <= new Date(selectedYear, selectedMonth + 1, 0).getDate(); day++) {
                const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayRecords = attendanceByDate[dateStr] || []
                const roomRecord = dayRecords.find(r => r.room_id === room.id)
                if (roomRecord) {
                  total++
                  if (roomRecord.status === 'approved') approved++
                }
              }
              const rate = total > 0 ? Math.round((approved / total) * 100) : 0
              
              return (
                <div key={room.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{room.emoji || '📋'}</span>
                      <span className="text-white text-sm">{room.name}</span>
                    </div>
                    <span className="text-gray-400 text-sm">{approved}/{total} days ({rate}%)</span>
                  </div>
                  <div className="h-2 bg-charcoal-500/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        rate >= 80 ? 'bg-accent' : rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

export default History
