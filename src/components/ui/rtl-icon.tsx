import { ComponentType, SVGProps } from 'react'
import { cn } from '@/lib/utils'

interface RtlIconProps extends SVGProps<SVGSVGElement> {
  icon: ComponentType<
    SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }
  >
  className?: string
  size?: number | string
  strokeWidth?: number | string
}

export function RtlIcon({ icon: Icon, className, ...props }: RtlIconProps) {
  return <Icon className={cn('rtl:rotate-180 transition-transform', className)} {...props} />
}
