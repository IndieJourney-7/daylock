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
   COLLAGE GENERATOR — export room photos as collage
   ═══════════════════════════════════════════════════ */

function CollageModal({ photos, roomName, roomEmoji, onClose }) {
  const canvasRef = useRef(null)
  const [generating, setGenerating] = useState(false)
  const [collageReady, setCollageReady] = useState(false)
  const [layout, setLayout] = useState('grid') // grid | timeline

  const generateCollage = useCallback(async () => {
    if (!photos.length) return
    setGenerating(true)
    setCollageReady(false)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Determine grid size
    const count = Math.min(photos.length, 20) // max 20 photos in collage
    const cols = count <= 4 ? 2 : count <= 9 ? 3 : 4
    const rows = Math.ceil(count / cols)
    
    const cellSize = 280
    const gap = 8
    const headerHeight = 100
    const footerHeight = 60
    const padding = 24

    canvas.width = cols * cellSize + (cols - 1) * gap + padding * 2
    canvas.height = headerHeight + rows * cellSize + (rows - 1) * gap + footerHeight + padding * 2

    // Background
    ctx.fillStyle = '#111827'
    ctx.roundRect(0, 0, canvas.width, canvas.height, 16)
    ctx.fill()

    // Header
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px system-ui, -apple-system, sans-serif'
    ctx.fillText(`${roomEmoji} ${roomName}`, padding, padding + 40)
    
    ctx.fillStyle = '#9ca3af'
    ctx.font = '16px system-ui, -apple-system, sans-serif'
    ctx.fillText(`${photos.length} approved proofs · DayLock Journey`, padding, padding + 68)

    // Load and draw images
    const selectedPhotos = photos.slice(0, count)
    
    const loadImage = (url) => new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = url
    })

    const images = await Promise.all(selectedPhotos.map(p => loadImage(p.proof_url)))

    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      if (!img) continue
      
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = padding + col * (cellSize + gap)
      const y = headerHeight + padding + row * (cellSize + gap)

      // Draw rounded rect clip
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(x, y, cellSize, cellSize, 12)
      ctx.clip()

      // Draw image (cover fit)
      const scale = Math.max(cellSize / img.width, cellSize / img.height)
      const w = img.width * scale
      const h = img.height * scale
      ctx.drawImage(img, x - (w - cellSize) / 2, y - (h - cellSize) / 2, w, h)

      // Date overlay
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(x, y + cellSize - 36, cellSize, 36)
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px system-ui, -apple-system, sans-serif'
      ctx.fillText(formatDate(selectedPhotos[i].date), x + 8, y + cellSize - 12)

      ctx.restore()
    }

    // Footer
    const footerY = canvas.height - footerHeight + 10
    ctx.fillStyle = '#6b7280'
    ctx.font = '13px system-ui, -apple-system, sans-serif'
    ctx.fillText(`Generated on ${new Date().toLocaleDateString()} · DayLock — Lock Your Day`, padding, footerY + 20)

    // Accent line
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(padding, footerY - 5, 60, 3)

    setGenerating(false)
    setCollageReady(true)
  }, [photos, roomName, roomEmoji, layout])

  useEffect(() => {
    generateCollage()
  }, [generateCollage])

  const downloadCollage = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `daylock-${roomName.toLowerCase().replace(/\s+/g, '-')}-collage.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-charcoal-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-charcoal-400/20">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-charcoal-400/10">
          <div>
            <h3 className="text-white font-bold text-lg">Export Collage</h3>
            <p className="text-gray-500 text-sm">
              {roomEmoji} {roomName} · {photos.length} photos
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-charcoal-600/50 text-gray-400 hover:text-white transition-colors"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Preview */}
        <div className="p-5 flex justify-center">
          <canvas 
            ref={canvasRef} 
            className="max-w-full rounded-xl shadow-2xl border border-charcoal-400/10"
            style={{ maxHeight: '60vh', objectFit: 'contain' }}
          />
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-charcoal-400/10 flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            {generating ? 'Generating collage...' : `${Math.min(photos.length, 20)} photos in collage`}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={downloadCollage} 
              disabled={!collageReady || generating}
            >
              <Icon name="download" className="w-4 h-4 mr-2" />
              Download PNG
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
