import { Cloud, TrendingUp, Newspaper, CalendarDays, Wallet, Sparkles } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'

const SCROLL_TABS = [
  { id: 'weather',  label: '날씨',   icon: Cloud },
  { id: 'stocks',   label: '주식',   icon: TrendingUp },
  { id: 'news',     label: '뉴스',   icon: Newspaper },
  { id: 'calendar', label: '캘린더', icon: CalendarDays },
  { id: 'budget',   label: '가계부', icon: Wallet },
] as const

export function BottomNav() {
  const { isOpen, toggleChat } = useChatStore()

  const scrollTo = (id: string) => {
    document.getElementById(`widget-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const btnBase: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '10px 12px',
    borderRadius: 16,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    minWidth: 52,
    color: '#636366',
    transition: 'color 0.15s, background 0.15s',
  }

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30">
      <div
        style={{
          background: 'rgba(15,15,15,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid #2A2A2A',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* 탭 행 — 상하 패딩 넉넉하게 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '14px 8px 20px' }}>

          {SCROLL_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              style={btnBase}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#F2F2F7'; e.currentTarget.style.background = '#1A1A1A' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#636366'; e.currentTarget.style.background = 'none' }}
            >
              <Icon size={22} strokeWidth={1.7} />
              <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
            </button>
          ))}

          {/* AI 탭 */}
          <button
            onClick={toggleChat}
            style={{
              ...btnBase,
              color: isOpen ? '#3182F6' : '#636366',
              background: isOpen ? 'rgba(49,130,246,0.15)' : 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#3182F6'; e.currentTarget.style.background = 'rgba(49,130,246,0.1)' }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isOpen ? '#3182F6' : '#636366'
              e.currentTarget.style.background = isOpen ? 'rgba(49,130,246,0.15)' : 'none'
            }}
          >
            <Sparkles size={22} strokeWidth={1.7} />
            <span style={{ fontSize: 11, fontWeight: 500 }}>AI</span>
          </button>

        </div>
      </div>
    </nav>
  )
}
