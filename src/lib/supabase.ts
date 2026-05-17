import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// 프로덕션 빌드에서 env 누락 → 즉시 throw (deploy 실수 fail-fast).
// dev에서는 placeholder로 폴백해 인증과 무관한 화면 작업이 가능하도록 유지.
if (!url || !key) {
  if (import.meta.env.PROD) {
    throw new Error(
      '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 설정되지 않았습니다. ' +
        'Vercel → Project Settings → Environment Variables 에 두 값을 추가하세요.',
    )
  }
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 설정되지 않았습니다. ' +
      'dev placeholder로 폴백합니다 — 로그인/DB 기능은 동작하지 않습니다.',
  )
}

export const isSupabaseConfigured = Boolean(url && key)

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder',
)
