import { Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="h-full w-full flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm rounded-3xl relative overflow-hidden bg-card border border-white/[0.07] px-7 pt-12 pb-9">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
        />

        {/* 404 pixel badge */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <p
            className="font-pixel text-[52px] text-t1 tracking-[0.04em] leading-none"
            style={{ textShadow: '4px 4px 0 rgba(49,130,246,0.35)' }}
          >
            404
          </p>
          <p className="font-pixel text-[8px] text-t4 tracking-[0.22em]">
            NOT FOUND
          </p>
        </div>

        <p className="text-center text-[14px] text-t1 font-medium mb-2">
          찾을 수 없는 페이지예요
        </p>
        <p className="text-center text-[12px] text-t3 mb-8 leading-relaxed">
          주소가 잘못되었거나, 페이지가 옮겨졌을 수 있어요.<br />
          대시보드로 돌아가서 다시 시도해보세요.
        </p>

        <button
          onClick={() => navigate('/', { replace: true })}
          className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-[14px] font-medium text-white bg-accent hover:bg-accent-hover transition-colors cursor-pointer"
        >
          <Home size={15} strokeWidth={2} aria-hidden="true" />
          대시보드로 돌아가기
        </button>
      </div>
    </div>
  )
}
