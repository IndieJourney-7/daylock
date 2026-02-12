/**
 * Gallery Page
 * Proof photos organized by room — your personal achievement wall
 * 
 * Views:
 *   1. Room Selector — grid of rooms with cover photo + count
 *   2. Room Photos  — masonry grid of all approved proofs for a room
 *   3. Lightbox     — full-screen photo viewer
 *   4. Collage Export — generate downloadable collage image
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card, Button, Icon } from '../components/ui'
import { useAuth } from '../contexts'
import { useGalleryRooms, useGalleryRoomPhotos } from '../hooks'
import { MONTHS } from '../constants'

/* ═══════════════════════════════════════════════════
   HELPER UTILITIES
   ═══════════════════════════════════════════════════ */

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

function groupPhotosByMonth(photos) {
  const groups = {}
  for (const photo of photos) {
    const d = new Date(photo.date + 'T00:00:00')
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
    if (!groups[key]) groups[key] = { key, label, photos: [] }
    groups[key].photos.push(photo)
  }
  return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key))
}

/* ═══════════════════════════════════════════════════
   LOADING SKELETON
   ═══════════════════════════════════════════════════ */

function GallerySkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-56 bg-charcoal-600 rounded" />
      <div className="h-5 w-80 bg-charcoal-700 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="aspect-square bg-charcoal-600 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════ */

function EmptyGallery() {
  return (
    <div className="max-w-5xl mx-auto text-center py-20">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-charcoal-600/50 flex items-center justify-center">
        <Icon name="image" className="w-10 h-10 text-gray-600" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Your Gallery is Empty</h2>
      <p className="text-gray-500 max-w-md mx-auto">
        Once your admin approves your daily proofs, they'll appear here organized by room.
        Keep submitting — your journey wall is building!
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   LIGHTBOX — full-screen photo viewer
   ═══════════════════════════════════════════════════ */

function Lightbox({ photo, onClose, onPrev, onNext, hasPrev, hasNext }) {
  // Close on Escape, navigate with arrows
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onPrev()
      if (e.key === 'ArrowRight' && hasNext) onNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext, hasPrev, hasNext])

  if (!photo) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-charcoal-800/80 text-white hover:bg-charcoal-700 transition-colors"
      >
        <Icon name="close" className="w-6 h-6" />
      </button>

      {/* Previous */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-charcoal-800/80 text-white hover:bg-charcoal-700 transition-colors"
        >
          <Icon name="chevronLeft" className="w-6 h-6" />
        </button>
      )}

      {/* Image */}
      <div className="max-w-4xl max-h-[85vh] px-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={photo.proof_url}
          alt={`Proof from ${photo.date}`}
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />
        <div className="text-center mt-4">
          <p className="text-white font-medium">{formatDate(photo.date)}</p>
          {photo.note && <p className="text-gray-400 text-sm mt-1">{photo.note}</p>}
        </div>
      </div>

      {/* Next */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-charcoal-800/80 text-white hover:bg-charcoal-700 transition-colors"
        >
          <Icon name="chevronRight" className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   COLLAGE GENERATOR — export proof-of-work journal sheet
   Fetches images as blobs to avoid CORS canvas tainting
   ═══════════════════════════════════════════════════ */

// Image cache — avoids re-fetching when switching pages / re-rendering
const imageCache = new Map()

/**
 * Load an image by fetching as a blob first.
 * This avoids CORS tainting the canvas so toDataURL() always works.
 */
async function loadImageAsBlob(url) {
  if (!url) return null
  if (imageCache.has(url)) return imageCache.get(url)

  try {
    const resp = await fetch(url, { mode: 'cors' })
    if (!resp.ok) throw new Error('fetch failed')
    const blob = await resp.blob()
    const objectUrl = URL.createObjectURL(blob)

    const img = await new Promise((resolve) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null) }
      el.src = objectUrl
    })

    if (img) imageCache.set(url, img)
    return img
  } catch {
    // Fallback: try loading directly (works for same-origin or public buckets)
    return new Promise((resolve) => {
      const el = new Image()
      el.crossOrigin = 'anonymous'
      el.onload = () => { imageCache.set(url, el); resolve(el) }
      el.onerror = () => resolve(null)
      el.src = url
    })
  }
}

/**
 * Draw a rounded rectangle helper (for older browsers without roundRect)
 */
function drawRoundedRect(ctx, x, y, w, h, r) {
  if (typeof r === 'number') r = [r, r, r, r]
  ctx.beginPath()
  ctx.moveTo(x + r[0], y)
  ctx.lineTo(x + w - r[1], y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r[1])
  ctx.lineTo(x + w, y + h - r[2])
  ctx.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h)
  ctx.lineTo(x + r[3], y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r[3])
  ctx.lineTo(x, y + r[0])
  ctx.quadraticCurveTo(x, y, x + r[0], y)
  ctx.closePath()
}

/**
 * Render a single collage page to a canvas with all images pre-loaded
 */
function renderCollagePageWithImages({
  canvas, photos, images, cols, pageIndex, totalPages,
  roomName, roomEmoji, totalPhotoCount, startDayNum
}) {
  const ctx = canvas.getContext('2d')

  const cellSize  = 220
  const dateBar   = 34
  const cellH     = cellSize + dateBar
  const gap       = 12
  const rows      = Math.ceil(photos.length / cols)
  const headerH   = 100
  const footerH   = 56
  const pad       = 32

  const contentW = cols * cellSize + (cols - 1) * gap
  canvas.width   = contentW + pad * 2
  canvas.height  = headerH + rows * cellH + (rows - 1) * gap + footerH + pad * 2

  // ── Background ──
  ctx.fillStyle = '#0f172a'
  drawRoundedRect(ctx, 0, 0, canvas.width, canvas.height, 20)
  ctx.fill()

  // Subtle top accent gradient
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0)
  grad.addColorStop(0, 'rgba(59,130,246,0.15)')
  grad.addColorStop(1, 'rgba(139,92,246,0.10)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, headerH + pad)

  // ── Header ──
  // Accent bar
  const barGrad = ctx.createLinearGradient(pad, 0, pad + 80, 0)
  barGrad.addColorStop(0, '#3b82f6')
  barGrad.addColorStop(1, '#8b5cf6')
  ctx.fillStyle = barGrad
  drawRoundedRect(ctx, pad, pad, 80, 5, 3)
  ctx.fill()

  // Room title
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
  ctx.fillText(`${roomEmoji}  ${roomName}`, pad, pad + 40)

  // Stats line
  ctx.fillStyle = '#94a3b8'
  ctx.font = '14px system-ui, -apple-system, sans-serif'
  const oldest = photos.length ? photos[photos.length - 1].date : ''
  const newest = photos.length ? photos[0].date : ''
  const rangeStr = oldest && newest ? `${formatDate(oldest)} → ${formatDate(newest)}` : ''
  const pgStr = totalPages > 1 ? `  ·  Page ${pageIndex + 1}/${totalPages}` : ''
  ctx.fillText(`${totalPhotoCount} proof${totalPhotoCount !== 1 ? 's' : ''} of work  ·  ${rangeStr}${pgStr}`, pad, pad + 64)

  // ── Photo grid ──
  for (let i = 0; i < photos.length; i++) {
    const img = images[i]
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = pad + col * (cellSize + gap)
    const y = headerH + pad + row * (cellH + gap)

    // Card shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    drawRoundedRect(ctx, x + 3, y + 3, cellSize, cellH, 12)
    ctx.fill()

    // Card background
    ctx.fillStyle = '#1e293b'
    drawRoundedRect(ctx, x, y, cellSize, cellH, 12)
    ctx.fill()

    // Photo (cover fit with rounded top corners)
    ctx.save()
    drawRoundedRect(ctx, x + 4, y + 4, cellSize - 8, cellSize - 8, 8)
    ctx.clip()
    if (img) {
      const iw = img.width, ih = img.height
      const scale = Math.max((cellSize - 8) / iw, (cellSize - 8) / ih)
      const sw = iw * scale, sh = ih * scale
      ctx.drawImage(
        img,
        x + 4 - (sw - (cellSize - 8)) / 2,
        y + 4 - (sh - (cellSize - 8)) / 2,
        sw, sh
      )
    } else {
      ctx.fillStyle = '#334155'
      ctx.fillRect(x + 4, y + 4, cellSize - 8, cellSize - 8)
      ctx.fillStyle = '#64748b'
      ctx.font = '12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Photo unavailable', x + cellSize / 2, y + cellSize / 2)
      ctx.textAlign = 'start'
    }
    ctx.restore()

    // Date bar at bottom of card
    const dayNumber = startDayNum - i
    const barY = y + cellSize

    // Date text
    ctx.fillStyle = '#e2e8f0'
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
    ctx.fillText(formatDate(photos[i].date), x + 10, barY + 20)

    // Day badge
    const badge = `Day ${dayNumber}`
    ctx.font = '600 10px system-ui, -apple-system, sans-serif'
    const bw = ctx.measureText(badge).width
    // Badge pill
    ctx.fillStyle = 'rgba(59,130,246,0.15)'
    drawRoundedRect(ctx, x + cellSize - bw - 20, barY + 7, bw + 12, 18, 9)
    ctx.fill()
    ctx.fillStyle = '#60a5fa'
    ctx.fillText(badge, x + cellSize - bw - 14, barY + 20)
  }

  // ── Footer ──
  const fy = canvas.height - footerH + 8
  // Gradient accent line
  ctx.fillStyle = barGrad
  drawRoundedRect(ctx, pad, fy - 2, 50, 3, 2)
  ctx.fill()

  ctx.fillStyle = '#64748b'
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillText(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  ·  DayLock — Lock Your Day`, pad, fy + 20)

  return canvas
}

function CollageModal({ photos, roomName, roomEmoji, onClose }) {
  const previewCanvasRef = useRef(null)
  const [loadingImages, setLoadingImages] = useState(true)
  const [loadedImages, setLoadedImages] = useState([]) // parallel array to photos
  const [loadProgress, setLoadProgress] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [collageReady, setCollageReady] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [cols, setCols] = useState(photos.length <= 6 ? 2 : photos.length <= 12 ? 3 : 4)

  const ROWS_PER_PAGE = 4
  const photosPerPage = cols * ROWS_PER_PAGE
  const totalPages = Math.ceil(photos.length / photosPerPage)

  // ── Pre-load ALL images as blobs on mount ──
  useEffect(() => {
    let cancelled = false
    async function preload() {
      setLoadingImages(true)
      setLoadProgress(0)
      const results = []
      for (let i = 0; i < photos.length; i++) {
        if (cancelled) return
        const img = await loadImageAsBlob(photos[i].proof_url)
        results.push(img)
        setLoadProgress(Math.round(((i + 1) / photos.length) * 100))
      }
      if (!cancelled) {
        setLoadedImages(results)
        setLoadingImages(false)
      }
    }
    preload()
    return () => { cancelled = true }
  }, [photos])

  // ── Render preview whenever images load, page or cols change ──
  useEffect(() => {
    if (loadingImages || !previewCanvasRef.current || !loadedImages.length) return
    setCollageReady(false)

    const start = currentPage * photosPerPage
    const end = Math.min(start + photosPerPage, photos.length)
    const pagePhotos = photos.slice(start, end)
    const pageImages = loadedImages.slice(start, end)
    const startDayNum = photos.length - start

    renderCollagePageWithImages({
      canvas: previewCanvasRef.current,
      photos: pagePhotos,
      images: pageImages,
      cols,
      pageIndex: currentPage,
      totalPages,
      roomName,
      roomEmoji,
      totalPhotoCount: photos.length,
      startDayNum,
    })

    setCollageReady(true)
  }, [loadingImages, loadedImages, currentPage, cols, totalPages, photos, photosPerPage, roomName, roomEmoji])

  // ── Download full multi-page PDF ──
  const downloadPDF = useCallback(async () => {
    if (loadingImages) return
    setExporting(true)
    setExportProgress(0)

    try {
      const { default: jsPDF } = await import('jspdf')

      let doc = null
      const pageWidthMM = 210 // A4 width

      for (let p = 0; p < totalPages; p++) {
        const start = p * photosPerPage
        const end = Math.min(start + photosPerPage, photos.length)
        const pagePhotos = photos.slice(start, end)
        const pageImages = loadedImages.slice(start, end)
        const startDayNum = photos.length - start

        const pageCanvas = document.createElement('canvas')
        renderCollagePageWithImages({
          canvas: pageCanvas,
          photos: pagePhotos,
          images: pageImages,
          cols,
          pageIndex: p,
          totalPages,
          roomName,
          roomEmoji,
          totalPhotoCount: photos.length,
          startDayNum,
        })

        const scale = pageWidthMM / pageCanvas.width
        const pageHeightMM = pageCanvas.height * scale
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.92)

        if (p === 0) {
          doc = new jsPDF({
            orientation: pageWidthMM > pageHeightMM ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [pageWidthMM, pageHeightMM],
          })
          doc.addImage(imgData, 'JPEG', 0, 0, pageWidthMM, pageHeightMM)
        } else {
          doc.addPage([pageWidthMM, pageHeightMM])
          doc.addImage(imgData, 'JPEG', 0, 0, pageWidthMM, pageHeightMM)
        }

        setExportProgress(Math.round(((p + 1) / totalPages) * 100))
        // Yield to UI so progress updates
        await new Promise(r => setTimeout(r, 50))
      }

      doc.save(`daylock-${roomName.toLowerCase().replace(/\s+/g, '-')}-collage.pdf`)
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Failed to export PDF. Check the console for details.')
    } finally {
      setExporting(false)
      setExportProgress(0)
    }
  }, [photos, loadedImages, loadingImages, cols, totalPages, photosPerPage, roomName, roomEmoji])

  // ── Download current page as PNG ──
  const downloadPNG = useCallback(() => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    try {
      canvas.toBlob((blob) => {
        if (!blob) { alert('Could not export PNG. Try downloading PDF instead.'); return }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `daylock-${roomName.toLowerCase().replace(/\s+/g, '-')}-page${currentPage + 1}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 'image/png')
    } catch (err) {
      console.error('PNG export error:', err)
      alert('PNG export failed. Try downloading the PDF instead.')
    }
  }, [roomName, currentPage])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-charcoal-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-charcoal-400/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-charcoal-400/10">
          <div>
            <h3 className="text-white font-bold text-lg">Export Proof-of-Work Collage</h3>
            <p className="text-gray-500 text-sm">
              {roomEmoji} {roomName} · {photos.length} photo{photos.length !== 1 ? 's' : ''}
              {totalPages > 1 && ` · ${totalPages} pages`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-charcoal-600/50 text-gray-400 hover:text-white transition-colors"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>

        {/* Options bar */}
        <div className="px-5 py-3 border-b border-charcoal-400/10 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Columns:</span>
            {[2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => { setCols(n); setCurrentPage(0) }}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                  cols === n
                    ? 'bg-accent text-white shadow-lg shadow-accent/25'
                    : 'bg-charcoal-600/50 text-gray-400 hover:text-white hover:bg-charcoal-500/50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="text-charcoal-400/30 text-sm">|</div>
          <span className="text-gray-500 text-sm">
            {photosPerPage} per page · {totalPages} page{totalPages !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Canvas Preview */}
        <div className="p-5 flex justify-center min-h-[200px]">
          {loadingImages ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-white text-sm font-medium">Loading photos…</p>
                <p className="text-gray-500 text-xs mt-1">{loadProgress}% · {Math.round(photos.length * loadProgress / 100)} of {photos.length}</p>
              </div>
              {/* Progress bar */}
              <div className="w-48 h-1.5 bg-charcoal-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <canvas
              ref={previewCanvasRef}
              className="max-w-full rounded-xl shadow-2xl border border-charcoal-400/10"
              style={{ maxHeight: '55vh', objectFit: 'contain' }}
            />
          )}
        </div>

        {/* Page navigation */}
        {totalPages > 1 && !loadingImages && (
          <div className="px-5 pb-3 flex items-center justify-center gap-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-lg bg-charcoal-600/50 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              <Icon name="chevronLeft" className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === currentPage ? 'bg-accent scale-125' : 'bg-charcoal-500 hover:bg-charcoal-400'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-2 rounded-lg bg-charcoal-600/50 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              <Icon name="chevronRight" className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="p-5 border-t border-charcoal-400/10 flex items-center justify-between flex-wrap gap-3">
          <p className="text-gray-500 text-sm">
            {exporting
              ? `Exporting PDF… ${exportProgress}%`
              : loadingImages
                ? 'Loading images…'
                : `${photos.length} total proofs · page ${currentPage + 1} of ${totalPages}`}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button
              variant="secondary"
              onClick={downloadPNG}
              disabled={!collageReady || loadingImages || exporting}
            >
              <Icon name="download" className="w-4 h-4 mr-2" />
              Page PNG
            </Button>
            <Button
              onClick={downloadPDF}
              disabled={loadingImages || exporting}
            >
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {exportProgress}%
                </>
              ) : (
                <>
                  <Icon name="download" className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   ROOM GALLERY VIEW — photos for a single room
   ═══════════════════════════════════════════════════ */

function RoomGalleryView({ room, onBack }) {
  const { user } = useAuth()
  const { data: photos, loading, error } = useGalleryRoomPhotos(room.id, user?.id)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [showCollage, setShowCollage] = useState(false)

  const allPhotos = photos || []
  const monthGroups = groupPhotosByMonth(allPhotos)

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-charcoal-600 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="aspect-square bg-charcoal-600 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button + Room header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-charcoal-600/50 text-gray-400 hover:text-white transition-colors"
          >
            <Icon name="chevronLeft" className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-3xl">{room.emoji}</span>
              {room.name}
            </h1>
            <p className="text-gray-500 text-sm">{allPhotos.length} approved proofs</p>
          </div>
        </div>
        
        {allPhotos.length > 0 && (
          <Button onClick={() => setShowCollage(true)} size="sm">
            <Icon name="grid" className="w-4 h-4 mr-2" />
            Export Collage
          </Button>
        )}
      </div>

      {/* Photos grouped by month */}
      {allPhotos.length === 0 ? (
        <Card className="text-center py-12">
          <Icon name="image" className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No approved photos yet for this room</p>
        </Card>
      ) : (
        monthGroups.map(group => (
          <div key={group.key}>
            <h3 className="text-white font-semibold text-lg mb-3 flex items-center gap-2">
              <Icon name="calendar" className="w-4 h-4 text-accent" />
              {group.label}
              <span className="text-gray-600 text-sm font-normal">({group.photos.length})</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {group.photos.map((photo) => {
                const globalIndex = allPhotos.findIndex(p => p.id === photo.id)
                return (
                  <div
                    key={photo.id}
                    className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-charcoal-400/10 hover:border-accent/40 transition-all duration-300"
                    onClick={() => setLightboxIndex(globalIndex)}
                  >
                    <img
                      src={photo.proof_url}
                      alt={`Proof ${photo.date}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium">{formatDate(photo.date)}</p>
                        {photo.note && (
                          <p className="text-gray-300 text-xs mt-0.5 line-clamp-1">{photo.note}</p>
                        )}
                      </div>
                    </div>
                    {/* Date badge (always visible) */}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1">
                      <p className="text-white text-[10px] font-medium">
                        {new Date(photo.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          photo={allPhotos[lightboxIndex]}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex(i => Math.max(0, i - 1))}
          onNext={() => setLightboxIndex(i => Math.min(allPhotos.length - 1, i + 1))}
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < allPhotos.length - 1}
        />
      )}

      {/* Collage Modal */}
      {showCollage && (
        <CollageModal
          photos={allPhotos}
          roomName={room.name}
          roomEmoji={room.emoji}
          onClose={() => setShowCollage(false)}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   ROOM SELECTOR — gallery home
   ═══════════════════════════════════════════════════ */

function RoomSelector({ rooms, onSelectRoom }) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <Icon name="image" className="w-7 h-7 text-accent" />
          Gallery
        </h1>
        <p className="text-gray-500 mt-1">
          Your approved proof photos, organized by room. Relive your daily wins.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4">
        <Card padding="px-4 py-2.5" className="flex items-center gap-2">
          <Icon name="rooms" className="w-4 h-4 text-accent" />
          <span className="text-white font-semibold text-sm">{rooms.length}</span>
          <span className="text-gray-500 text-sm">Rooms</span>
        </Card>
        <Card padding="px-4 py-2.5" className="flex items-center gap-2">
          <Icon name="camera" className="w-4 h-4 text-green-400" />
          <span className="text-white font-semibold text-sm">
            {rooms.reduce((sum, r) => sum + r.photoCount, 0)}
          </span>
          <span className="text-gray-500 text-sm">Photos</span>
        </Card>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {rooms.map(room => (
          <div
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border border-charcoal-400/10 hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5"
          >
            {/* Cover image */}
            {room.latestPhoto ? (
              <img
                src={room.latestPhoto}
                alt={room.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-charcoal-600 flex items-center justify-center">
                <span className="text-5xl">{room.emoji}</span>
              </div>
            )}
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Room info */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{room.emoji}</span>
                <h3 className="text-white font-bold text-lg group-hover:text-accent transition-colors">
                  {room.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-300 text-sm">{room.photoCount} photos</span>
                {room.latestDate && (
                  <>
                    <span className="text-gray-600">·</span>
                    <span className="text-gray-400 text-xs">
                      Latest: {new Date(room.latestDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Photo count badge */}
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
              <Icon name="camera" className="w-3 h-3 text-white" />
              <span className="text-white text-xs font-semibold">{room.photoCount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN GALLERY PAGE
   ═══════════════════════════════════════════════════ */

function Gallery() {
  const { user } = useAuth()
  const { data: galleryRooms, loading, error } = useGalleryRooms(user?.id)
  const [selectedRoom, setSelectedRoom] = useState(null)

  if (loading) return <GallerySkeleton />

  if (error) {
    return (
      <div className="max-w-5xl mx-auto text-center py-12">
        <Icon name="x" className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-1">Error loading gallery</h3>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    )
  }

  const rooms = galleryRooms || []

  if (!selectedRoom && rooms.length === 0) {
    return <EmptyGallery />
  }

  if (selectedRoom) {
    return (
      <RoomGalleryView 
        room={selectedRoom} 
        onBack={() => setSelectedRoom(null)} 
      />
    )
  }

  return (
    <RoomSelector 
      rooms={rooms} 
      onSelectRoom={setSelectedRoom} 
    />
  )
}

export default Gallery
