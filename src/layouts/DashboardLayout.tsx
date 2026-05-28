import type { ReactNode } from 'react'
import { TopNav } from '@/components/navigation/TopNav'
import { BottomNav } from '@/components/navigation/BottomNav'
import { AppBackground } from './AppBackground'

interface Props { children: ReactNode }

export function DashboardLayout({ children }: Props) {
  return (
    <div className="h-full flex flex-col relative">
      <AppBackground />
      <TopNav />
      <main
        id="main-scroll"
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain sm:px-6 lg:px-8 xl:px-10 pb-[calc(72px_+_env(safe-area-inset-bottom,0px))] lg:pb-6"
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
