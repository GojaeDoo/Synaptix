import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const DISMISS_KEY = 'synaptix-demo-banner-dismissed'

// 비로그인 사용자에게 "지금 둘러보는 중이고 데이터는 로컬에만 저장된다"는 점을
// 알려주는 상단 배너. 닫으면 localStorage에 기억해서 같은 세션에서는 다시 안 뜸.
export function DemoModeBanner() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(DISMISS_KEY) === '1'
  })

  // 로그인하면 자동으로 닫고 dismissal도 리셋(다음 로그아웃 시 다시 뜨도록)
  useEffect(() => {
    if (session) window.localStorage.removeItem(DISMISS_KEY)
  }, [session])

  if (loading || session || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    window.localStorage.setItem(DISMISS_KEY, '1')
  }

  return (
    <div
      role="status"
      className="relative mx-2 sm:mx-0 mb-3 rounded-xl overflow-hidden border border-accent/30 bg-gradient-to-r from-accent/[0.14] to-accent-light/[0.08]"
    >
      <div className="flex items-center gap-3 px-4 py-3 sm:py-2.5">
        <div className="flex items-center justify-center w-[26px] h-[26px] rounded-md bg-accent/[0.22] shrink-0">
          <Sparkles size={13} className="text-accent-light" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-t1 font-medium leading-tight">
            데모 모드로 둘러보는 중이에요
          </p>
          <p className="text-[11px] text-t2 leading-tight mt-0.5">
            추가한 할 일·거래는 이 브라우저에만 저장됩니다. 다른 기기에서도 사용하려면 로그인하세요.
          </p>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="shrink-0 h-8 px-3 rounded-lg text-[12px] font-medium text-white bg-accent hover:bg-accent-hover transition-colors cursor-pointer"
        >
          로그인하기
        </button>

        <button
          onClick={handleDismiss}
          aria-label="배너 닫기"
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-t3 hover:text-t1 hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
