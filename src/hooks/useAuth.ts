import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useChatStore } from '@/store/chatStore'
import { useDemoStore } from '@/store/demoStore'

// 같은 브라우저를 여러 사용자가 쓰는 경우의 leak 방지:
// chat(sessionStorage)·demo(localStorage) 두 스토어를 auth 경계마다 초기화.
function clearUserScopedStores() {
  useChatStore.getState().clearMessages()
  useDemoStore.getState().reset()
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let prevUserId: string | null = null
    supabase.auth.getSession().then(({ data }) => {
      prevUserId = data.session?.user.id ?? null
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      const nextUserId = s?.user.id ?? null
      // 사용자가 바뀌는 모든 경계(로그아웃, 다른 계정 로그인)에서 클리어
      if (event === 'SIGNED_OUT' || (nextUserId && nextUserId !== prevUserId)) {
        clearUserScopedStores()
      }
      prevUserId = nextUserId
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, user: session?.user ?? null, loading }
}

export async function signInWithGoogle() {
  // VITE_SITE_URL이 있으면 우선 사용 (preview/staging에서 prod로 잘못 리다이렉트 방지).
  // 미설정 시 현재 origin 사용 — Supabase Dashboard의 redirect URL 화이트리스트에
  // 모든 사용 도메인이 등록돼 있어야 함.
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: siteUrl },
  })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
