import { useMemo, useState } from 'react'
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  eachDayOfInterval,
} from 'date-fns'
import { useCalendarStore } from '@/store/calendarStore'
import { getRange, rangeLabel, rangeSpan, WEEK_OPTS, type RangeMode, type DateRange } from '@/lib/budget'

export interface BudgetRange {
  rangeMode: RangeMode
  range: DateRange | null
  anchor: Date
  label: string
  span: string
  hasNavButtons: boolean
  goPrev: () => void
  goNext: () => void

  // 달력 팝오버
  popoverOpen: boolean
  setPopoverOpen: (open: boolean) => void
  openPopover: () => void
  pickerMonth: Date
  setPickerMonth: React.Dispatch<React.SetStateAction<Date>>
  pickerStart: Date | null
  pickerEnd: Date | null
  calendarDays: Date[]
  isInPickerRange: (d: Date) => boolean
  handleDateClick: (d: Date) => void
  applyPicker: () => void
  applyPreset: (preset: 'today' | 'week' | 'month' | 'year' | 'all') => void
}

// 가계부 기간 보기의 상태 머신. month 모드만 캘린더 스토어와 동기화(캘린더 위젯과 공유),
// 나머지 모드는 컴포넌트 로컬 anchor를 사용한다.
export function useBudgetRange(): BudgetRange {
  const monthFromStore = useCalendarStore((s) => s.month)
  const setMonthInStore = useCalendarStore((s) => s.setMonth)

  const [rangeMode, setRangeModeRaw] = useState<RangeMode>('month')
  const [localAnchor, setLocalAnchor] = useState<Date>(new Date())
  const [customStart, setCustomStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [customEnd, setCustomEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))

  const [popoverOpen, setPopoverOpen] = useState(false)
  const [pickerMonth, setPickerMonth] = useState<Date>(new Date())
  const [pickerStart, setPickerStart] = useState<Date | null>(null)
  const [pickerEnd, setPickerEnd] = useState<Date | null>(null)

  const anchor = rangeMode === 'month' ? monthFromStore : localAnchor
  const setAnchor = (d: Date) => {
    if (rangeMode === 'month') setMonthInStore(d)
    else setLocalAnchor(d)
  }

  const setRangeMode = (m: RangeMode) => {
    // 모드 전환 시 현재 anchor를 새 저장소로 옮겨 자연스럽게 이어보기.
    const cur = rangeMode === 'month' ? monthFromStore : localAnchor
    if (m === 'month') setMonthInStore(cur)
    else setLocalAnchor(cur)
    setRangeModeRaw(m)
  }

  const range = useMemo<DateRange | null>(
    () => getRange(rangeMode, anchor, customStart, customEnd),
    [rangeMode, anchor, customStart, customEnd],
  )

  const label = rangeLabel(rangeMode, anchor, range)
  const span = rangeSpan(rangeMode, range)
  const hasNavButtons =
    rangeMode === 'day' || rangeMode === 'week' || rangeMode === 'month' || rangeMode === 'year'

  const goPrev = () => {
    switch (rangeMode) {
      case 'day':
        return setAnchor(subDays(anchor, 1))
      case 'week':
        return setAnchor(subWeeks(anchor, 1))
      case 'month':
        return setAnchor(subMonths(anchor, 1))
      case 'year':
        return setAnchor(subYears(anchor, 1))
    }
  }
  const goNext = () => {
    switch (rangeMode) {
      case 'day':
        return setAnchor(addDays(anchor, 1))
      case 'week':
        return setAnchor(addWeeks(anchor, 1))
      case 'month':
        return setAnchor(addMonths(anchor, 1))
      case 'year':
        return setAnchor(addYears(anchor, 1))
    }
  }

  // 팝오버를 열 때 현재 선택을 picker에 반영해 자연스럽게 이어보기.
  const openPopover = () => {
    if (range) {
      setPickerStart(range.start)
      setPickerEnd(rangeMode === 'day' ? null : range.end)
      setPickerMonth(range.start)
    } else {
      setPickerStart(null)
      setPickerEnd(null)
      setPickerMonth(new Date())
    }
    setPopoverOpen(true)
  }

  const handleDateClick = (d: Date) => {
    // 두 번째 클릭으로 종료일 지정. 그 외엔 새로 시작.
    if (!pickerStart || (pickerStart && pickerEnd)) {
      setPickerStart(d)
      setPickerEnd(null)
      return
    }
    if (d < pickerStart) {
      setPickerEnd(pickerStart)
      setPickerStart(d)
    } else {
      setPickerEnd(d)
    }
  }

  const applyPicker = () => {
    if (!pickerStart) {
      setPopoverOpen(false)
      return
    }
    const end = pickerEnd ?? pickerStart
    if (pickerStart.getTime() === end.getTime()) {
      // 단일 날짜 → day 모드
      setLocalAnchor(pickerStart)
      setRangeMode('day')
    } else {
      setCustomStart(format(pickerStart, 'yyyy-MM-dd'))
      setCustomEnd(format(end, 'yyyy-MM-dd'))
      setRangeMode('custom')
    }
    setPopoverOpen(false)
  }

  const applyPreset = (preset: 'today' | 'week' | 'month' | 'year' | 'all') => {
    const today = new Date()
    if (preset === 'all') {
      setRangeMode('all')
    } else if (preset === 'today') {
      setLocalAnchor(today)
      setRangeMode('day')
    } else {
      setLocalAnchor(today)
      if (rangeMode !== preset) setRangeMode(preset)
      else setAnchor(today)
    }
    setPopoverOpen(false)
  }

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(pickerMonth), WEEK_OPTS)
    const end = endOfWeek(endOfMonth(pickerMonth), WEEK_OPTS)
    return eachDayOfInterval({ start, end })
  }, [pickerMonth])

  const isInPickerRange = (d: Date) => {
    if (!pickerStart) return false
    const end = pickerEnd ?? pickerStart
    return d >= startOfDay(pickerStart) && d <= endOfDay(end)
  }

  return {
    rangeMode,
    range,
    anchor,
    label,
    span,
    hasNavButtons,
    goPrev,
    goNext,
    popoverOpen,
    setPopoverOpen,
    openPopover,
    pickerMonth,
    setPickerMonth,
    pickerStart,
    pickerEnd,
    calendarDays,
    isInPickerRange,
    handleDateClick,
    applyPicker,
    applyPreset,
  }
}
