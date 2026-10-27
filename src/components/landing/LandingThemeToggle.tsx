'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LandingThemeToggleProps {
  labels: {
    label: string
    toLight: string
    toDark: string
  }
  className?: string
}

/**
 * Compact theme control for the public nav. It writes through next-themes, so
 * the choice is shared with the workspace and survives a route change.
 */
export function LandingThemeToggle({ labels, className }: LandingThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const isDark = resolvedTheme === 'dark'
  const label = !mounted ? labels.label : isDark ? labels.toLight : labels.toDark

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[7px] border border-border bg-card/60 text-muted-foreground transition-colors hover:border-primary/35 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-9 sm:w-9',
        className,
      )}
    >
      <span className="relative flex h-4 w-4 items-center justify-center" aria-hidden>
        <Sun className="absolute h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
      </span>
    </button>
  )
}
