import { z } from 'zod'
import { uid } from '@/lib/uid'
import type { Course, CourseStop } from '@/types'

// 코스의 순수 로직 — UI/상태와 분리해 단위 테스트가 가능하도록 모았다.
// 시간 계산, 정렬, 그리고 공유 링크 인코딩/디코딩(+ 검증)을 담당한다.
//
// 디코딩은 "URL은 신뢰할 수 없는 입력"이라는 원칙으로 다룬다. 누군가 링크를 조작하거나
// 깨진 데이터를 넣어도 앱이 죽지 않도록, 디코딩 결과를 Zod로 검증하고 실패 시 null을 돌려준다.

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// 시작 시각 기준 오름차순. 동률이면 원래 순서 유지(안정 정렬).
export function sortStops(stops: CourseStop[]): CourseStop[] {
  return [...stops].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
}

export function formatTimeRange(stop: Pick<CourseStop, 'startTime' | 'endTime'>): string {
  return `${stop.startTime}–${stop.endTime}`
}

// 코스 전체의 시작~끝 시각. stop이 없으면 null.
export function courseSpan(course: Course): { start: string; end: string } | null {
  if (course.stops.length === 0) return null
  const sorted = sortStops(course.stops)
  return { start: sorted[0].startTime, end: sorted[sorted.length - 1].endTime }
}

// ── 공유 링크 인코딩 ──────────────────────────────────────────
// URL을 짧게 유지하려고 짧은 키로 압축한다. (st=start, et=end, m=memo,
// n=name, a=address, y=lat, x=lng, c=category, u=url)
const MAX_STOPS = 20

const CompactStopSchema = z.object({
  st: z.string().regex(HHMM),
  et: z.string().regex(HHMM),
  m: z.string().max(100),
  n: z.string().min(1).max(100),
  a: z.string().max(200),
  y: z.number().finite(),
  x: z.number().finite(),
  c: z.string().max(50).optional(),
  u: z.string().max(400).nullable().optional(),
})

const CompactCourseSchema = z.object({
  t: z.string().max(100),
  d: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  s: z.array(CompactStopSchema).min(1).max(MAX_STOPS),
})

type CompactCourse = z.infer<typeof CompactCourseSchema>

function toCompact(course: Course): CompactCourse {
  return {
    t: course.title,
    d: course.date,
    s: course.stops.map((stop) => ({
      st: stop.startTime,
      et: stop.endTime,
      m: stop.memo,
      n: stop.location.name,
      a: stop.location.address,
      y: stop.location.lat,
      x: stop.location.lng,
      ...(stop.location.category ? { c: stop.location.category } : {}),
      ...(stop.location.url ? { u: stop.location.url } : {}),
    })),
  }
}

function fromCompact(c: CompactCourse): Course {
  return {
    title: c.t,
    date: c.d,
    stops: c.s.map((s) => ({
      id: uid(),
      startTime: s.st,
      endTime: s.et,
      memo: s.m,
      location: {
        name: s.n,
        address: s.a,
        lat: s.y,
        lng: s.x,
        category: s.c,
        url: s.u ?? null,
      },
    })),
  }
}

// UTF-8(한글 포함) 안전한 base64url 인코딩.
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(b64: string): string {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(padded)
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

// 코스 → URL 파라미터 문자열. stop이 없으면 빈 문자열.
export function encodeCourse(course: Course): string {
  if (course.stops.length === 0) return ''
  return toBase64Url(JSON.stringify(toCompact(course)))
}

// URL 파라미터 → 코스. 조작/손상된 입력은 null로 거른다(신뢰할 수 없는 입력).
export function decodeCourse(param: string): Course | null {
  if (!param) return null
  try {
    const json = JSON.parse(fromBase64Url(param))
    const parsed = CompactCourseSchema.safeParse(json)
    if (!parsed.success) return null
    return fromCompact(parsed.data)
  } catch {
    return null
  }
}
