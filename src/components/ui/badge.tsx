import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:   'bg-[#3182F6]/15 text-[#3182F6] border border-[#3182F6]/25',
        secondary: 'bg-[#222222] text-[#8E8E93] border border-[#2A2A2A]',
        success:   'bg-[#05D686]/15 text-[#05D686] border border-[#05D686]/25',
        warning:   'bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/25',
        danger:    'bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/25',
        demo:      'bg-[#3182F6]/12 text-[#3182F6]/80 border border-[#3182F6]/20',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
