import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

// 비로그인 사용자에게 "데모 모드로 둘러보는 중"임을 알리는 상단 네비 칩.
// 공간을 거의 안 먹는 작은 칩으로 항상 노출하고, 클릭하면 설명 + 로그인 팝오버를 연다.
export function DemoModeChip() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (loading || session) return null

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-[11px] font-medium border border-accent/30 bg-accent/[0.12] text-accent-light hover:bg-accent/20 transition-colors cursor-pointer"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="데모 모드 안내"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-accent-light" aria-hidden="true" />
        데모
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="데모 모드 안내"
          className="absolute left-0 mt-2 w-64 rounded-xl overflow-hidden z-40 bg-[#161616] border border-[#262626] shadow-xl"
        >
          <div className="p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center justify-center w-[22px] h-[22px] rounded-md bg-accent/[0.22] shrink-0">
                <Sparkles size={12} className="text-accent-light" aria-hidden="true" />
              </div>
              <p className="text-[13px] text-t1 font-medium">데모 모드로 둘러보는 중</p>
            </div>
            <p className="text-[11.5px] text-t2 leading-relaxed">
              추가한 할 일·거래는 이 브라우저에만 저장돼요. 다른 기기에서도 사용하려면 로그인하세요.
            </p>
          </div>
          <button
            onClick={() => { setOpen(false); navigate('/login') }}
            className="w-full h-9 text-[12px] font-medium text-white bg-accent hover:bg-accent-hover transition-colors cursor-pointer"
          >
            로그인하기
          </button>
        </div>
      )}
    </div>
  )
}
