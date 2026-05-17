import { cn } from '@/lib/utils'

interface SpinnerProps { className?: string; size?: 'sm' | 'md' | 'lg' }

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-[#2A2A2A] border-t-[#3182F6]',
        sizes[size],
        className
      )}
    />
  )
}
