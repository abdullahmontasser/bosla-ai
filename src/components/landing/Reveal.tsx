'use client'

import { useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface RevealProps {
  children: ReactNode
  className?: string
  variant?: 'rise' | 'lines'
  stagger?: number
  start?: string
}

/**
 * A small, scoped reveal primitive. It animates only elements marked with
 * `data-reveal` (or `data-line-inner` for clipped type), so large sections stay
 * in the server-rendered markup and one timeline owns each group.
 */
export function Reveal({
  children,
  className,
  variant = 'rise',
  stagger = 0.08,
  start = 'top 85%',
}: RevealProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    gsap.registerPlugin(ScrollTrigger)
    const media = gsap.matchMedia()

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const lineItems = Array.from(root.querySelectorAll<HTMLElement>('[data-line-inner]'))
      const revealItems = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))

      if (!lineItems.length && !revealItems.length) return

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start,
          once: true,
          invalidateOnRefresh: true,
        },
      })

      if (variant === 'lines' && lineItems.length) {
        timeline.fromTo(
          lineItems,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 1.05,
            stagger: Math.max(stagger, 0.08),
            ease: 'power2.out',
          },
          0,
        )
      }

      if (revealItems.length) {
        timeline.fromTo(
          revealItems,
          { y: variant === 'lines' ? 10 : 14, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            stagger,
            ease: 'power2.out',
          },
          variant === 'lines' ? 0.16 : 0,
        )
      }

      return () => timeline.kill()
    })

    let active = true
    const refresh = () => {
      if (active) ScrollTrigger.refresh()
    }

    document.fonts?.ready.then(refresh).catch(() => undefined)

    return () => {
      active = false
      media.revert()
    }
  }, [variant, stagger, start])

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  )
}
