import { Bell, BellOff, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePushNotifications } from '@/hooks/usePushNotifications'

// 일정 하루 전 아침에 푸시 알림을 받을지 토글하는 버튼.
// 캘린더 상세 페이지 헤더(actions)에 배치된다.
export function NotificationToggle() {
  const { supported, enabled, loading, error, toggle } = usePushNotifications()

  if (!supported) {
    return (
      <span className="text-xs text-[#8E8E93]" title="iPhone은 홈 화면에 추가한 PWA에서만 지원됩니다.">
        알림 미지원 환경
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={enabled ? 'secondary' : 'outline'}
        size="sm"
        onClick={toggle}
        disabled={loading}
        title={enabled ? '일정 알림이 켜져 있어요' : '일정 하루 전 아침에 알림을 받아요'}
      >
        {enabled ? (
          <BellRing className="size-3.5 text-[#3182F6]" />
        ) : loading ? (
          <Bell className="size-3.5 animate-pulse" />
        ) : (
          <BellOff className="size-3.5" />
        )}
        {enabled ? '알림 켜짐' : '일정 알림 받기'}
      </Button>
      {error && <span className="text-[11px] text-[#FF453A] max-w-[220px] text-right">{error}</span>}
    </div>
  )
}
