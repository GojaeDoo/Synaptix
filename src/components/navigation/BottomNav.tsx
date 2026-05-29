import { Cloud, TrendingUp, Newspaper, CalendarDays, Wallet, MapPin, Sparkles } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useChatStore } from '@/store/chatStore'

const NAV_TABS = [
  { path: '/widgets/weather',  label: '날씨',   icon: Cloud },
  { path: '/widgets/stocks',   label: '주식',   icon: TrendingUp },
  { path: '/widgets/news',     label: '뉴스',   icon: Newspaper },
  { path: '/widgets/calendar', label: '캘린더', icon: CalendarDays },
  { path: '/widgets/budget',   label: '가계부', icon: Wallet },
  { path: '/widgets/places',   label: '장소',   icon: MapPin },
] as const

export function BottomNav() {
  const { isOpen, toggleChat } = useChatStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const btnBase: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '6px 10px',
    borderRadius: 14,
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
          paddingBottom: 0,
        }}
      >
        {/* 탭 행 — 하단 여백은 safe-area-inset이 처리하므로 최소화 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '6px 8px' }}>

          {NAV_TABS.map(({ path, label, icon: Icon }) => {
            const active = pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{
                  ...btnBase,
                  color: active ? '#3182F6' : '#636366',
                  background: active ? 'rgba(49,130,246,0.12)' : 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = active ? '#3182F6' : '#F2F2F7'; e.currentTarget.style.background = active ? 'rgba(49,130,246,0.12)' : '#1A1A1A' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = active ? '#3182F6' : '#636366'; e.currentTarget.style.background = active ? 'rgba(49,130,246,0.12)' : 'none' }}
              >
                <Icon size={22} strokeWidth={1.7} />
                <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
              </button>
            )
          })}

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
