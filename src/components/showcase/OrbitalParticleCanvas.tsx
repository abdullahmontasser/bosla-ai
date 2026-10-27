'use client'

import { useRef, useEffect, useState, useCallback, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

interface OrbitalParticleCanvasProps {
  className?: string
  lang?: string
}

interface Particle {
  ringIndex: number
  angle: number
  speed: number
  tiltX: number
  tiltY: number
  tiltZ: number
  radiusA: number
  radiusB: number
  size: number
  brightness: number
  widthOffset: number
}

export function OrbitalParticleCanvas({ className, lang }: OrbitalParticleCanvasProps) {
  const isAr = lang === 'ar'
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [seed, setSeed] = useState(7)
  const [bearing, setBearing] = useState(256)
  const [isDragging, setIsDragging] = useState(false)

  // 3D Rotation angles and velocities
  const rotRef = useRef({ x: 0.38, y: -0.48, vx: 0, vy: 0.003 })
  const pointerRef = useRef({ isDown: false, lastX: 0, lastY: 0, moved: false })
  const particlesRef = useRef<Particle[]>([])
  const pulseRef = useRef(0)
  const dimsRef = useRef({ width: 600, height: 500, dpr: 1 })
  const isVisibleRef = useRef(true)
  const prefersReducedMotion = useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      mq.addEventListener?.('change', callback)
      return () => mq.removeEventListener?.('change', callback)
    },
    () =>
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false,
    () => false,
  )

  // Initialize dense stardust ribbon particles
  const initParticles = useCallback((s: number) => {
    const list: Particle[] = []
    const ringCount = 4
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const particlesPerRing = isMobile ? 350 : 850

    let seedVal = s * 2357
    const pseudoRandom = () => {
      seedVal = (seedVal * 16807) % 2147483647
      return (seedVal - 1) / 2147483646
    }

    // 4 Distinct Orbital Inclinations matching award reference
    const ringTilts = [
      { rx: 0.72, ry: 0.35, rz: 0.15, ra: 165, rb: 92, speed: 0.0035 },
      { rx: -0.85, ry: -0.45, rz: -0.25, ra: 178, rb: 86, speed: -0.0038 },
      { rx: 1.25, ry: -0.72, rz: 0.45, ra: 152, rb: 90, speed: 0.0042 },
      { rx: -0.28, ry: 1.35, rz: -0.4, ra: 170, rb: 102, speed: -0.0032 },
    ]

    for (let r = 0; r < ringCount; r++) {
      const ring = ringTilts[r]
      for (let i = 0; i < particlesPerRing; i++) {
        const angle = (i / particlesPerRing) * Math.PI * 2
        // Dense ribbon distribution: Gaussian-like spread from ring center
        const widthSpread = (pseudoRandom() + pseudoRandom() - 1) * 22

        list.push({
          ringIndex: r,
          angle,
          speed: ring.speed * (0.85 + pseudoRandom() * 0.3),
          tiltX: ring.rx + (pseudoRandom() - 0.5) * 0.04,
          tiltY: ring.ry + (pseudoRandom() - 0.5) * 0.04,
          tiltZ: ring.rz + (pseudoRandom() - 0.5) * 0.04,
          radiusA: ring.ra + widthSpread,
          radiusB: ring.rb + widthSpread,
          size: 1.1 + pseudoRandom() * 2.2,
          brightness: 0.45 + pseudoRandom() * 0.55,
          widthOffset: widthSpread,
        })
      }
    }

    particlesRef.current = list
  }, [])

  // Reforge trigger on click
  const handleReforge = useCallback(() => {
    if (pointerRef.current.moved) return
    const nextSeed = (seed % 99) + 1
    setSeed(nextSeed)
    pulseRef.current = 1.0
    initParticles(nextSeed)
  }, [seed, initParticles])

  // Pointer interaction handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignore fallback
    }
    pointerRef.current = {
      isDown: true,
      lastX: e.clientX,
      lastY: e.clientY,
      moved: false,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerRef.current.isDown) return
    const dx = e.clientX - pointerRef.current.lastX
    const dy = e.clientY - pointerRef.current.lastY

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      pointerRef.current.moved = true
    }

    rotRef.current.y += dx * 0.006
    rotRef.current.x += dy * 0.006
    rotRef.current.vx = dy * 0.0035
    rotRef.current.vy = dx * 0.0035

    pointerRef.current.lastX = e.clientX
    pointerRef.current.lastY = e.clientY

    const deg = Math.round(((-rotRef.current.y * 180) / Math.PI) % 360)
    setBearing(deg < 0 ? deg + 360 : deg)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false)
    pointerRef.current.isDown = false
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // Ignore fallback
    }
  }

  // High-Density 3D Particle & Chrome Core Engine
  useEffect(() => {
    initParticles(seed)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animationFrameId: number

    // Measure dimensions via ResizeObserver instead of inside 60fps render loop
    const updateDimensions = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      dimsRef.current = {
        width: rect.width || 600,
        height: rect.height || 500,
        dpr,
      }
      const targetW = Math.round((rect.width || 600) * dpr)
      const targetH = Math.round((rect.height || 500) * dpr)
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW
        canvas.height = targetH
      }
    }
    updateDimensions()

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            updateDimensions()
          })
        : null
    resizeObserver?.observe(canvas)

    // Pause rendering loop when off-screen to save CPU/GPU cycles
    const intersectionObserver =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            ([entry]) => {
              const wasVisible = isVisibleRef.current
              isVisibleRef.current = entry.isIntersecting
              if (!wasVisible && entry.isIntersecting) {
                animationFrameId = requestAnimationFrame(render)
              }
            },
            { threshold: 0.05 },
          )
        : null
    intersectionObserver?.observe(canvas)

    const render = () => {
      if (!isVisibleRef.current) return

      const { width, height, dpr } = dimsRef.current

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2

      // Apply inertia damping
      rotRef.current.vx *= 0.94
      rotRef.current.vy *= 0.94
      rotRef.current.x += rotRef.current.vx
      rotRef.current.y += rotRef.current.vy

      // Ambient auto-rotation (respects prefers-reduced-motion)
      if (!pointerRef.current.isDown && !prefersReducedMotion) {
        rotRef.current.y += 0.002
      }

      const rotX = rotRef.current.x
      const rotY = rotRef.current.y

      const cosX = Math.cos(rotX)
      const sinX = Math.sin(rotX)
      const cosY = Math.cos(rotY)
      const sinY = Math.sin(rotY)

      // Handle reforge pulse shockwave
      if (pulseRef.current > 0.01) {
        pulseRef.current *= 0.93
      } else {
        pulseRef.current = 0
      }

      const sphereRadius = 46 * (1 + Math.sin(pulseRef.current * Math.PI) * 0.14)

      // Project 3D particles with true rotation matrix
      interface ProjectedParticle {
        x2d: number
        y2d: number
        z: number
        size: number
        alpha: number
        ringIndex: number
      }

      const projected: ProjectedParticle[] = []
      const particles = particlesRef.current

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.angle += p.speed

        // Parametric point on 3D inclined ellipse
        const u = p.angle
        const x0 = Math.cos(u) * p.radiusA
        const y0 = Math.sin(u) * p.radiusB
        const z0 = p.widthOffset * 0.4

        // Tilt rotations
        const cxT = Math.cos(p.tiltX)
        const sxT = Math.sin(p.tiltX)
        const cyT = Math.cos(p.tiltY)
        const syT = Math.sin(p.tiltY)

        const y1 = y0 * cxT - z0 * sxT
        const z1 = y0 * sxT + z0 * cxT

        const x2 = x0 * cyT + z1 * syT
        const y2 = y1
        const z2 = -x0 * syT + z1 * cyT

        // Camera root rotation
        const x3 = x2 * cosY + z2 * sinY
        const y3 = y2
        const z3 = -x2 * sinY + z2 * cosY

        const xFinal = x3
        const yFinal = y3 * cosX - z3 * sinX
        const zFinal = y3 * sinX + z3 * cosX

        // Perspective projection (focal length ~ 500)
        const fov = 500
        const scale = fov / (fov + zFinal)

        const x2d = cx + xFinal * scale
        const y2d = cy + yFinal * scale

        // Distance alpha attenuation
        const depthNorm = (zFinal + 200) / 400
        const clampedDepth = Math.max(0.15, Math.min(1.0, depthNorm))
        const alpha = p.brightness * (0.35 + clampedDepth * 0.65)

        projected.push({
          x2d,
          y2d,
          z: zFinal,
          size: p.size * scale,
          alpha,
          ringIndex: p.ringIndex,
        })
      }

      // Depth sorting
      projected.sort((a, b) => a.z - b.z)

      // Draw background particles (behind sphere: z < 0)
      ctx.globalCompositeOperation = 'lighter'
      let splitIdx = 0
      while (splitIdx < projected.length && projected[splitIdx].z < 0) {
        const pt = projected[splitIdx]
        ctx.fillStyle = `rgba(255, 255, 255, ${pt.alpha * 0.7})`
        ctx.beginPath()
        ctx.arc(pt.x2d, pt.y2d, pt.size * 0.85, 0, Math.PI * 2)
        ctx.fill()
        splitIdx++
      }

      // Draw Central Chrome Metallic Core Sphere
      ctx.globalCompositeOperation = 'source-over'

      // Sphere Outer Ambient Shadow / Glow
      const glowGrad = ctx.createRadialGradient(
        cx,
        cy,
        sphereRadius * 0.6,
        cx,
        cy,
        sphereRadius * 1.5,
      )
      glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)')
      glowGrad.addColorStop(0.5, 'rgba(150, 160, 180, 0.04)')
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = glowGrad
      ctx.beginPath()
      ctx.arc(cx, cy, sphereRadius * 1.5, 0, Math.PI * 2)
      ctx.fill()

      // Metallic Chrome Sphere Body with High-Contrast Specular Gleam
      const sphereGrad = ctx.createRadialGradient(
        cx - sphereRadius * 0.35,
        cy - sphereRadius * 0.35,
        sphereRadius * 0.08,
        cx,
        cy,
        sphereRadius,
      )
      sphereGrad.addColorStop(0, '#ffffff')
      sphereGrad.addColorStop(0.15, '#e4e4e7')
      sphereGrad.addColorStop(0.35, '#71717a')
      sphereGrad.addColorStop(0.7, '#27272a')
      sphereGrad.addColorStop(0.95, '#09090b')
      sphereGrad.addColorStop(1, '#000000')

      ctx.fillStyle = sphereGrad
      ctx.beginPath()
      ctx.arc(cx, cy, sphereRadius, 0, Math.PI * 2)
      ctx.fill()

      // Etched Luminous Filament Rings wrapping the Chrome Sphere
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, sphereRadius, 0, Math.PI * 2)
      ctx.clip()

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
      ctx.lineWidth = 1.2

      // Filament Latitude Lines
      for (let lat = -2; lat <= 2; lat++) {
        const latY = cy + (lat * sphereRadius) / 3
        const rAtY = Math.sqrt(Math.max(0, sphereRadius * sphereRadius - (latY - cy) * (latY - cy)))
        if (rAtY > 2) {
          ctx.beginPath()
          ctx.ellipse(cx, latY, Math.abs(rAtY), Math.abs(rAtY * 0.35), rotX * 0.5, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // Filament Longitude Curves
      for (let lon = -2; lon <= 2; lon++) {
        const rLon = Math.abs(sphereRadius * 0.32 * lon)
        if (rLon > 1) {
          ctx.beginPath()
          ctx.ellipse(cx, cy, rLon, sphereRadius, rotY * 0.4, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
      ctx.restore()

      // Draw Foreground Particles (in front of sphere: z >= 0)
      ctx.globalCompositeOperation = 'lighter'
      for (let i = splitIdx; i < projected.length; i++) {
        const pt = projected[i]
        ctx.fillStyle = `rgba(255, 255, 255, ${pt.alpha})`
        ctx.beginPath()
        ctx.arc(pt.x2d, pt.y2d, pt.size, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
    }
  }, [seed, initParticles, prefersReducedMotion])

  return (
    <div
      className={cn(
        'relative w-full h-full min-h-[440px] sm:min-h-[500px] flex items-center justify-center select-none overflow-hidden rounded-2xl bg-zinc-950 border border-border/80 dark:border-white/[0.08] shadow-2xl backdrop-blur-sm touch-none transition-colors duration-300',
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleReforge}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
    >
      {/* High-Resolution Dynamic Canvas */}
      <div className="hidden" />

      {/* Technical HUD Overlay - Direct match to award reference */}
      {/* Top Left: Compass Bearing */}
      <div className="absolute top-4 left-5 pointer-events-none z-10 flex items-center gap-2">
        <span className="font-mono text-xs tracking-wider text-white/80 font-semibold">
          N {bearing}°
        </span>
      </div>

      {/* Top Right: System Label */}
      <div className="absolute top-4 right-5 pointer-events-none z-10 flex items-center gap-2">
        <span className="font-mono text-2xs tracking-widest text-white/70 uppercase">
          CAREER · 3D
        </span>
      </div>

      {/* Bottom Left: Microcopy Instruction */}
      <div className="absolute bottom-4 left-5 pointer-events-none z-10">
        <span className="font-mono text-2xs tracking-wider text-white/80">
          {isAr ? 'اسحب للتدوير · انقر لإعادة التشكيل' : 'Drag to rotate · Click to reforge'}
        </span>
      </div>

      {/* Bottom Right: Active Seed Status */}
      <div className="absolute bottom-4 right-5 pointer-events-none z-10 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono text-2xs tracking-wider text-white/80 font-semibold">
          seed {String(seed).padStart(5, '0')}
        </span>
      </div>
    </div>
  )
}
