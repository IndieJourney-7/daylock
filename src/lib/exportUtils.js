/**
 * Export Utilities
 * Comprehensive PDF and Excel export for analytics data
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// ── Helper: add new page if needed ──
let _lastTableY = 40
function checkPageBreak(doc, neededSpace = 40) {
  const pageHeight = doc.internal.pageSize.height
  const currentY = _lastTableY
  if (currentY + neededSpace > pageHeight - 20) {
    doc.addPage()
    return 20
  }
  return currentY
}
function runAutoTable(doc, opts) {
  autoTable(doc, opts)
  _lastTableY = doc.lastAutoTable?.finalY || _lastTableY
}

// ── Helper: strip emoji for PDF (default fonts don't support them) ──
function stripEmoji(str) {
  return (str || '').replace(/[\u{1F300}-\u{1FAD6}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '').trim()
}

// ── Helper: format room name for PDF ──
function pdfRoomName(emoji, name) {
  const cleaned = stripEmoji(emoji || '')
  return cleaned ? `[${cleaned}] ${name}` : name
}

// ── Helper: consistency grade ──
function getGrade(rate) {
  if (rate >= 95) return 'A+'
  if (rate >= 90) return 'A'
  if (rate >= 80) return 'B'
  if (rate >= 70) return 'C'
  if (rate >= 60) return 'D'
  return 'F'
}

/**
 * Export attendance records to Excel (comprehensive multi-sheet workbook)
 */
export function exportToExcel(records, fileName = 'daylock-report', extraData = {}) {
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Attendance Log (all records) ──
  const hasUserInfo = (records || []).some(r => r.user || r.userName)
  const logRows = (records || []).map(r => {
    const row = { Date: r.date }
    if (hasUserInfo) row['User'] = r.user?.name || r.user?.email || r.userName || '-'
    row['Room'] = r.room?.name || r.roomName || '-'
    row['Status'] = r.status?.replace('_', ' ') || '-'
    row['Submitted At'] = r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '-'
    row['Reviewed At'] = r.reviewed_at ? new Date(r.reviewed_at).toLocaleString() : '-'
    row['Note'] = r.note || '-'
    return row
  })

  if (logRows.length > 0) {
    const ws1 = XLSX.utils.json_to_sheet(logRows)
    ws1['!cols'] = Object.keys(logRows[0]).map(key => ({
      wch: Math.max(key.length + 2, ...logRows.map(r => String(r[key] || '').length).slice(0, 100))
    }))
    XLSX.utils.book_append_sheet(wb, ws1, 'Attendance Log')
  }

  // ── Sheet 2: Summary (if overview provided) ──
  if (extraData.overview) {
    const o = extraData.overview
    const s = extraData.streaks || {}
    const summaryRows = [
      { Metric: 'Total Days Tracked', Value: o.totalDays ?? o.totalRecords ?? 0 },
      { Metric: 'Approved', Value: o.approved ?? 0 },
      { Metric: 'Rejected', Value: o.rejected ?? 0 },
      { Metric: 'Missed', Value: o.missed ?? 0 },
      { Metric: 'Pending Review', Value: o.pending ?? o.pendingReview ?? 0 },
      { Metric: 'Attendance Rate', Value: `${o.overallRate ?? o.rate ?? 0}%` },
      { Metric: 'Consistency Grade', Value: getGrade(o.overallRate ?? o.rate ?? 0) },
      { Metric: 'Current Streak', Value: `${s.currentStreak ?? 0} days` },
      { Metric: 'Best Streak', Value: `${s.bestStreak ?? 0} days` },
      { Metric: 'Report Generated', Value: new Date().toLocaleString() },
    ]
    const ws2 = XLSX.utils.json_to_sheet(summaryRows)
    ws2['!cols'] = [{ wch: 22 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary')
  }

  // ── Sheet 3: Room Breakdown (if available) ──
  if (extraData.roomBreakdown?.length > 0) {
    const roomRows = extraData.roomBreakdown.map(r => ({
      Room: `${r.emoji || ''} ${r.name}`.trim(),
      'Total Days': r.total,
      Approved: r.approved,
      Rejected: r.rejected ?? 0,
      Missed: r.missed ?? 0,
      'Rate (%)': r.rate,
      Grade: getGrade(r.rate)
    }))
    const ws3 = XLSX.utils.json_to_sheet(roomRows)
    ws3['!cols'] = roomRows.length > 0
      ? Object.keys(roomRows[0]).map(key => ({ wch: Math.max(key.length + 2, 12) }))
      : []
    XLSX.utils.book_append_sheet(wb, ws3, 'Room Breakdown')
  }

  // ── Sheet 4: Weekly Trend (if available) ──
  if (extraData.weeklyTrend?.length > 0) {
    const weekRows = extraData.weeklyTrend.map(w => ({
      Week: w.week || w.month,
      Approved: w.approved,
      Total: w.total,
      'Rate (%)': w.rate
    }))
    const ws4 = XLSX.utils.json_to_sheet(weekRows)
    ws4['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, ws4, 'Weekly Trend')
  }

  // ── Sheet 5: Monthly Trend (if available) ──
  if (extraData.monthlyTrend?.length > 0) {
    const monthRows = extraData.monthlyTrend.map(m => ({
      Month: m.month,
      Approved: m.approved,
      Rejected: m.rejected,
      Missed: m.missed,
      Total: m.total,
      'Rate (%)': m.rate
    }))
    const ws5 = XLSX.utils.json_to_sheet(monthRows)
    ws5['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, ws5, 'Monthly Trend')
  }

  // ── Sheet: User Performance (admin exports) ──
  if (extraData.userPerformance?.length > 0) {
    const upRows = extraData.userPerformance.map((u, i) => ({
      Rank: i + 1,
      User: u.name || 'Unknown',
      'Total Days': u.total,
      Approved: u.approved,
      Rejected: u.rejected ?? 0,
      Missed: u.missed ?? 0,
      'Rate (%)': u.rate,
      Grade: getGrade(u.rate),
      'Current Streak': u.currentStreak ?? 0,
      'Best Streak': u.bestStreak ?? 0
    }))
    const wsUp = XLSX.utils.json_to_sheet(upRows)
    wsUp['!cols'] = Object.keys(upRows[0]).map(key => ({ wch: Math.max(key.length + 2, 12) }))
    XLSX.utils.book_append_sheet(wb, wsUp, 'User Performance')
  }

  // ── Sheet: Room Stats (admin exports) ──
  if (extraData.roomStats?.length > 0) {
    const rsRows = extraData.roomStats.map(r => ({
      Room: `${r.emoji || ''} ${r.name}`.trim(),
      Owner: r.userName || '-',
      'Total Days': r.total,
      Approved: r.approved,
      'Rate (%)': r.rate,
      Grade: getGrade(r.rate)
    }))
    const wsRs = XLSX.utils.json_to_sheet(rsRows)
    wsRs['!cols'] = Object.keys(rsRows[0]).map(key => ({ wch: Math.max(key.length + 2, 12) }))
    XLSX.utils.book_append_sheet(wb, wsRs, 'Room Stats')
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${fileName}.xlsx`)
}

/**
 * Export user analytics to PDF — comprehensive progress report
 */
export function exportToPDF(analytics, userName = 'User', fileName = 'daylock-report') {
  const doc = new jsPDF()
  _lastTableY = 40
  const { overview, streaks, roomBreakdown, weeklyTrend, monthlyTrend } = analytics
  const rate = overview.overallRate ?? overview.rate ?? 0

  // ── Title ──
  doc.setFontSize(22)
  doc.setTextColor(40, 40, 40)
  doc.text('DayLock Progress Report', 14, 22)

  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated for ${userName} on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 30)

  // ── Consistency Grade Banner ──
  doc.setFontSize(12)
  doc.setTextColor(80, 80, 80)
  doc.text(`Consistency Grade: ${getGrade(rate)}  |  Attendance Rate: ${rate}%  |  Current Streak: ${streaks?.currentStreak || 0} days  |  Best Streak: ${streaks?.bestStreak || 0} days`, 14, 38)

  // ── Overview Stats ──
  doc.setFontSize(14)
  doc.setTextColor(40, 40, 40)
  doc.text('Performance Overview', 14, 50)

  runAutoTable(doc, {
    startY: 54,
    head: [['Metric', 'Value']],
    body: [
      ['Total Days Tracked', overview.totalDays ?? overview.totalRecords ?? 0],
      ['Days Approved', overview.approved ?? 0],
      ['Days Rejected', overview.rejected ?? 0],
      ['Days Missed', overview.missed ?? 0],
      ['Pending Review', overview.pending ?? overview.pendingReview ?? 0],
      ['Attendance Rate', `${rate}%`],
      ['Consistency Grade', getGrade(rate)],
      ['Current Streak', `${streaks?.currentStreak || 0} days`],
      ['Best Streak', `${streaks?.bestStreak || 0} days`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold' } }
  })

  // ── Room Breakdown ──
  if (roomBreakdown?.length > 0) {
    let y = checkPageBreak(doc, 50) + 12
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text('Room-by-Room Breakdown', 14, y)

    runAutoTable(doc, {
      startY: y + 4,
      head: [['Room', 'Total Days', 'Approved', 'Rejected', 'Missed', 'Rate', 'Grade']],
      body: roomBreakdown.map(r => [
        r.name,
        r.total,
        r.approved,
        r.rejected ?? 0,
        r.missed ?? 0,
        `${r.rate}%`,
        getGrade(r.rate)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 }
    })
  }

  // ── Weekly Trend ──
  if (weeklyTrend?.length > 0) {
    let y = checkPageBreak(doc, 50) + 12
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text('Weekly Trend (Last 12 Weeks)', 14, y)

    runAutoTable(doc, {
      startY: y + 4,
      head: [['Week', 'Approved', 'Total', 'Rate']],
      body: weeklyTrend.map(w => [
        w.week, w.approved, w.total, `${w.rate}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 9 }
    })
  }

  // ── Monthly Trend ──
  if (monthlyTrend?.length > 0) {
    let y = checkPageBreak(doc, 50) + 12
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text('Monthly Breakdown', 14, y)

    runAutoTable(doc, {
      startY: y + 4,
      head: [['Month', 'Approved', 'Rejected', 'Missed', 'Total', 'Rate']],
      body: monthlyTrend.map(m => [
        m.month, m.approved, m.rejected, m.missed, m.total, `${m.rate}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 9 }
    })
  }

  // ── Full Attendance Log ──
  if (analytics.records?.length > 0) {
    let y = checkPageBreak(doc, 50) + 12
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text(`Attendance Log (${analytics.records.length} records)`, 14, y)

    const logRows = [...analytics.records].reverse().map(r => [
      r.date,
      r.room?.name || r.roomName || '-',
      r.status?.replace('_', ' ') || '-',
      r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '-',
      r.note || '-'
    ])

    runAutoTable(doc, {
      startY: y + 4,
      head: [['Date', 'Room', 'Status', 'Submitted', 'Note']],
      body: logRows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 7 },
      columnStyles: { 4: { cellWidth: 40 } }
    })
  }

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `DayLock Report — ${userName} — Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  doc.save(`${fileName}.pdf`)
}

/**
 * Export admin analytics to PDF — comprehensive multi-user report
 */
export function exportAdminPDF(analytics, adminName = 'Admin', fileName = 'daylock-admin-report') {
  const doc = new jsPDF()
  _lastTableY = 40
  const { overview, userPerformance, roomStats, weeklyTrend } = analytics

  // ── Title ──
  doc.setFontSize(22)
  doc.setTextColor(40, 40, 40)
  doc.text('DayLock Admin Report', 14, 22)

  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated for ${adminName} on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 30)

  doc.setFontSize(11)
  doc.setTextColor(80, 80, 80)
  doc.text(`${analytics.totalUsers || 0} users  |  ${analytics.totalRooms || 0} rooms  |  Overall Rate: ${overview.overallRate || 0}%`, 14, 38)

  // ── Overview ──
  doc.setFontSize(14)
  doc.setTextColor(40, 40, 40)
  doc.text('Overview', 14, 50)

  runAutoTable(doc, {
    startY: 54,
    head: [['Metric', 'Value']],
    body: [
      ['Total Records', overview.totalRecords ?? 0],
      ['Approved', overview.approved ?? 0],
      ['Rejected', overview.rejected ?? 0],
      ['Missed', overview.missed ?? 0],
      ['Pending Review', overview.pendingReview ?? 0],
      ['Overall Rate', `${overview.overallRate ?? 0}%`],
      ['Consistency Grade', getGrade(overview.overallRate ?? 0)],
      ['Total Rooms', analytics.totalRooms ?? 0],
      ['Total Users', analytics.totalUsers ?? 0],
    ],
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246] },
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold' } }
  })

  // ── User Performance Rankings ──
  if (userPerformance?.length) {
    let y = checkPageBreak(doc, 50) + 12
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text('User Performance Rankings', 14, y)

    runAutoTable(doc, {
      startY: y + 4,
      head: [['Rank', 'User', 'Total', 'Approved', 'Rejected', 'Missed', 'Rate', 'Grade', 'Current Streak', 'Best Streak']],
      body: userPerformance.map((u, i) => [
        i + 1,
        u.name,
        u.total,
        u.approved,
        u.rejected,
        u.missed,
        `${u.rate}%`,
        getGrade(u.rate),
        `${u.currentStreak}d`,
        `${u.bestStreak}d`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] },
      styles: { fontSize: 8 }
    })
  }

  // ── Room Stats ──
  if (roomStats?.length) {
    let y = checkPageBreak(doc, 50) + 12
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text('Room Performance', 14, y)

    runAutoTable(doc, {
      startY: y + 4,
      head: [['Room', 'Owner', 'Total', 'Approved', 'Rate', 'Grade']],
      body: roomStats.map(r => [
        r.name,
        r.userName || '-',
        r.total,
        r.approved,
        `${r.rate}%`,
        getGrade(r.rate)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] },
      styles: { fontSize: 9 }
    })
  }

  // ── Weekly Trend ──
  if (weeklyTrend?.length > 0) {
    let y = checkPageBreak(doc, 50) + 12
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text('Weekly Trend', 14, y)

    runAutoTable(doc, {
      startY: y + 4,
      head: [['Week', 'Approved', 'Total', 'Rate']],
      body: weeklyTrend.map(w => [w.week, w.approved, w.total, `${w.rate}%`]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 9 }
    })
  }

  // ── Full Attendance Log ──
  if (analytics.records?.length > 0) {
    let y = checkPageBreak(doc, 50) + 12
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text(`All Attendance Records (${analytics.records.length})`, 14, y)

    const logRows = [...analytics.records].reverse().map(r => [
      r.date,
      r.user?.name || r.user?.email || r.userName || '-',
      r.room?.name || r.roomName || '-',
      r.status?.replace('_', ' ') || '-',
      r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '-'
    ])

    runAutoTable(doc, {
      startY: y + 4,
      head: [['Date', 'User', 'Room', 'Status', 'Submitted']],
      body: logRows,
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] },
      styles: { fontSize: 7 }
    })
  }

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `DayLock Admin Report — ${adminName} — Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  doc.save(`${fileName}.pdf`)
}
