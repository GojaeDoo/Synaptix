import { useState } from 'react'
import { Zap, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle } from '@/hooks/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'

export function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    isSupabaseConfigured
      ? null
      : 'Supabase 환경변수가 설정되지 않았습니다. .env에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY를 추가하세요.',
  )

  const handleGoogle = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="h-full w-full flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm rounded-3xl relative overflow-hidden bg-card border border-white/[0.07] px-7 py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
        />

        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-accent blur-xl opacity-50" />
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5BA3FF] via-accent to-[#1a5fd4] flex items-center justify-center shadow-lg shadow-accent/30 ring-1 ring-white/10">
              <Zap size={18} strokeWidth={2.6} className="text-white drop-shadow" aria-hidden="true" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[20px] font-semibold tracking-tight text-t1 leading-none mb-2">
              Synaptix
            </p>
            <p className="font-pixel text-[8px] text-t4 tracking-[0.18em]">
              DASHBOARD
            </p>
          </div>
        </div>

        <p className="text-center text-[13px] text-t3 mb-7 leading-relaxed">
          내 가계부와 일정을 한곳에서.<br />
          시작하려면 로그인해주세요.
        </p>

        <button
          onClick={handleGoogle}
          disabled={loading || !isSupabaseConfigured}
          className="w-full h-12 rounded-xl flex items-center justify-center gap-3 text-[14px] font-medium bg-white text-[#1F1F1F] hover:bg-[#f1f1f1] disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <GoogleIcon />
          {loading ? '이동 중…' : 'Google로 계속하기'}
        </button>

        {error && (
          <p className="text-center text-[12px] text-down mt-4">{error}</p>
        )}

        {/* 데모 둘러보기 — 로그인 없이도 체험할 수 있도록 */}
        <div className="mt-5 pt-5 flex flex-col items-center gap-2 border-t border-white/[0.06]">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-[12px] text-t3 hover:text-t1 transition-colors cursor-pointer"
          >
            로그인 없이 둘러보기
            <ArrowRight size={11} aria-hidden="true" />
          </button>
        </div>

        <p className="text-center text-[11px] text-t5 mt-6 leading-relaxed">
          로그인 시 본인의 데이터만 안전하게<br />
          보관·조회됩니다.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.614z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}
