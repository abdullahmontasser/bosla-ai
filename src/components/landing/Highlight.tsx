import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface HighlightProps {
  text: string
  className?: string
  tone?: 'paper' | 'ink'
}

/**
 * Renders the **highlighted** fragments in sample copy without trusting the
 * source string as HTML.
 */
export function Highlight({ text, className, tone = 'paper' }: HighlightProps) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const value = part.slice(2, -2)
          return (
            <mark
              key={`${value}-${index}`}
              className={cn(
                'rounded-[2px] px-0.5 text-inherit',
                tone === 'paper'
                  ? 'bg-emerald-800/12 decoration-emerald-800/30'
                  : 'bg-emerald-300/14 decoration-emerald-300/30',
                className,
              )}
            >
              {value}
            </mark>
          )
        }

        return <span key={`text-${index}`}>{part}</span>
      })}
    </>
  )
}

interface SampleTagProps {
  children: ReactNode
  className?: string
}

export function SampleTag({ children, className }: SampleTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[3px] border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
      {children}
    </span>
  )
}
