import { useState, useEffect, useRef } from 'react'
import { RefreshCw, LogOut, LayoutGrid, Check, LogIn, Sparkles } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth, signOut } from '@/hooks/useAuth'
import { useWidgetStore } from '@/store/widgetStore'
import { useChatStore } from '@/store/chatStore'
import { DemoModeChip } from '@/components/DemoModeChip'

const PAGE_TITLES: Record<string, string> = {
  '/widgets/weather':  '날씨',
  '/widgets/stocks':   '시장',
  '/widgets/news':     '해커뉴스',
  '/widgets/calendar': '할 일',
  '/widgets/budget':   '가계부',
  '/widgets/places':   '장소',
  '/course':           '공유 코스',
}

export function TopNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [spinning, setSpinning] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()
  const { user } = useAuth()
  const editMode = useWidgetStore((s) => s.editMode)
  const toggleEditMode = useWidgetStore((s) => s.toggleEditMode)
  const resetLayouts = useWidgetStore((s) => s.resetLayouts)
  const chatOpen = useChatStore((s) => s.isOpen)
  const toggleChat = useChatStore((s) => s.toggleChat)

  const isDashboard = pathname === '/'
  const pageTitle = PAGE_TITLES[pathname] ?? null

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? ''
  const initial = (displayName || '?').trim().charAt(0).toUpperCase()

  const handleRefresh = () => {
    setSpinning(true)
    qc.invalidateQueries()
    setTimeout(() => setSpinning(false), 800)
  }

  return (
    <header className="sticky top-0 z-30 bg-[#0F0F0F] border-b border-[#1F1F1F] safe-top">
      <div className="flex items-center justify-between h-12 px-4 sm:px-6 lg:px-8">

        {/* Brand + breadcrumb */}
        <nav className="flex items-center gap-2 text-[14px] leading-none min-w-0" aria-label="현재 위치">
          <button
            onClick={() => navigate('/')}
            className="-ml-1.5 px-1.5 py-1 rounded-md font-bold tracking-tight text-[#F2F2F7] hover:bg-white/[0.04] transition-colors cursor-pointer shrink-0"
            aria-label="대시보드로 이동"
          >
            Synaptix
          </button>
          {pageTitle && (
            <>
              <span className="text-[#3A3A3A] font-normal shrink-0" aria-hidden>/</span>
              <span className="text-[#8E8E93] font-normal truncate">{pageTitle}</span>
            </>
          )}
          <DemoModeChip />
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">

          {/* AI 채팅 토글 — 데스크톱 전용. 대시보드엔 챗봇 위젯 타일이 따로 있어 제외.
              (모바일은 하단 네비의 AI 탭이 담당) */}
          {!isDashboard && (
            <button
              onClick={toggleChat}
              className={cn(
                'hidden lg:flex items-center gap-1.5 h-7 px-2.5 mr-1 rounded-md text-[12px] transition-colors cursor-pointer',
                chatOpen
                  ? 'bg-[rgba(49,130,246,0.15)] text-[#3182F6]'
                  : 'text-[#8E8E93] hover:text-[#F2F2F7] hover:bg-white/[0.04]'
              )}
              aria-pressed={chatOpen}
              title="AI 어시스턴트"
            >
              <Sparkles size={13} />
              <span>AI</span>
            </button>
          )}

          {isDashboard && (
            <>
              {editMode && (
                <button
                  onClick={resetLayouts}
                  className="h-7 px-2 rounded-md text-[12px] text-[#8E8E93] hover:text-[#F2F2F7] hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  초기화
                </button>
              )}
              <button
                onClick={toggleEditMode}
                className={cn(
                  'flex items-center gap-1.5 h-7 px-2 rounded-md text-[12px] transition-colors cursor-pointer',
                  editMode
                    ? 'bg-white/[0.08] text-[#F2F2F7]'
                    : 'text-[#8E8E93] hover:text-[#F2F2F7] hover:bg-white/[0.04]'
                )}
                aria-pressed={editMode}
                title={editMode ? '편집 완료' : '레이아웃 편집'}
              >
                {editMode ? <Check size={12} /> : <LayoutGrid size={12} />}
                <span>{editMode ? '완료' : '편집'}</span>
              </button>
            </>
          )}

          <button
            onClick={handleRefresh}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[#8E8E93] hover:text-[#F2F2F7] hover:bg-white/[0.04] transition-colors cursor-pointer"
            title="새로고침"
            aria-label="새로고침"
          >
            <RefreshCw size={12} className={cn(spinning && 'animate-spin')} />
          </button>

          {!user ? (
            <button
              onClick={() => navigate('/login')}
              className="ml-1 flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] text-[#F2F2F7] hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="Google 계정으로 로그인"
            >
              <LogIn size={12} aria-hidden="true" />
              <span className="hidden sm:inline">로그인</span>
            </button>
          ) : (
            <div ref={menuRef} className="relative ml-1">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-[#1F1F1F] text-[#F2F2F7] text-[11px] font-medium hover:ring-1 hover:ring-white/20 transition-all cursor-pointer"
                title={displayName}
                aria-label={`${displayName} 계정 메뉴`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  initial
                )}
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-lg overflow-hidden z-40 bg-[#161616] border border-[#262626] shadow-xl"
                >
                  <div className="px-3 py-2.5 border-b border-[#1F1F1F]">
                    <p className="text-[12px] text-[#F2F2F7] font-medium truncate leading-tight">{displayName}</p>
                    <p className="text-[10px] text-[#636366] mt-1 leading-none">로그인됨</p>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); void signOut() }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] text-[#8E8E93] hover:text-[#F2F2F7] hover:bg-white/[0.04] transition-colors cursor-pointer"
                    role="menuitem"
                  >
                    <LogOut size={12} aria-hidden="true" />
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  )
}
