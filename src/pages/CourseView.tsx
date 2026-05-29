import { useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Route, Download, MapPinned } from 'lucide-react'
import { WidgetDetailLayout } from '@/layouts/WidgetDetailLayout'
import { useCourseStore } from '@/store/courseStore'
import { decodeCourse, courseSpan } from '@/lib/course'
import { PlaceMap } from './widgets/places/PlaceMap'
import { CourseTimeline } from './widgets/places/CourseTimeline'
import { ACCENT } from './widgets/places/constants'

// 공유 링크(/course?d=...)로 열리는 읽기전용 코스 뷰.
// d 파라미터는 신뢰할 수 없는 입력이므로 decodeCourse가 검증하고, 실패 시 안내를 보여준다.
export function CourseView() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const load = useCourseStore((s) => s.load)

  const course = useMemo(() => decodeCourse(params.get('d') ?? ''), [params])

  if (!course) {
    return (
      <WidgetDetailLayout title="코스" kicker="COURSE" accent={ACCENT}>
        <div className="rounded-2xl p-10 text-center" style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}>
          <MapPinned size={30} className="mx-auto mb-3 text-[#48484A]" />
          <p className="text-[14px] text-[#F2F2F7] font-medium">유효하지 않은 코스 링크예요</p>
          <p className="text-[12.5px] text-[#8E8E93] mt-1.5">링크가 손상됐거나 잘린 것 같아요. 보낸 사람에게 다시 받아보세요.</p>
          <button
            onClick={() => navigate('/widgets/places')}
            className="mt-5 h-9 px-4 rounded-xl text-[13px] font-medium cursor-pointer"
            style={{ background: ACCENT, color: '#0F0F0F' }}
          >
            내 코스 만들기
          </button>
        </div>
      </WidgetDetailLayout>
    )
  }

  const span = courseSpan(course)
  const points = course.stops.map((s) => ({ lat: s.location.lat, lng: s.location.lng, name: s.location.name }))

  const importCourse = () => {
    load(course)
    navigate('/widgets/places')
  }

  return (
    <WidgetDetailLayout
      title={course.title}
      kicker="COURSE"
      subtitle={[course.date, span ? `${span.start}–${span.end}` : null, `${course.stops.length}곳`].filter(Boolean).join(' · ')}
      accent={ACCENT}
      actions={
        <button
          onClick={importCourse}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] font-medium cursor-pointer"
          style={{ background: ACCENT, color: '#0F0F0F' }}
          title="이 코스를 내 코스로 가져와 편집"
        >
          <Download size={14} />
          내 코스로 가져오기
        </button>
      }
    >
      <div className="flex items-center gap-1.5 mb-4 text-[12px] text-[#8E8E93]">
        <Route size={14} style={{ color: ACCENT }} />
        공유받은 코스예요. 지도에서 동선을, 아래에서 시간표를 확인하세요.
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="h-[320px] lg:h-[480px] lg:sticky lg:top-4 order-1">
          <PlaceMap points={points} ordered />
        </div>
        <div className="order-2">
          <CourseTimeline stops={course.stops} />
        </div>
      </div>
    </WidgetDetailLayout>
  )
}
