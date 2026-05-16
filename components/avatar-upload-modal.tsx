// components/avatar-upload-modal.tsx — NUEVO
'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Upload, Camera, Check, Move, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onClose: () => void
  onUpload: (blob: Blob) => Promise<void>
}

export function AvatarUploadModal({ onClose, onUpload }: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const CROP_SIZE = 280 // Display size in modal
  const OUTPUT_SIZE = 400 // Final output resolution

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Imagen muy grande. Máximo 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
    reader.readAsDataURL(file)
  }

  // ── Initial fit when image loads ────────────────────────
  useEffect(() => {
    if (!imageSrc || !imageRef.current) return
    const img = imageRef.current
    const onLoad = () => {
      const naturalW = img.naturalWidth
      const naturalH = img.naturalHeight
      const fitScale = CROP_SIZE / Math.min(naturalW, naturalH)
      setScale(fitScale)
      setPosition({ x: 0, y: 0 })
    }
    if (img.complete) onLoad()
    else img.addEventListener('load', onLoad)
    return () => img.removeEventListener('load', onLoad)
  }, [imageSrc])

  // ── Drag handlers ───────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setIsDragging(true)
    setDragStart({ x: clientX - position.x, y: clientY - position.y })
  }

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      setPosition({ x: clientX - dragStart.x, y: clientY - dragStart.y })
    }
    const handleUp = () => setIsDragging(false)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    document.addEventListener('touchmove', handleMove, { passive: false })
    document.addEventListener('touchend', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleUp)
    }
  }, [isDragging, dragStart])

  // ── Crop & upload ───────────────────────────────────────
  const handleSave = async () => {
    if (!imageRef.current || !canvasRef.current) return
    setUploading(true)
    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!
      const img = imageRef.current
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE

      // Clear with white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

      // Calculate source rect from displayed position
      // The image is rendered at `scale` factor centered at position.x/y
      // We need to map the crop window (CROP_SIZE square in center) back to source coords
      const displayedW = img.naturalWidth * scale
      const displayedH = img.naturalHeight * scale
      const imgLeft = -displayedW / 2 + position.x  // relative to crop center
      const imgTop = -displayedH / 2 + position.y

      // The crop window is from -CROP_SIZE/2 to CROP_SIZE/2 (centered at 0,0)
      // We want to find where in source image those coords map to
      const cropLeftInDisplayed = -CROP_SIZE / 2 - imgLeft
      const cropTopInDisplayed = -CROP_SIZE / 2 - imgTop
      const sx = cropLeftInDisplayed / scale
      const sy = cropTopInDisplayed / scale
      const sSize = CROP_SIZE / scale

      // Apply circular clip
      ctx.beginPath()
      ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(b => resolve(b), 'image/jpeg', 0.85)
      })
      if (!blob) throw new Error('No se pudo procesar la imagen')

      await onUpload(blob)
      onClose()
    } catch (e) {
      console.error(e)
      alert('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setImageSrc(null)
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-gold">Cambiar foto de perfil</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!imageSrc ? (
          <div className="space-y-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-8 bg-muted/40 hover:bg-muted/60 border-2 border-dashed border-border hover:border-gold/50 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"
            >
              <Upload className="w-5 h-5" />
              <span>Selecciona una foto</span>
            </button>
            <p className="text-xs text-muted-foreground text-center">
              JPG o PNG, máximo 5 MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Crop area */}
            <div
              ref={containerRef}
              className="relative mx-auto bg-muted/40 rounded-xl overflow-hidden touch-none"
              style={{ width: CROP_SIZE, height: CROP_SIZE }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                className="absolute select-none pointer-events-none"
                style={{
                  width: imageRef.current ? `${imageRef.current.naturalWidth * scale}px` : 'auto',
                  height: imageRef.current ? `${imageRef.current.naturalHeight * scale}px` : 'auto',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
                draggable={false}
              />
              {/* Circular mask overlay */}
              <div className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, transparent ${CROP_SIZE / 2 - 1}px, rgba(0,0,0,0.6) ${CROP_SIZE / 2}px)`,
                }}
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[280px] h-[280px] rounded-full border-2 border-gold/60" style={{ width: CROP_SIZE, height: CROP_SIZE }} />
              </div>
            </div>

            {/* Zoom slider */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Move className="w-3.5 h-3.5" />
                <span>Arrastra la imagen · Usa el slider para zoom</span>
              </div>
              <input
                type="range"
                min={0.3}
                max={3}
                step={0.05}
                value={scale}
                onChange={e => setScale(parseFloat(e.target.value))}
                className="w-full accent-gold"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={reset}
                disabled={uploading}
                className="px-4 py-2.5 bg-muted hover:bg-muted/70 rounded-xl text-sm transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Otra foto
              </button>
              <button
                onClick={handleSave}
                disabled={uploading}
                className={cn(
                  'flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5',
                  uploading
                    ? 'bg-muted text-muted-foreground cursor-wait'
                    : 'bg-gold text-background hover:bg-gold/90'
                )}
              >
                <Check className="w-4 h-4" />
                {uploading ? 'Subiendo...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
