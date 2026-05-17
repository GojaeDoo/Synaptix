import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-xl border border-[#2A2A2A] bg-[#222222] px-3 py-2',
        'text-sm text-[#F2F2F7] placeholder:text-[#48484A]',
        'focus:outline-none focus:ring-2 focus:ring-[#3182F6]/40 focus:border-[#3182F6]/50',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = 'Input'
