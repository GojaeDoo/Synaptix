import { useEffect, useMemo, useState } from 'react'
import RGL from 'react-grid-layout'
import { Move, X } from 'lucide-react'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { WeatherWidget } from '@/components/widgets/WeatherWidget'
import { StockWidget } from '@/components/widgets/StockWidget'
import { NewsWidget } from '@/components/widgets/NewsWidget'
import { CalendarWidget } from '@/components/widgets/CalendarWidget'
import { BudgetWidget } from '@/components/widgets/BudgetWidget'
import { ChatbotWidget } from '@/components/widgets/ChatbotWidget'
import { useWidgetStore, type Layouts } from '@/store/widgetStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { cn } from '@/lib/utils'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const { Responsive, WidthProvider } = RGL as unknown as {
  Responsive: typeof import('react-grid-layout').Responsive
  WidthProvider: typeof import('react-grid-layout').WidthProvider
}
const ResponsiveGridLayout = WidthProvider(Responsive)

const COLS = { lg: 12, md: 8, sm: 4 }
const BREAKPOINTS = { lg: 1024, md: 640, sm: 0 }

// 편집 모드 진입 시 5초간 노출되는 안내. 매번 새로 마운트시켜 setState-in-effect를 피한다.
function EditModeHint() {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setOpen(false), 5000)
    return () => clearTimeout(t)
  }, [])

  if (!open) return null
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg fade-up"
      style={{
        top: 80,
        background: 'rgba(26, 26, 26, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(49, 130, 246, 0.35)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <Move size={14} style={{ color: '#3182F6' }} />
      <p className="text-[12px] text-[#F2F2F7]">
        위젯을 <span className="text-[#3182F6] font-medium">드래그</span>해 옮기고,
        <span className="text-[#3182F6] font-medium"> 우하단 모서리</span>를 잡아 크기를 조절하세요
      </p>
      <button
        onClick={() => setOpen(false)}
        className="p-0.5 rounded-md text-[#636366] hover:text-[#F2F2F7] transition-colors cursor-pointer"
        aria-label="힌트 닫기"
      >
        <X size={12} />
      </button>
    </div>
  )
}

export function Dashboard() {
  const visibility = useWidgetStore((s) => s.visibility)
  const layouts = useWidgetStore((s) => s.layouts)
  const setLayouts = useWidgetStore((s) => s.setLayouts)
  const editMode = useWidgetStore((s) => s.editMode)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 639px)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const widgets = useMemo(() => {
    const all: { key: string; node: React.ReactNode; visible: boolean }[] = [
      { key: 'weather',  node: <WeatherWidget />,  visible: visibility.weather },
      { key: 'stocks',   node: <StockWidget />,    visible: visibility.stocks },
      { key: 'chat',     node: <ChatbotWidget />,  visible: !isMobile },
      { key: 'calendar', node: <CalendarWidget />, visible: visibility.calendar },
      { key: 'news',     node: <NewsWidget />,     visible: visibility.news },
      { key: 'budget',   node: <BudgetWidget />,   visible: visibility.budget },
    ]
    return all.filter((w) => w.visible)
  }, [visibility, isMobile])

  const filteredLayouts = useMemo<Layouts>(() => {
    const visibleKeys = new Set(widgets.map((w) => w.key))
    return {
      lg: layouts.lg.filter((l) => visibleKeys.has(l.i)),
      md: layouts.md.filter((l) => visibleKeys.has(l.i)),
      sm: layouts.sm.filter((l) => visibleKeys.has(l.i)),
    }
  }, [layouts, widgets])

  return (
    <DashboardLayout>
      {editMode && <EditModeHint key="hint" />}
      <div className={cn('px-2 sm:px-0', editMode && 'rgl-editing')}>
        <ResponsiveGridLayout
          className="layout"
          layouts={filteredLayouts}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={32}
          margin={[16, 16]}
          containerPadding={[8, 8]}
          isDraggable={editMode}
          isResizable={editMode}
          draggableHandle=".widget-drag-handle"
          compactType="vertical"
          onLayoutChange={(_, all) => {
            if (!editMode) return
            setLayouts({
              lg: all.lg ?? layouts.lg,
              md: all.md ?? layouts.md,
              sm: all.sm ?? layouts.sm,
            })
          }}
        >
          {widgets.map((w) => (
            <div key={w.key} className="relative h-full">
              <div className="widget-edit-wobble h-full w-full">
                <ErrorBoundary name={w.key}>{w.node}</ErrorBoundary>
              </div>
              {editMode && (
                <div
                  className="widget-drag-handle absolute inset-0 z-20 cursor-move rounded-2xl"
                  style={{
                    background: 'rgba(49,130,246,0.04)',
                    border: '1px dashed rgba(49,130,246,0.45)',
                  }}
                />
              )}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </DashboardLayout>
  )
}
