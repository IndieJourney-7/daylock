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
   COLLAGE GENERATOR — export room photos as sheet/collage
   Shows ALL proof photos in a journal-style grid
   ═══════════════════════════════════════════════════ */

// Utility: load an image with CORS
function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

// Utility: draw a single collage page to a canvas
async function renderCollagePage({
  canvas, photos, cols, pageIndex, totalPages, roomName, roomEmoji, totalPhotoCount
}) {
  const ctx = canvas.getContext('2d')

  const cellSize = 240
  const dateBarHeight = 32
  const cellTotal = cellSize + dateBarHeight
  const gap = 10
  const rows = Math.ceil(photos.length / cols)
  const headerHeight = 90
  const footerHeight = 50
  const padding = 28

  canvas.width  = cols * cellSize + (cols - 1) * gap + padding * 2
  canvas.height = headerHeight + rows * cellTotal + (rows - 1) * gap + footerHeight + padding * 2

  // Background
  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  ctx.roundRect(0, 0, canvas.width, canvas.height, 16)
  ctx.fill()

  // Header — accent bar
  ctx.fillStyle = '#3b82f6'
  ctx.fillRect(padding, padding, 50, 4)

  // Header — title
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif'
  ctx.fillText(`${roomEmoji}  ${roomName}`, padding, padding + 36)

  // Header — subtitle
  ctx.fillStyle = '#94a3b8'
  ctx.font = '14px system-ui, -apple-system, sans-serif'
  const dateRange = photos.length
    ? `${formatDate(photos[photos.length - 1].date)} — ${formatDate(photos[0].date)}`
    : ''
  const pageLabel = totalPages > 1 ? `  ·  Page ${pageIndex + 1} of ${totalPages}` : ''
  ctx.fillText(
    `${totalPhotoCount} proof${totalPhotoCount !== 1 ? 's' : ''} of work  ·  ${dateRange}${pageLabel}`,
    padding, padding + 60
  )

  // Load all images for this page
  const images = await Promise.all(photos.map(p => loadImage(p.proof_url)))

  for (let i = 0; i < photos.length; i++) {
    const img = images[i]
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = padding + col * (cellSize + gap)
    const y = headerHeight + padding + row * (cellTotal + gap)

    // Photo cell
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(x, y, cellSize, cellSize, 10)
    ctx.clip()

    if (img) {
      const scale = Math.max(cellSize / img.width, cellSize / img.height)
      const w = img.width * scale
      const h = img.height * scale
      ctx.drawImage(img, x - (w - cellSize) / 2, y - (h - cellSize) / 2, w, h)
    } else {
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(x, y, cellSize, cellSize)
      ctx.fillStyle = '#475569'
      ctx.font = '13px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Photo unavailable', x + cellSize / 2, y + cellSize / 2)
      ctx.textAlign = 'start'
    }
    ctx.restore()

    // Date label bar below photo
    ctx.fillStyle = '#1e293b'
    ctx.beginPath()
    ctx.roundRect(x, y + cellSize + 2, cellSize, dateBarHeight - 2, [0, 0, 8, 8])
    ctx.fill()

    ctx.fillStyle = '#e2e8f0'
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
    ctx.fillText(formatDate(photos[i].date), x + 8, y + cellSize + 20)

    // Day number badge
    const dayNum = `Day ${totalPhotoCount - (pageIndex * (cols * Math.ceil(photos.length / cols)) + i)}`
    ctx.fillStyle = '#64748b'
    ctx.font = '10px system-ui'
    const dayW = ctx.measureText(dayNum).width
    ctx.fillText(dayNum, x + cellSize - dayW - 8, y + cellSize + 19)
  }

  // Footer
  const footerY = canvas.height - footerHeight + 8
  ctx.fillStyle = '#3b82f6'
  ctx.fillRect(padding, footerY - 4, 40, 3)
  ctx.fillStyle = '#64748b'
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillText(
    `Generated ${new Date().toLocaleDateString()}  ·  DayLock — Lock Your Day`,
    padding, footerY + 16
  )

  return canvas
}

function CollageModal({ photos, roomName, roomEmoji, onClose }) {
  const previewCanvasRef = useRef(null)
  const [generating, setGenerating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [collageReady, setCollageReady] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [cols, setCols] = useState(photos.length <= 9 ? 3 : 4)

  const ROWS_PER_PAGE = 5
  const photosPerPage = cols * ROWS_PER_PAGE
  const totalPages = Math.ceil(photos.length / photosPerPage)

  const getPagePhotos = useCallback(
    (page) => photos.slice(page * photosPerPage, (page + 1) * photosPerPage),
    [photos, photosPerPage]
  )

  // Render preview for current page
  const renderPreview = useCallback(async () => {
    if (!photos.length || !previewCanvasRef.current) return
    setGenerating(true)
    setCollageReady(false)

    await renderCollagePage({
      canvas: previewCanvasRef.current,
      photos: getPagePhotos(currentPage),
      cols,
      pageIndex: currentPage,
      totalPages,
      roomName,
      roomEmoji,
      totalPhotoCount: photos.length,
    })

    setGenerating(false)
    setCollageReady(true)
  }, [photos, cols, currentPage, totalPages, roomName, roomEmoji, getPagePhotos])

  useEffect(() => {
    renderPreview()
  }, [renderPreview])

  // Download FULL collage as multi-page PDF
  const downloadPDF = useCallback(async () => {
    setExporting(true)
    setProgress(0)

    try {
      const { default: jsPDF } = await import('jspdf')

      // Render first page to get dimensions
      const tempCanvas = document.createElement('canvas')
      await renderCollagePage({
        canvas: tempCanvas,
        photos: getPagePhotos(0),
        cols,
        pageIndex: 0,
        totalPages,
        roomName,
        roomEmoji,
        totalPhotoCount: photos.length,
      })

      const pxW = tempCanvas.width
      const pxH = tempCanvas.height
      // Convert pixels to mm (assume 96 DPI) — scale so width fits A4-like page
      const pageWidthMM = 210
      const scale = pageWidthMM / pxW
      const pageHeightMM = pxH * scale

      const doc = new jsPDF({
        orientation: pageWidthMM > pageHeightMM ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pageWidthMM, pageHeightMM],
      })

      for (let p = 0; p < totalPages; p++) {
        if (p > 0) {
          // Render page canvas
          const pageCanvas = document.createElement('canvas')
          await renderCollagePage({
            canvas: pageCanvas,
            photos: getPagePhotos(p),
            cols,
            pageIndex: p,
            totalPages,
            roomName,
            roomEmoji,
            totalPhotoCount: photos.length,
          })
          const imgData = pageCanvas.toDataURL('image/jpeg', 0.92)
          // Pages may differ in height
          const pH = pageCanvas.height * scale
          doc.addPage([pageWidthMM, pH])
          doc.addImage(imgData, 'JPEG', 0, 0, pageWidthMM, pH)
        } else {
          const imgData = tempCanvas.toDataURL('image/jpeg', 0.92)
          doc.addImage(imgData, 'JPEG', 0, 0, pageWidthMM, pageHeightMM)
        }
        setProgress(Math.round(((p + 1) / totalPages) * 100))
      }

      doc.save(`daylock-${roomName.toLowerCase().replace(/\s+/g, '-')}-collage.pdf`)
    } catch (err) {
      console.error('PDF export error:', err)
    } finally {
      setExporting(false)
      setProgress(0)
    }
  }, [photos, cols, totalPages, roomName, roomEmoji, getPagePhotos])

  // Download current page as PNG
  const downloadPNG = () => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `daylock-${roomName.toLowerCase().replace(/\s+/g, '-')}-page${currentPage + 1}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-charcoal-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-charcoal-400/20">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-charcoal-400/10">
          <div>
            <h3 className="text-white font-bold text-lg">Export Proof-of-Work Sheet</h3>
            <p className="text-gray-500 text-sm">
              {roomEmoji} {roomName} · {photos.length} photos
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
            {[3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => { setCols(n); setCurrentPage(0) }}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  cols === n
                    ? 'bg-accent text-white'
                    : 'bg-charcoal-600/50 text-gray-400 hover:text-white'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="text-gray-600 text-sm">|</div>
          <span className="text-gray-400 text-sm">
            {photosPerPage} photos per page · {totalPages} page{totalPages !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Canvas Preview */}
        <div className="p-5 flex justify-center">
          {generating && !collageReady ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Rendering page…</p>
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
        {totalPages > 1 && (
          <div className="px-5 pb-2 flex items-center justify-center gap-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-lg bg-charcoal-600/50 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              <Icon name="chevronLeft" className="w-4 h-4" />
            </button>
            <span className="text-white text-sm font-medium">
              Page {currentPage + 1} / {totalPages}
            </span>
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
              ? `Exporting… ${progress}%`
              : `${photos.length} total proofs · preview page ${currentPage + 1}`}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button
              variant="secondary"
              onClick={downloadPNG}
              disabled={!collageReady || exporting}
            >
              <Icon name="download" className="w-4 h-4 mr-2" />
              Page PNG
            </Button>
            <Button
              onClick={downloadPDF}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Exporting…
                </>
              ) : (
                <>
                  <Icon name="download" className="w-4 h-4 mr-2" />
                  Download Full PDF
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
