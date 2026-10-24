import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-[#326cd6] active:scale-[0.98]',
        black:
          'bg-[#000000] text-[#ffffff] hover:bg-[#1a1a1a] dark:bg-[#ffffff] dark:text-[#000000] dark:hover:bg-[#e1e3e6] active:scale-[0.98]',
        secondary:
          'bg-secondary border border-border text-foreground hover:bg-[#e5e7eb] dark:hover:bg-[#242424]',
        outline:
          'border border-border bg-card hover:border-[#b8bfc8] dark:hover:border-[#686868] text-foreground',
        ghost: 'hover:bg-[#f5f5f7] dark:hover:bg-[#1f1f1f] text-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'text-[#006be6] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        sm: 'h-8 rounded-[6px] px-3 text-xs',
        lg: 'h-11 rounded-[8px] px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'
