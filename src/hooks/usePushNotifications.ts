import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  isPushSupported,
  notificationPermission,
  getExistingSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push'

interface PushState {
  supported: boolean
  permission: NotificationPermission | 'unsupported'
  enabled: boolean // 이 기기에 활성 구독이 있는지
  loading: boolean
  error: string | null
}

// 일정 리마인더 푸시 on/off 토글을 위한 훅.
export function usePushNotifications() {
  const { user } = useAuth()
  const [state, setState] = useState<PushState>({
    supported: isPushSupported(),
    permission: notificationPermission(),
    enabled: false,
    loading: true,
    error: null,
  })

  // 마운트 시 기존 구독 여부 동기화
  useEffect(() => {
    let alive = true
    getExistingSubscription()
      .then((sub) => {
        if (alive) setState((s) => ({ ...s, enabled: !!sub, loading: false }))
      })
      .catch(() => {
        if (alive) setState((s) => ({ ...s, loading: false }))
      })
    return () => {
      alive = false
    }
  }, [])

  const enable = useCallback(async () => {
    if (!user) {
      setState((s) => ({ ...s, error: '로그인 후 사용할 수 있어요.' }))
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const ok = await subscribeToPush(user.id)
      setState((s) => ({
        ...s,
        enabled: ok,
        permission: notificationPermission(),
        loading: false,
        error: ok ? null : '알림 권한이 거부되었어요. 브라우저/기기 설정에서 허용해 주세요.',
      }))
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : '알림 설정에 실패했어요.',
      }))
    }
  }, [user])

  const disable = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      await unsubscribeFromPush()
      setState((s) => ({ ...s, enabled: false, loading: false }))
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : '알림 해제에 실패했어요.',
      }))
    }
  }, [])

  const toggle = useCallback(() => {
    return state.enabled ? disable() : enable()
  }, [state.enabled, disable, enable])

  return { ...state, enable, disable, toggle }
}
