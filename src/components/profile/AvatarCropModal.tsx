'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, ZoomIn, ZoomOut, RotateCcw, Trash2, Camera, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AvatarCropModalProps {
  isOpen: boolean
  onClose: () => void
  currentImage?: string | null
  userInitials: string
  lang: string
  onAvatarSaved: (newImage: string | null) => void
}

const CANVAS_SIZE = 320
const CROP_RADIUS = 120 // 240px circle

export function AvatarCropModal({
  isOpen,
  onClose,
  currentImage,
  userInitials,
  lang,
  onAvatarSaved,
}: AvatarCropModalProps) {
  const isAr = lang === 'ar'
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleClose = useCallback(() => {
    setImageObj(null)
    setScale(1)
    setOffset({ x: 0, y: 0 })
    setErrorMessage(null)
    setIsSaving(false)
    onClose()
  }, [onClose])

  // Draw the image and circular crop guide to canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageObj) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    ctx.save()
    // Center of canvas
    ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2)
    ctx.translate(offset.x, offset.y)
    ctx.scale(scale, scale)

    // Draw image centered
    const imgW = imageObj.width
    const imgH = imageObj.height
    // Base fit ratio to fill crop circle
    const baseFit = Math.max((CROP_RADIUS * 2) / imgW, (CROP_RADIUS * 2) / imgH)
    const drawW = imgW * baseFit
    const drawH = imgH * baseFit

    ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH)
    ctx.restore()

    // Draw dark overlay with clear circle cutout
    ctx.save()
    ctx.fillStyle = 'rgba(7, 9, 8, 0.65)'
    ctx.beginPath()
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CROP_RADIUS, 0, Math.PI * 2, true)
    ctx.fill()

    // Stroke circle border
    ctx.beginPath()
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CROP_RADIUS, 0, Math.PI * 2)
    ctx.strokeStyle = '#45d99a'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
  }, [imageObj, scale, offset])

  useEffect(() => {
    if (imageObj) {
      drawCanvas()
    }
  }, [imageObj, scale, offset, drawCanvas])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        isAr
          ? 'حجم الملف يتجاوز الحد الأقصى المسموح (5 ميجابايت)'
          : 'File exceeds 5 MB maximum size limit',
      )
      return
    }

    setErrorMessage(null)
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setImageObj(img)
        setScale(1)
        setOffset({ x: 0, y: 0 })
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch pan handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      setIsDragging(true)
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y })
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return
    const touch = e.touches[0]
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.1 : -0.1
    setScale((prev) => Math.min(Math.max(prev + delta, 0.8), 3))
  }

  // Generate cropped output canvas capped at 256x256 WebP < 50KB
  const handleSaveCropped = async () => {
    if (!imageObj) return

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const exportCanvas = document.createElement('canvas')
      const targetSize = 256
      exportCanvas.width = targetSize
      exportCanvas.height = targetSize
      const exportCtx = exportCanvas.getContext('2d')
      if (!exportCtx) throw new Error('Failed to get canvas context')

      // Fill with transparent or white background
      exportCtx.clearRect(0, 0, targetSize, targetSize)

      // Calculate source coordinates based on preview canvas and crop circle
      const ratio = targetSize / (CROP_RADIUS * 2)

      exportCtx.save()
      exportCtx.translate(targetSize / 2, targetSize / 2)
      exportCtx.translate(offset.x * ratio, offset.y * ratio)
      exportCtx.scale(scale * ratio, scale * ratio)

      const imgW = imageObj.width
      const imgH = imageObj.height
      const baseFit = Math.max((CROP_RADIUS * 2) / imgW, (CROP_RADIUS * 2) / imgH)
      const drawW = imgW * baseFit
      const drawH = imgH * baseFit

      exportCtx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH)
      exportCtx.restore()

      // Convert to WebP data URL with compression
      let quality = 0.85
      let dataUrl = exportCanvas.toDataURL('image/webp', quality)

      // Verify size limit <= 50KB (51,200 bytes)
      const base64Data = dataUrl.split(',')[1] || ''
      let sizeInBytes = (base64Data.length * 3) / 4

      if (sizeInBytes > 51200) {
        // Retry with lower quality
        quality = 0.65
        dataUrl = exportCanvas.toDataURL('image/webp', quality)
        const recheckData = dataUrl.split(',')[1] || ''
        sizeInBytes = (recheckData.length * 3) / 4
      }

      if (sizeInBytes > 51200) {
        throw new Error(
          isAr
            ? 'الصورة كبيرة جداً، يرجى اختيار صورة أصغر أو تقليل التقريب'
            : 'Image is too large. Please select a smaller photo.',
        )
      }

      // Persist to PATCH /api/profile/avatar
      const res = await fetch('/api/profile/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Failed to save avatar')
      }

      const result = await res.json()
      onAvatarSaved(result.image)
      onClose()
    } catch (err) {
      console.error(err)
      setErrorMessage(
        err instanceof Error ? err.message : isAr ? 'فشل حفظ الصورة' : 'Failed to save avatar',
      )
    } finally {
      setIsSaving(false)
    }
  }

  // Remove photo handler
  const handleRemovePhoto = async () => {
    setIsSaving(true)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: null }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Failed to remove avatar')
      }

      onAvatarSaved(null)
      onClose()
    } catch (err) {
      console.error(err)
      setErrorMessage(
        err instanceof Error ? err.message : isAr ? 'فشل إزالة الصورة' : 'Failed to remove photo',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-bold text-foreground">
            {isAr ? 'إدارة الصورة الشخصية' : 'Manage Profile Photo'}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            {isAr
              ? 'قم برفع صورتك وضبط موضعها وحجمها داخل الدائرة'
              : 'Upload, zoom, and center your avatar photo inside the circle.'}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-[8px] border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-4 py-2">
          {!imageObj ? (
            <div className="flex w-full flex-col items-center gap-4">
              {/* Current photo or monogram preview */}
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent text-[28px] font-bold text-primary shadow-inner">
                {currentImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>

              {/* Upload trigger button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group flex w-full flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-border bg-card/60 p-6 text-center transition-colors hover:border-primary/50 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-105">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[13px] font-semibold text-foreground">
                    {isAr ? 'اضغط لاختيار صورة' : 'Click to select a photo'}
                  </span>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {isAr
                      ? 'يدعم WebP و JPG و PNG حتى 5 ميجابايت'
                      : 'Supports WebP, JPG, and PNG up to 5 MB'}
                  </p>
                </div>
              </button>

              {currentImage && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isSaving}
                  onClick={handleRemovePhoto}
                  className="gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {isAr ? 'إزالة الصورة الحالية' : 'Remove current photo'}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {/* Interactive Canvas */}
              <div className="relative overflow-hidden rounded-lg border border-border shadow-md">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onWheel={handleWheel}
                  className="cursor-move touch-none bg-black"
                />
                <span className="absolute bottom-2 start-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-xs">
                  {isAr ? 'اسحب للتحريك' : 'Drag to reposition'}
                </span>
              </div>

              {/* Zoom Slider */}
              <div className="flex w-full items-center gap-2 px-4">
                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                <input
                  type="range"
                  min="0.8"
                  max="3"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="h-1.5 w-full cursor-pointer accent-primary"
                  aria-label={isAr ? 'درجة التقريب' : 'Zoom level'}
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => {
                    setScale(1)
                    setOffset({ x: 0, y: 0 })
                  }}
                  className="ms-1 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  title={isAr ? 'إعادة تعيين' : 'Reset view'}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Change selection */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[12px] font-medium text-primary underline-offset-4 hover:underline"
              >
                {isAr ? 'اختيار صورة أخرى' : 'Choose a different photo'}
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          {imageObj && (
            <Button type="button" onClick={handleSaveCropped} disabled={isSaving} className="gap-2">
              <Camera className="h-4 w-4" />
              {isSaving
                ? isAr
                  ? 'جارٍ الحفظ...'
                  : 'Saving...'
                : isAr
                  ? 'حفظ الصورة'
                  : 'Save photo'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
