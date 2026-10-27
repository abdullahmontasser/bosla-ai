'use client'

import { type ReactNode, useSyncExternalStore } from 'react'
import { motion, useReducedMotion } from 'motion/react'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  variant?: 'rise' | 'fade' | 'settle'
  id?: string
}

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function ScrollReveal({
  children,
  className,
  delay = 0,
  variant = 'rise',
  id,
}: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion()
  const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (
    shouldReduceMotion ||
    !isMounted ||
    typeof window === 'undefined' ||
    typeof window.IntersectionObserver === 'undefined'
  ) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    )
  }

  const variants = {
    rise: { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } },
    fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
    settle: { hidden: { opacity: 0, scale: 0.985 }, visible: { opacity: 1, scale: 1 } },
  }[variant]

  return (
    <motion.div
      id={id}
      initial={variants.hidden}
      whileInView={variants.visible}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: variant === 'settle' ? 0.6 : 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
