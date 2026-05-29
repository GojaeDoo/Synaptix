import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { WidgetDetailLayout } from '@/layouts/WidgetDetailLayout'
import { usePlaceSearch } from '@/hooks/usePlaceSearch'
import { useMyLocation } from '@/hooks/useMyLocation'
import { useTodos } from '@/hooks/useTodos'
import { useCourseStore } from '@/store/courseStore'
import { toLocation } from '@/lib/places'
import type { Place } from '@/types'
import { PlaceMap } from './places/PlaceMap'
import { PlaceResultList } from './places/PlaceResultList'
import { CoursePanel } from './places/CoursePanel'
import { ACCENT, fieldStyle, SUGGESTIONS } from './places/constants'

const todayISO = () => new Date().toISOString().slice(0, 10)

export function PlacesDetail() {
  const [params, setParams] = useSearchParams()
  const initialQuery = params.get('q') ?? ''

  const [input, setInput] = useState(initialQuery)
  const [query, setQuery] = useState(initialQuery)
  const [date, setDate] = useState(todayISO())
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const [mapView, setMapView] = useState<'search' | 'course'>('search')

  const myLocation = useMyLocation()
  const { places, isLoading, isDemoMode } = usePlaceSearch(query, myLocation ?? undefined)
  const { addTodo } = useTodos()
  const addStop = useCourseStore((s) => s.addStop)
  const courseStops = useCourseStore((s) => s.stops)

  const submit = (q: string) => {
    const trimmed = q.trim()
    setInput(q)
    setQuery(trimmed)
    setParams(trimmed ? { q: trimmed } : {}, { replace: true })
  }

  const onAdd = (place: Place) => {
    addTodo.mutate({
      title: place.name,
      completed: false,
      due_date: date,
      priority: 'medium',
      location: toLocation(place),
    })
    setAddedIds((prev) => new Set(prev).add(place.id))
  }

  const onAddToCourse = (place: Place) => {
    addStop(toLocation(place), place.category || '')
  }

  return (
    <WidgetDetailLayout
      title="장소"
      kicker="PLACES"
      subtitle={isDemoMode ? '카카오 장소 검색 · 데모 데이터' : '검색해서 일정에 추가하세요'}
      accent={ACCENT}
    >
      {/* 검색 바 */}
      <form
        onSubmit={(e) => { e.preventDefault(); submit(input) }}
        className="flex items-center gap-2 mb-4"
      >
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636366]" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="장소·키워드 검색 (예: 강남 파스타, 데이트 코스)"
            aria-label="장소 검색"
            style={{ ...fieldStyle, paddingLeft: 34, width: '100%' }}
          />
        </div>
        <button
          type="submit"
          className="h-10 px-4 rounded-[10px] text-[13px] font-medium cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: ACCENT, color: '#0F0F0F' }}
        >
          검색
        </button>
      </form>

      {/* 추천 검색어 + 일정 날짜 */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              className="text-[12px] px-2.5 py-1 rounded-full text-[#AEAEB2] hover:text-white bg-white/[0.05] hover:bg-white/[0.1] transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[12px] text-[#8E8E93] shrink-0">
          일정 날짜
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="추가할 일정 날짜"
            style={{ ...fieldStyle, height: 34, width: 150 }}
          />
        </label>
      </div>

      {/* 지도 + 결과 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="order-1 lg:sticky lg:top-4 flex flex-col gap-2">
          {/* 지도 보기 토글: 검색 위치 ↔ 코스 로드맵 */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.05] self-start">
            {([['search', '검색 위치'], ['course', `내 코스${courseStops.length ? ` (${courseStops.length})` : ''}`]] as const).map(
              ([v, label]) => (
                <button
                  key={v}
                  onClick={() => setMapView(v)}
                  className="h-7 px-3 rounded-lg text-[12px] font-medium transition-colors cursor-pointer"
                  style={
                    mapView === v
                      ? { background: ACCENT, color: '#0F0F0F' }
                      : { color: '#AEAEB2', background: 'transparent' }
                  }
                >
                  {label}
                </button>
              ),
            )}
          </div>
          <div className="h-[300px] lg:h-[440px]">
            <PlaceMap
              points={
                mapView === 'course'
                  ? courseStops.map((s) => ({ lat: s.location.lat, lng: s.location.lng, name: s.location.name }))
                  : places.map((p) => ({ lat: p.lat, lng: p.lng, name: p.name }))
              }
              ordered={mapView === 'course'}
              focus={mapView === 'search' ? focus : null}
              myLocation={mapView === 'search' ? myLocation : null}
            />
          </div>
        </div>
        <div className="order-2">
          <PlaceResultList
            places={places}
            isLoading={isLoading}
            query={query}
            addedIds={addedIds}
            onFocus={(p) => setFocus({ lat: p.lat, lng: p.lng })}
            onAdd={onAdd}
            onAddToCourse={onAddToCourse}
          />
        </div>
      </div>

      {/* 코스(동선) 빌더 */}
      <div className="mt-6">
        <CoursePanel />
      </div>
    </WidgetDetailLayout>
  )
}
