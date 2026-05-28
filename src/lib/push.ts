import { supabase } from '@/lib/supabase'

// 웹 푸시 구독 관리.
// - 브라우저(서비스워커 + PushManager) 지원 여부 판별
// - 알림 권한 요청 + PushManager 구독
// - 구독 정보를 Supabase push_subscriptions 테이블에 저장 (서버 발송용)
//
// iOS는 "홈 화면에 추가된 PWA"에서만 푸시를 허용한다 (iOS 16.4+).
// Safari 일반 탭에서는 PushManager가 없으므로 isPushSupported가 false가 된다.

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

// VAPID 공개키(base64url) → Uint8Array. applicationServerKey 형식 요구사항.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

/** 현재 브라우저에 활성 구독이 있는지 */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

/**
 * 알림 권한을 요청하고 푸시를 구독한 뒤 Supabase에 저장한다.
 * 성공 시 true, 권한 거부/미지원이면 false.
 */
export async function subscribeToPush(userId: string): Promise<boolean> {
  if (!isPushSupported()) {
    throw new Error('이 브라우저/환경에서는 푸시 알림을 지원하지 않습니다. (iPhone은 홈 화면에 추가한 뒤 사용하세요)')
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error('VITE_VAPID_PUBLIC_KEY 가 설정되지 않았습니다.')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const reg = await navigator.serviceWorker.ready
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    }))

  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw error

  return true
}

/** 구독 해제 + Supabase에서 제거 */
export async function unsubscribeFromPush(): Promise<void> {
  const sub = await getExistingSubscription()
  if (!sub) return
  const endpoint = sub.endpoint
  await sub.unsubscribe()
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  if (error) throw error
}
