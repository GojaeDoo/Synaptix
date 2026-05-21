import { WidgetDetailLayout } from '@/layouts/WidgetDetailLayout'

// 현재 날씨 로딩 중 스켈레톤.
export function LoadingState() {
  return (
    <WidgetDetailLayout title="날씨" kicker="WEATHER" subtitle="현재 날씨와 예보" accent="#60A5FA">
      <div className="grid gap-4">
        <div className="skeleton h-44 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </WidgetDetailLayout>
  )
}
