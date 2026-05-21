import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  addYears,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  differenceInCalendarDays,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Transaction } from '@/types'

// 가계부의 순수 계산 로직 — UI/상태와 분리해 단위 테스트가 가능하도록 모았다.
// 컴포넌트(BudgetDetail)와 useBudgetRange 훅이 공유한다.

export type TypeFilter = 'all' | 'income' | 'expense'
export type SortMode = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'
export type RangeMode = 'day' | 'week' | 'month' | 'year' | 'custom' | 'all'

export const WEEK_OPTS = { weekStartsOn: 1 as const }

export interface DateRange {
  start: Date
  end: Date
}

// 모드별 시작·종료. 'all'은 null로 두고 호출부에서 분기.
export function getRange(
  mode: RangeMode,
  anchor: Date,
  customStart: string,
  customEnd: string,
): DateRange | null {
  switch (mode) {
    case 'day':
      return { start: startOfDay(anchor), end: endOfDay(anchor) }
    case 'week':
      return { start: startOfWeek(anchor, WEEK_OPTS), end: endOfWeek(anchor, WEEK_OPTS) }
    case 'month':
      return { start: startOfMonth(anchor), end: endOfMonth(anchor) }
    case 'year':
      return { start: startOfYear(anchor), end: endOfYear(anchor) }
    case 'custom': {
      const s = parseISO(customStart)
      const e = parseISO(customEnd)
      const lo = s <= e ? s : e
      const hi = s <= e ? e : s
      return { start: startOfDay(lo), end: endOfDay(hi) }
    }
    case 'all':
      return null
  }
}

export function filterByRange(txns: Transaction[], range: DateRange | null): Transaction[] {
  if (!range) return txns
  return txns.filter((t) => {
    const d = parseISO(t.date)
    return d >= range.start && d <= range.end
  })
}

export interface Summary {
  income: number
  expense: number
  balance: number
}

export function summarize(txns: Transaction[]): Summary {
  const income = txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  return { income, expense, balance: income - expense }
}

export interface TrendPoint {
  label: string
  수입: number
  지출: number
}

interface Bucket {
  label: string
  from: Date
  to: Date
}

// 모드별로 추이 차트의 버킷 단위를 자동 선택한다.
export function computeTrend(
  txns: Transaction[],
  mode: RangeMode,
  anchor: Date,
  range: DateRange | null,
): TrendPoint[] {
  let buckets: Bucket[] = []

  if (mode === 'day') {
    const days = eachDayOfInterval({ start: subDays(anchor, 6), end: anchor })
    buckets = days.map((d) => ({ label: format(d, 'M/d'), from: startOfDay(d), to: endOfDay(d) }))
  } else if (mode === 'week') {
    const weeks = eachWeekOfInterval({ start: subWeeks(anchor, 5), end: anchor }, WEEK_OPTS)
    buckets = weeks.map((w) => ({
      label: format(startOfWeek(w, WEEK_OPTS), 'M/d'),
      from: startOfWeek(w, WEEK_OPTS),
      to: endOfWeek(w, WEEK_OPTS),
    }))
  } else if (mode === 'month') {
    const months = eachMonthOfInterval({
      start: subMonths(startOfMonth(anchor), 5),
      end: startOfMonth(anchor),
    })
    buckets = months.map((m) => ({
      label: format(m, 'M월', { locale: ko }),
      from: startOfMonth(m),
      to: endOfMonth(m),
    }))
  } else if (mode === 'year') {
    const months = eachMonthOfInterval({ start: startOfYear(anchor), end: endOfYear(anchor) })
    buckets = months.map((m) => ({
      label: format(m, 'M월', { locale: ko }),
      from: startOfMonth(m),
      to: endOfMonth(m),
    }))
  } else if (mode === 'custom' && range) {
    const days = differenceInCalendarDays(range.end, range.start)
    if (days <= 31) {
      const list = eachDayOfInterval({ start: range.start, end: range.end })
      buckets = list.map((d) => ({ label: format(d, 'M/d'), from: startOfDay(d), to: endOfDay(d) }))
    } else if (days <= 365) {
      const list = eachMonthOfInterval({ start: range.start, end: range.end })
      buckets = list.map((m) => ({
        label: format(m, 'yy/M'),
        from: startOfMonth(m),
        to: endOfMonth(m),
      }))
    } else {
      const years = new Set<number>()
      let cur = startOfYear(range.start)
      while (cur <= range.end) {
        years.add(cur.getFullYear())
        cur = addYears(cur, 1)
      }
      buckets = Array.from(years)
        .sort()
        .map((y) => ({
          label: `${y}`,
          from: new Date(y, 0, 1),
          to: new Date(y, 11, 31, 23, 59, 59),
        }))
    }
  } else if (mode === 'all' && txns.length > 0) {
    const years = new Set<number>()
    for (const t of txns) years.add(parseISO(t.date).getFullYear())
    buckets = Array.from(years)
      .sort()
      .map((y) => ({
        label: `${y}`,
        from: new Date(y, 0, 1),
        to: new Date(y, 11, 31, 23, 59, 59),
      }))
  }

  return buckets.map((b) => {
    const slice = txns.filter((t) => {
      const d = parseISO(t.date)
      return d >= b.from && d <= b.to
    })
    return {
      label: b.label,
      수입: slice.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      지출: slice.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  })
}

export function trendTitle(mode: RangeMode, anchor: Date): string {
  return mode === 'day'
    ? '최근 7일 추이'
    : mode === 'week'
      ? '최근 6주 추이'
      : mode === 'month'
        ? '최근 6개월 추이'
        : mode === 'year'
          ? `${format(anchor, 'yyyy년')} 월별 추이`
          : mode === 'custom'
            ? '기간 내 추이'
            : '연도별 추이'
}

export interface PieSlice {
  name: string
  value: number
}

// 선택 기간 내 지출을 카테고리별로 합산(내림차순).
export function computePie(rangeTxns: Transaction[]): PieSlice[] {
  return Object.entries(
    rangeTxns
      .filter((t) => t.type === 'expense')
      .reduce(
        (acc, t) => ({ ...acc, [t.category]: (acc[t.category] ?? 0) + t.amount }),
        {} as Record<string, number>,
      ),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export interface ListFilters {
  typeFilter: TypeFilter
  categoryFilter: string
  search: string
  sortMode: SortMode
}

export function filterAndSort(rangeTxns: Transaction[], f: ListFilters): Transaction[] {
  const q = f.search.trim().toLowerCase()
  let list = rangeTxns
  if (f.typeFilter !== 'all') list = list.filter((t) => t.type === f.typeFilter)
  if (f.categoryFilter !== 'all') list = list.filter((t) => t.category === f.categoryFilter)
  if (q) list = list.filter((t) => t.description.toLowerCase().includes(q))
  const sorted = [...list]
  switch (f.sortMode) {
    case 'date-asc':
      sorted.sort((a, b) => a.date.localeCompare(b.date))
      break
    case 'amount-desc':
      sorted.sort((a, b) => b.amount - a.amount)
      break
    case 'amount-asc':
      sorted.sort((a, b) => a.amount - b.amount)
      break
    default:
      sorted.sort((a, b) => b.date.localeCompare(a.date))
  }
  return sorted
}

export function availableCategories(rangeTxns: Transaction[]): string[] {
  return ['all', ...Array.from(new Set(rangeTxns.map((t) => t.category)))]
}

export function rangeLabel(mode: RangeMode, anchor: Date, range: DateRange | null): string {
  if (mode === 'all') return '전체 기간'
  if (mode === 'custom' && range) {
    return `${format(range.start, 'yyyy.M.d')} ~ ${format(range.end, 'yyyy.M.d')}`
  }
  if (!range) return ''
  switch (mode) {
    case 'day':
      return format(anchor, 'yyyy년 M월 d일 (E)', { locale: ko })
    case 'week':
      return `${format(range.start, 'M월 d일')} - ${format(range.end, 'M월 d일')}`
    case 'month':
      return format(anchor, 'yyyy년 M월', { locale: ko })
    case 'year':
      return format(anchor, 'yyyy년', { locale: ko })
    default:
      return ''
  }
}

export function rangeSpan(mode: RangeMode, range: DateRange | null): string {
  if (!range) return ''
  if (mode === 'day') return format(range.start, 'EEEE', { locale: ko })
  return `${format(range.start, 'M/d')} ~ ${format(range.end, 'M/d')}`
}
