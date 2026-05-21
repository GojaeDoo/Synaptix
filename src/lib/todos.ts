import { parseISO, isBefore, startOfDay } from 'date-fns'
import type { Todo } from '@/types'

// 할 일(캘린더) 위젯의 순수 그룹화/필터/집계 로직 — UI/상태와 분리해 단위 테스트가 가능하도록 모았다.
// CalendarDetail과 그 하위 컴포넌트가 공유한다.

export type StatusFilter = 'all' | 'pending' | 'done'
export type PriorityFilter = 'all' | Todo['priority']

export const PRIORITY_RANK: Record<Todo['priority'], number> = { high: 0, medium: 1, low: 2 }

// 마감일(due_date) 기준으로 묶는다. 마감일 없는 항목은 제외.
export function groupByDate(todos: Todo[]): Record<string, Todo[]> {
  const map: Record<string, Todo[]> = {}
  for (const t of todos) {
    if (!t.due_date) continue
    if (!map[t.due_date]) map[t.due_date] = []
    map[t.due_date].push(t)
  }
  return map
}

// 오늘 0시 이전이 마감인 미완료 항목 수.
export function overdueCount(todos: Todo[], now: Date): number {
  const todayStart = startOfDay(now)
  return todos.filter(
    (t) => !t.completed && t.due_date && isBefore(parseISO(t.due_date), todayStart),
  ).length
}

export interface TodoFilters {
  search: string
  status: StatusFilter
  priority: PriorityFilter
}

function applyFilters(list: Todo[], f: TodoFilters): Todo[] {
  const q = f.search.trim().toLowerCase()
  let out = list
  if (q) out = out.filter((t) => t.title.toLowerCase().includes(q))
  if (f.status === 'pending') out = out.filter((t) => !t.completed)
  if (f.status === 'done') out = out.filter((t) => t.completed)
  if (f.priority !== 'all') out = out.filter((t) => t.priority === f.priority)
  return out
}

// 선택 날짜의 할 일을 필터링 후 (미완료 우선, 그다음 우선순위 순) 정렬.
export function visibleTodos(todos: Todo[], selectedDate: string, f: TodoFilters): Todo[] {
  const list = applyFilters(todos.filter((t) => t.due_date === selectedDate), f)
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  })
}

// 날짜와 무관하게 필터만 적용한 전체 개수 ("다른 날짜에 N개" 안내용).
export function filteredCount(todos: Todo[], f: TodoFilters): number {
  return applyFilters(todos, f).length
}

export interface TodoCounts {
  total: number
  pending: number
  done: number
}

export function counts(todos: Todo[]): TodoCounts {
  const done = todos.filter((t) => t.completed).length
  return { total: todos.length, pending: todos.length - done, done }
}
