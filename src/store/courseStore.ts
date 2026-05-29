import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '@/lib/uid'
import type { Course, CourseStop, PlaceLocation } from '@/types'

// 작성 중인 코스(초안) 하나를 브라우저에 보관한다.
// 공유는 링크 인코딩 방식이라 백엔드/로그인이 필요 없고, 초안만 localStorage에 유지한다.

interface CourseState {
  title: string
  date: string | null
  stops: CourseStop[]
  setTitle: (title: string) => void
  setDate: (date: string | null) => void
  // 장소를 코스에 추가. 마지막 stop의 끝시각을 시작으로 1시간 블록을 기본값으로.
  addStop: (location: PlaceLocation, memo?: string) => void
  updateStop: (id: string, patch: Partial<Omit<CourseStop, 'id'>>) => void
  removeStop: (id: string) => void
  reorderStops: (from: number, to: number) => void
  // 공유 링크로 받은 코스를 내 초안으로 불러온다.
  load: (course: Course) => void
  clear: () => void
}

function addHour(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const next = (h + 1) % 24
  return `${String(next).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set) => ({
      title: '우리 코스',
      date: null,
      stops: [],

      setTitle: (title) => set({ title }),
      setDate: (date) => set({ date }),

      addStop: (location, memo = '') =>
        set((s) => {
          const last = s.stops[s.stops.length - 1]
          const startTime = last ? last.endTime : '14:00'
          const stop: CourseStop = {
            id: uid(),
            startTime,
            endTime: addHour(startTime),
            memo,
            location,
          }
          return { stops: [...s.stops, stop] }
        }),

      updateStop: (id, patch) =>
        set((s) => ({
          stops: s.stops.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)),
        })),

      removeStop: (id) =>
        set((s) => ({ stops: s.stops.filter((stop) => stop.id !== id) })),

      reorderStops: (from, to) =>
        set((s) => {
          if (from === to || from < 0 || to < 0 || from >= s.stops.length || to >= s.stops.length) {
            return {}
          }
          const next = [...s.stops]
          const [moved] = next.splice(from, 1)
          next.splice(to, 0, moved)
          return { stops: next }
        }),

      load: (course) => set({ title: course.title, date: course.date, stops: course.stops }),

      clear: () => set({ title: '우리 코스', date: null, stops: [] }),
    }),
    { name: 'synaptix-course-draft' }
  )
)
