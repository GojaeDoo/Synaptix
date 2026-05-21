import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { TopNav } from '@/components/navigation/TopNav'
import { BottomNav } from '@/components/navigation/BottomNav'
import { AppBackground } from './AppBackground'

// 위젯 카드 우상단의 픽셀 라벨(BUDGET, NEWS 등)과 상세 페이지 헤더의 연속성을 유지하기 위해 동일한 픽셀 키커를 노출한다.
const PIXEL = "'Press Start 2P', monospace"

interface Props {
  title: string
  kicker?: string
  subtitle?: string
  accent?: string
  actions?: ReactNode
  children: ReactNode
}

export function WidgetDetailLayout({ title, kicker, subtitle, accent = '#3182F6', actions, children }: Props) {
  const navigate = useNavigate()

  return (
    <div className="h-full flex flex-col relative">
      <AppBackground />
      <TopNav />

      <main
        id="main-scroll"
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 xl:px-10 pb-[calc(110px_+_env(safe-area-inset-bottom,0px))] lg:pb-8"
      >
        <div className="max-w-6xl mx-auto py-6 sm:py-8">
          {/* page header */}
          <div className="flex items-start justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-start gap-3">
              <button
                onClick={() => navigate('/')}
                className="shrink-0 mt-1 w-8 h-8 flex items-center justify-center rounded-xl text-[#8E8E93] hover:text-[#F2F2F7] hover:bg-white/[0.06] transition-colors cursor-pointer"
                aria-label="대시보드로 돌아가기"
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                {kicker && (
                  <p
                    className="mb-2"
                    style={{
                      fontFamily: PIXEL,
                      fontSize: '9px',
                      color: accent,
                      letterSpacing: '0.14em',
                    }}
                  >
                    {kicker}
                  </p>
                )}
                <h1
                  className="text-[24px] sm:text-[28px] font-semibold leading-tight tracking-tight"
                  style={{ color: '#F2F2F7' }}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-[13px] mt-1.5" style={{ color: '#8E8E93' }}>
                    {subtitle}
                  </p>
                )}
                <div
                  aria-hidden
                  className="mt-3 h-[2px] w-10 rounded-full"
                  style={{ background: accent }}
                />
              </div>
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>

          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
