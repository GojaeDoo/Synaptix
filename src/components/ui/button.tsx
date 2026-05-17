import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3182F6]/50 disabled:pointer-events-none disabled:opacity-40 cursor-pointer',
  {
    variants: {
      variant: {
        default:     'bg-[#3182F6] text-white hover:bg-[#2272E8] active:bg-[#1A65D6]',
        secondary:   'bg-[#222222] text-[#F2F2F7] hover:bg-[#2A2A2A] border border-[#2A2A2A]',
        ghost:       'text-[#8E8E93] hover:text-[#F2F2F7] hover:bg-[#222222]',
        outline:     'border border-[#2A2A2A] text-[#8E8E93] hover:bg-[#222222] hover:text-[#F2F2F7]',
        destructive: 'bg-[#FF453A]/15 text-[#FF453A] hover:bg-[#FF453A]/25 border border-[#FF453A]/20',
        link:        'text-[#3182F6] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm:      'h-7 px-3 text-xs rounded-lg',
        lg:      'h-11 px-6',
        icon:    'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = 'Button'
