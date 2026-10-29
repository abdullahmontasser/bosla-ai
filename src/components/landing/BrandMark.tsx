import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
  size?: number
}

export function BrandMark({ className, size = 30 }: BrandMarkProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[7px] border border-primary/30 bg-primary/10 text-primary',
        className,
      )}
      aria-hidden
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 30 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="15" cy="15" r="9.25" stroke="currentColor" strokeOpacity="0.48" />
        <path
          d="M15 3.5v3.1M15 23.4v3.1M3.5 15h3.1M23.4 15h3.1"
          stroke="currentColor"
          strokeOpacity="0.48"
          strokeLinecap="round"
        />
        <path
          d="M19.55 10.45 16.4 16.4l-5.95 3.15 3.15-5.95 5.95-3.15Z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <circle cx="15" cy="15" r="1.25" fill="currentColor" />
      </svg>
    </span>
  )
}
