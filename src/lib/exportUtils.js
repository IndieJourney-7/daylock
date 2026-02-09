/**
 * Export Utilities
 * PDF and Excel export for analytics data
 */

import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

/**
 * Export attendance records to Excel
 */
export function exportToExcel(records, fileName = 'daylock-report') {
  const rows = records.map(r => ({
    Date: r.date,
    Room: r.room?.name || r.roomName || '-',
    Status: r.status,
    'Submitted At': r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '-',
    'Reviewed At': r.reviewed_at ? new Date(r.reviewed_at).toLocaleString() : '-',
    Note: r.note || '-'
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance')

  // Auto-width columns
  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String(r[key] || '').length))
  }))
  ws['!cols'] = colWidths

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${fileName}.xlsx`)
}

/**
 * Export analytics summary to PDF
 */
export function exportToPDF(analytics, userName = 'User', fileName = 'daylock-report') {
  const doc = new jsPDF()
  const { overview, streaks, roomBreakdown } = analytics

  // Title
  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text('DayLock Progress Report', 14, 22)

  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated for ${userName} on ${new Date().toLocaleDateString()}`, 14, 30)

  // Overview stats
  doc.setFontSize(14)
  doc.setTextColor(40, 40, 40)
  doc.text('Overview', 14, 44)

  doc.autoTable({
    startY: 48,
    head: [['Metric', 'Value']],
    body: [
      ['Total Days Tracked', overview.totalDays],
      ['Approved', overview.approved],
      ['Rejected', overview.rejected],
      ['Missed', overview.missed],
      ['Attendance Rate', `${overview.overallRate}%`],
      ['Current Streak', `${streaks?.currentStreak || 0} days`],
      ['Best Streak', `${streaks?.bestStreak || 0} days`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 }
  })

  // Room breakdown
  if (roomBreakdown && roomBreakdown.length > 0) {
    const y = doc.lastAutoTable.finalY + 12
    doc.setFontSize(14)
    doc.text('Room Breakdown', 14, y)

    doc.autoTable({
      startY: y + 4,
      head: [['Room', 'Total', 'Approved', 'Rate']],
      body: roomBreakdown.map(r => [
        `${r.emoji} ${r.name}`,
        r.total,
        r.approved,
        `${r.rate}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 }
    })
  }

  // Attendance log
  if (analytics.records && analytics.records.length > 0) {
    const y2 = doc.lastAutoTable.finalY + 12
    doc.setFontSize(14)
    doc.text('Attendance Log', 14, y2)

    const logRows = analytics.records.slice(-50).reverse().map(r => [
      r.date,
      r.room?.name || '-',
      r.status,
      r.submitted_at ? new Date(r.submitted_at).toLocaleTimeString() : '-'
    ])

    doc.autoTable({
      startY: y2 + 4,
      head: [['Date', 'Room', 'Status', 'Submitted']],
      body: logRows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 }
    })
  }

  doc.save(`${fileName}.pdf`)
}

/**
 * Export admin analytics to PDF
 */
export function exportAdminPDF(analytics, adminName = 'Admin', fileName = 'daylock-admin-report') {
  const doc = new jsPDF()
  const { overview, userPerformance, roomStats } = analytics

  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text('DayLock Admin Report', 14, 22)

  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated for ${adminName} on ${new Date().toLocaleDateString()}`, 14, 30)

  // Overview
  doc.setFontSize(14)
  doc.setTextColor(40, 40, 40)
  doc.text('Overview', 14, 44)

  doc.autoTable({
    startY: 48,
    head: [['Metric', 'Value']],
    body: [
      ['Total Records', overview.totalRecords],
      ['Approved', overview.approved],
      ['Rejected', overview.rejected],
      ['Missed', overview.missed],
      ['Pending Review', overview.pendingReview],
      ['Overall Rate', `${overview.overallRate}%`],
      ['Total Rooms', analytics.totalRooms],
      ['Total Users', analytics.totalUsers],
    ],
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246] },
    styles: { fontSize: 10 }
  })

  // User Performance
  if (userPerformance?.length) {
    const y = doc.lastAutoTable.finalY + 12
    doc.setFontSize(14)
    doc.text('User Performance', 14, y)

    doc.autoTable({
      startY: y + 4,
      head: [['User', 'Approved', 'Rejected', 'Missed', 'Rate', 'Streak']],
      body: userPerformance.map(u => [
        u.name,
        u.approved,
        u.rejected,
        u.missed,
        `${u.rate}%`,
        `${u.currentStreak}d`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] },
      styles: { fontSize: 9 }
    })
  }

  // Room Stats
  if (roomStats?.length) {
    const y = doc.lastAutoTable.finalY + 12
    doc.setFontSize(14)
    doc.text('Room Stats', 14, y)

    doc.autoTable({
      startY: y + 4,
      head: [['Room', 'User', 'Total', 'Approved', 'Rate']],
      body: roomStats.map(r => [
        `${r.emoji} ${r.name}`,
        r.userName,
        r.total,
        r.approved,
        `${r.rate}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] },
      styles: { fontSize: 9 }
    })
  }

  doc.save(`${fileName}.pdf`)
}
