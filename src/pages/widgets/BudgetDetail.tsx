import { useMemo, useState } from 'react'
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
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  differenceInCalendarDays,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Search,
  X,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { WidgetDetailLayout } from '@/layouts/WidgetDetailLayout'
import { useTransactions } from '@/hooks/useTransactions'
import { useCalendarStore } from '@/store/calendarStore'
import { cn, formatKRW, formatDate } from '@/lib/utils'

const CARD_BG = '#1A1A1A'
const BORDER = 'rgba(255,255,255,0.07)'

const CAT_COLOR: Record<string, string> = {
  식비: '#FF6B6B',
  교통: '#FFD93D',
  쇼핑: '#C084FC',
  '문화/여가': '#60A5FA',
  통신: '#34D399',
  의료: '#FB923C',
  급여: '#4ADE80',
  부수입: '#A3E635',
  기타: '#52525B',
}
const EXP_CATS = ['식비', '교통', '쇼핑', '문화/여가', '통신', '의료', '기타']
const INC_CATS = ['급여', '부수입', '기타']

type TypeFilter = 'all' | 'income' | 'expense'
type SortMode = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'
type RangeMode = 'day' | 'week' | 'month' | 'year' | 'custom' | 'all'

const WEEK_OPTS = { weekStartsOn: 1 as const }

const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 38,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '0 12px',
  fontSize: 13,
  color: '#F2F2F7',
  outline: 'none',
}

export function BudgetDetail() {
  const monthFromStore = useCalendarStore((s) => s.month)
  const setMonthInStore = useCalendarStore((s) => s.setMonth)
  const {
    data: txns = [],
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions()

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortMode, setSortMode] = useState<SortMode>('date-desc')
  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '식비',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })

  // 기간 보기 상태. month 모드만 캘린더 스토어와 동기화(캘린더 위젯과 공유).
  // 다른 모드는 컴포넌트 로컬 anchor를 사용.
  const [rangeMode, setRangeModeRaw] = useState<RangeMode>('month')
  const [localAnchor, setLocalAnchor] = useState<Date>(new Date())
  const [customStart, setCustomStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [customEnd, setCustomEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))

  // 달력 팝오버 상태. pickerStart만 있고 pickerEnd가 null이면 단일 날짜(=하루) 선택 중.
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

  // 모드별 시작·종료. 'all'은 null로 두고 필터 단계에서 분기.
  const range = useMemo<{ start: Date; end: Date } | null>(() => {
    switch (rangeMode) {
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
  }, [rangeMode, anchor, customStart, customEnd])

  const rangeTxns = useMemo(() => {
    if (!range) return txns
    return txns.filter((t) => {
      const d = parseISO(t.date)
      return d >= range.start && d <= range.end
    })
  }, [txns, range])

  const income = rangeTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = rangeTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense

  // 추이 차트 — 모드별로 버킷 단위를 자동 선택.
  const trendData = useMemo(() => {
    type Bucket = { label: string; from: Date; to: Date }
    let buckets: Bucket[] = []

    if (rangeMode === 'day') {
      const days = eachDayOfInterval({ start: subDays(anchor, 6), end: anchor })
      buckets = days.map((d) => ({ label: format(d, 'M/d'), from: startOfDay(d), to: endOfDay(d) }))
    } else if (rangeMode === 'week') {
      const weeks = eachWeekOfInterval({ start: subWeeks(anchor, 5), end: anchor }, WEEK_OPTS)
      buckets = weeks.map((w) => ({
        label: format(startOfWeek(w, WEEK_OPTS), 'M/d'),
        from: startOfWeek(w, WEEK_OPTS),
        to: endOfWeek(w, WEEK_OPTS),
      }))
    } else if (rangeMode === 'month') {
      const months = eachMonthOfInterval({
        start: subMonths(startOfMonth(anchor), 5),
        end: startOfMonth(anchor),
      })
      buckets = months.map((m) => ({
        label: format(m, 'M월', { locale: ko }),
        from: startOfMonth(m),
        to: endOfMonth(m),
      }))
    } else if (rangeMode === 'year') {
      const months = eachMonthOfInterval({ start: startOfYear(anchor), end: endOfYear(anchor) })
      buckets = months.map((m) => ({
        label: format(m, 'M월', { locale: ko }),
        from: startOfMonth(m),
        to: endOfMonth(m),
      }))
    } else if (rangeMode === 'custom' && range) {
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
        buckets = Array.from(years).sort().map((y) => ({
          label: `${y}`,
          from: new Date(y, 0, 1),
          to: new Date(y, 11, 31, 23, 59, 59),
        }))
      }
    } else if (rangeMode === 'all' && txns.length > 0) {
      const years = new Set<number>()
      for (const t of txns) years.add(parseISO(t.date).getFullYear())
      buckets = Array.from(years).sort().map((y) => ({
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
  }, [rangeMode, anchor, range, txns])

  const trendTitle =
    rangeMode === 'day' ? '최근 7일 추이'
    : rangeMode === 'week' ? '최근 6주 추이'
    : rangeMode === 'month' ? '최근 6개월 추이'
    : rangeMode === 'year' ? `${format(anchor, 'yyyy년')} 월별 추이`
    : rangeMode === 'custom' ? '기간 내 추이'
    : '연도별 추이'

  // 카테고리 파이 (선택 기간 내 지출)
  const pieData = useMemo(
    () =>
      Object.entries(
        rangeTxns
          .filter((t) => t.type === 'expense')
          .reduce(
            (acc, t) => ({ ...acc, [t.category]: (acc[t.category] ?? 0) + t.amount }),
            {} as Record<string, number>
          )
      )
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    [rangeTxns]
  )

  // 필터 + 정렬 거래 목록
  const filteredTxns = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = rangeTxns
    if (typeFilter !== 'all') list = list.filter((t) => t.type === typeFilter)
    if (categoryFilter !== 'all') list = list.filter((t) => t.category === categoryFilter)
    if (q) list = list.filter((t) => t.description.toLowerCase().includes(q))
    const sorted = [...list]
    switch (sortMode) {
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
  }, [rangeTxns, typeFilter, categoryFilter, search, sortMode])

  const availableCategories = useMemo(() => {
    const set = new Set(rangeTxns.map((t) => t.category))
    return ['all', ...Array.from(set)]
  }, [rangeTxns])

  const resetForm = () => {
    setForm({
      type: 'expense',
      amount: '',
      category: '식비',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    })
    setEditingId(null)
  }

  const submit = () => {
    if (!form.amount || !form.description) return
    addTransaction.mutate({
      amount: Number(form.amount),
      type: form.type,
      category: form.category,
      description: form.description,
      date: form.date,
    })
    resetForm()
    setOpen(false)
  }

  const [editForm, setEditForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '식비',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })

  const startEdit = (id: string) => {
    const t = txns.find((x) => x.id === id)
    if (!t) return
    setEditForm({
      type: t.type,
      amount: String(t.amount),
      category: t.category,
      description: t.description,
      date: t.date,
    })
    setEditingId(id)
  }

  const submitEdit = () => {
    if (!editingId || !editForm.amount || !editForm.description) return
    updateTransaction.mutate({
      id: editingId,
      patch: {
        amount: Number(editForm.amount),
        type: editForm.type,
        category: editForm.category,
        description: editForm.description,
        date: editForm.date,
      },
    })
    setEditingId(null)
  }

  const cancelForm = () => {
    resetForm()
    setOpen(false)
  }

  const confirmDeleteTxn = txns.find((t) => t.id === confirmDeleteId) ?? null

  const rangeLabel = (() => {
    if (rangeMode === 'all') return '전체 기간'
    if (rangeMode === 'custom' && range) {
      return `${format(range.start, 'yyyy.M.d')} ~ ${format(range.end, 'yyyy.M.d')}`
    }
    if (!range) return ''
    switch (rangeMode) {
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
  })()

  const rangeSpan = (() => {
    if (!range) return ''
    if (rangeMode === 'day') return format(range.start, 'EEEE', { locale: ko })
    return `${format(range.start, 'M/d')} ~ ${format(range.end, 'M/d')}`
  })()

  const goPrev = () => {
    switch (rangeMode) {
      case 'day': return setAnchor(subDays(anchor, 1))
      case 'week': return setAnchor(subWeeks(anchor, 1))
      case 'month': return setAnchor(subMonths(anchor, 1))
      case 'year': return setAnchor(subYears(anchor, 1))
    }
  }
  const goNext = () => {
    switch (rangeMode) {
      case 'day': return setAnchor(addDays(anchor, 1))
      case 'week': return setAnchor(addWeeks(anchor, 1))
      case 'month': return setAnchor(addMonths(anchor, 1))
      case 'year': return setAnchor(addYears(anchor, 1))
    }
  }
  const hasNavButtons = rangeMode === 'day' || rangeMode === 'week' || rangeMode === 'month' || rangeMode === 'year'

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

  return (
    <WidgetDetailLayout
      title="가계부"
      kicker="BUDGET"
      subtitle="원하는 기간으로 수입/지출 추이와 거래 내역을 확인"
      accent="#3182F6"
      actions={
        <button
          onClick={() => {
            if (open) cancelForm()
            else setOpen(true)
          }}
          className={cn(
            'flex items-center gap-1.5 h-9 px-3.5 rounded-xl transition-all cursor-pointer text-[13px] font-medium',
            open
              ? 'bg-[#3182F6] text-white'
              : 'bg-[rgba(49,130,246,0.12)] text-[#8E8E93] hover:text-white'
          )}
        >
          <Plus size={14} className={cn('transition-transform', open && 'rotate-45')} />
          {open ? '취소' : '추가'}
        </button>
      }
    >
      {/* range picker — single trigger, opens calendar popover */}
      <div className="flex items-center gap-2 mb-5">
        {hasNavButtons && (
          <button
            onClick={goPrev}
            className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0 transition-colors cursor-pointer"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}`, color: '#8E8E93' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F2F2F7')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8E8E93')}
            aria-label="이전"
          >
            <ChevronLeft size={15} />
          </button>
        )}
        <button
          onClick={openPopover}
          className="flex items-center justify-between gap-3 flex-1 h-9 px-3.5 rounded-xl transition-colors cursor-pointer"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#222222')}
          onMouseLeave={(e) => (e.currentTarget.style.background = CARD_BG)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <CalendarIcon size={14} style={{ color: '#3182F6' }} />
            <p
              className="text-[13.5px] font-semibold tracking-tight truncate"
              style={{ color: '#F2F2F7' }}
            >
              {rangeLabel}
            </p>
            {rangeSpan && rangeMode !== 'day' && rangeMode !== 'all' && rangeMode !== 'custom' && (
              <p className="hidden sm:block text-[11.5px]" style={{ color: '#636366' }}>
                · {rangeSpan}
              </p>
            )}
          </div>
          <ChevronDown size={14} style={{ color: '#8E8E93' }} />
        </button>
        {hasNavButtons && (
          <button
            onClick={goNext}
            className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0 transition-colors cursor-pointer"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}`, color: '#8E8E93' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F2F2F7')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8E8E93')}
            aria-label="다음"
          >
            <ChevronRight size={15} />
          </button>
        )}
      </div>

      {/* add form */}
      {open && (
        <div
          className="mb-6 rounded-2xl overflow-hidden fade-up"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <div className="flex" style={{ borderBottom: `1px solid ${BORDER}` }}>
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                onClick={() =>
                  setForm((f) => ({ ...f, type: t, category: t === 'income' ? '급여' : '식비' }))
                }
                className="flex-1 py-3 transition-all cursor-pointer text-[13px] font-medium"
                style={{
                  background:
                    form.type === t
                      ? t === 'expense'
                        ? 'rgba(255,67,58,0.1)'
                        : 'rgba(5,214,134,0.1)'
                      : 'transparent',
                  color: form.type === t ? (t === 'expense' ? '#FF453A' : '#05D686') : '#636366',
                }}
              >
                {t === 'expense' ? '지출' : '수입'}
              </button>
            ))}
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="number"
              placeholder="금액"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              style={fieldStyle}
            />
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              style={{ ...fieldStyle, cursor: 'pointer' }}
            >
              {(form.type === 'expense' ? EXP_CATS : INC_CATS).map((c) => (
                <option key={c} value={c} style={{ background: '#141730' }}>
                  {c}
                </option>
              ))}
            </select>
            <input
              placeholder="내용"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              style={fieldStyle}
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              style={fieldStyle}
            />
          </div>
          <div className="px-4 pb-4">
            <button
              onClick={submit}
              className="w-full h-10 rounded-xl transition-colors cursor-pointer text-[13px] font-medium"
              style={{ background: '#3182F6', color: '#ffffff' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#5c6ecc')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#3182F6')}
            >
              기록하기
            </button>
          </div>
        </div>
      )}

      {/* summary — mobile: combined card / desktop: 3 cards */}
      <div
        className="sm:hidden rounded-2xl p-5 mb-6"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center gap-2 mb-2" style={{ color: '#8E8E93' }}>
          <Wallet size={14} />
          <p className="text-[12px] font-medium tracking-wide">잔액</p>
        </div>
        <p
          className="text-[28px] font-semibold tabular-nums tracking-tight mb-4"
          style={{ color: balance >= 0 ? '#F2F2F7' : '#FF453A' }}
        >
          {formatKRW(balance)}
        </p>
        <div
          className="grid grid-cols-2 gap-3 pt-4"
          style={{ borderTop: `1px solid ${BORDER}` }}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1" style={{ color: '#05D686' }}>
              <TrendingUp size={12} />
              <p className="text-[11px] font-medium" style={{ color: '#8E8E93' }}>
                수입
              </p>
            </div>
            <p className="text-[15px] font-semibold tabular-nums" style={{ color: '#05D686' }}>
              +{formatKRW(income)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1" style={{ color: '#FF453A' }}>
              <TrendingDown size={12} />
              <p className="text-[11px] font-medium" style={{ color: '#8E8E93' }}>
                지출
              </p>
            </div>
            <p className="text-[15px] font-semibold tabular-nums" style={{ color: '#FF453A' }}>
              -{formatKRW(expense)}
            </p>
          </div>
        </div>
      </div>

      <div className="hidden sm:grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: '수입',
            value: income,
            color: '#05D686',
            icon: <TrendingUp size={16} />,
            prefix: '+',
          },
          {
            label: '지출',
            value: expense,
            color: '#FF453A',
            icon: <TrendingDown size={16} />,
            prefix: '-',
          },
          {
            label: '잔액',
            value: balance,
            color: balance >= 0 ? '#F2F2F7' : '#FF453A',
            icon: <Wallet size={16} />,
            prefix: '',
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl p-5"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center gap-2 mb-3" style={{ color: c.color }}>
              {c.icon}
              <p className="text-[12px] font-medium tracking-wide" style={{ color: '#8E8E93' }}>
                {c.label}
              </p>
            </div>
            <p
              className="text-[26px] font-semibold tabular-nums tracking-tight"
              style={{ color: c.color }}
            >
              {c.prefix}
              {formatKRW(c.value)}
            </p>
          </div>
        ))}
      </div>

      {/* trend + categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {/* trend */}
        <div
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <p className="text-[13px] font-medium mb-4" style={{ color: '#F2F2F7' }}>
            {trendTitle}
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barGap={4}>
                <XAxis dataKey="label" tick={{ fill: '#636366', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#636366', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 10000 ? `${Math.round(v / 10000)}만` : `${v}`)}
                  width={42}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{
                    background: '#222222',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 12,
                    fontSize: 12,
                    padding: '8px 12px',
                  }}
                  formatter={(v) => formatKRW(Number(v))}
                />
                <Bar dataKey="수입" fill="#05D686" radius={[4, 4, 0, 0]} />
                <Bar dataKey="지출" fill="#FF453A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* categories */}
        <div
          className="rounded-2xl p-5"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <p className="text-[13px] font-medium mb-4" style={{ color: '#F2F2F7' }}>
            카테고리별 지출
          </p>
          {pieData.length === 0 ? (
            <div className="h-56 flex items-center justify-center">
              <p className="text-[12px]" style={{ color: '#636366' }}>
                지출 내역이 없습니다
              </p>
            </div>
          ) : (
            <>
              <div className="h-32 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={56}
                      dataKey="value"
                      strokeWidth={2}
                      stroke={CARD_BG}
                    >
                      {pieData.map((e) => (
                        <Cell key={e.name} fill={CAT_COLOR[e.name] ?? '#52525B'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#222222',
                        border: `1px solid ${BORDER}`,
                        borderRadius: 12,
                        fontSize: 12,
                        padding: '8px 12px',
                      }}
                      formatter={(v) => formatKRW(Number(v))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-2 text-[12px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: CAT_COLOR[d.name] ?? '#52525B' }}
                      />
                      <span className="truncate" style={{ color: '#AEAEB2' }}>
                        {d.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span style={{ color: '#636366' }}>
                        {expense > 0 ? Math.round((d.value / expense) * 100) : 0}%
                      </span>
                      <span className="tabular-nums" style={{ color: '#F2F2F7' }}>
                        {formatKRW(d.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* transactions */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        {/* filter bar */}
        <div
          className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          {/* search — full width on mobile, flex on desktop */}
          <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: '#636366' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="내용 검색"
              aria-label="거래 내용으로 검색"
              type="search"
              style={{ ...fieldStyle, paddingLeft: 32 }}
            />
          </div>
          {/* selects — 3-col grid on mobile, inline on desktop */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-2 sm:shrink-0">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="min-w-0 sm:w-[110px]"
              style={{ ...fieldStyle, cursor: 'pointer', paddingRight: 8 }}
            >
              <option value="all" style={{ background: '#141730' }}>전체</option>
              <option value="income" style={{ background: '#141730' }}>수입</option>
              <option value="expense" style={{ background: '#141730' }}>지출</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="min-w-0 sm:w-[140px]"
              style={{ ...fieldStyle, cursor: 'pointer', paddingRight: 8 }}
            >
              {availableCategories.map((c) => (
                <option key={c} value={c} style={{ background: '#141730' }}>
                  {c === 'all' ? '카테고리' : c}
                </option>
              ))}
            </select>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="min-w-0 sm:w-[130px]"
              style={{ ...fieldStyle, cursor: 'pointer', paddingRight: 8 }}
            >
              <option value="date-desc" style={{ background: '#141730' }}>최신순</option>
              <option value="date-asc" style={{ background: '#141730' }}>오래된순</option>
              <option value="amount-desc" style={{ background: '#141730' }}>금액↓</option>
              <option value="amount-asc" style={{ background: '#141730' }}>금액↑</option>
            </select>
          </div>
        </div>

        {/* list */}
        <div>
          {isLoading ? (
            <div className="p-5 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3.5 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                  <div className="skeleton h-4 w-20" />
                </div>
              ))}
            </div>
          ) : filteredTxns.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <p className="text-[13px]" style={{ color: '#8E8E93' }}>
                조건에 맞는 내역이 없습니다
              </p>
              <p className="text-[12px]" style={{ color: '#636366' }}>
                {rangeTxns.length === 0
                  ? '+ 추가 버튼으로 첫 거래를 기록해보세요'
                  : '필터를 조정해보세요'}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {filteredTxns.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-4 px-5 py-4 group transition-colors"
                  style={{ borderColor: BORDER }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
                    style={{ background: `${CAT_COLOR[t.category] ?? '#52525B'}25` }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: CAT_COLOR[t.category] ?? '#52525B' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate leading-snug text-[14px] font-medium"
                      style={{ color: '#F2F2F7' }}
                    >
                      {t.description}
                    </p>
                    <p className="text-[12px]" style={{ color: '#8E8E93', marginTop: 2 }}>
                      {t.category}
                      <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                      {formatDate(t.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p
                      className="text-[15px] font-semibold tabular-nums"
                      style={{ color: t.type === 'income' ? '#05D686' : '#F2F2F7' }}
                    >
                      {t.type === 'income' ? '+' : '-'}
                      {formatKRW(t.amount)}
                    </p>
                    <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => startEdit(t.id)}
                        className="p-1.5 transition-colors cursor-pointer rounded-lg"
                        style={{ color: '#636366' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#3182F6')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#636366')}
                        aria-label="수정"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(t.id)}
                        className="p-1.5 transition-colors cursor-pointer rounded-lg"
                        style={{ color: '#636366' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#FF453A')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#636366')}
                        aria-label="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* footer count */}
        {filteredTxns.length > 0 && (
          <div
            className="px-5 py-3 text-[12px]"
            style={{ borderTop: `1px solid ${BORDER}`, color: '#636366' }}
          >
            총 <span style={{ color: '#AEAEB2' }}>{filteredTxns.length}건</span>
            {filteredTxns.length !== rangeTxns.length && ` (전체 ${rangeTxns.length}건 중)`}
          </div>
        )}
      </div>

      {/* range picker popover */}
      {popoverOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-16 sm:pt-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setPopoverOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden fade-up"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* presets */}
            <div
              className="flex flex-wrap gap-1.5 p-3"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              {([
                { key: 'today', label: '오늘' },
                { key: 'week', label: '이번 주' },
                { key: 'month', label: '이번 달' },
                { key: 'year', label: '올해' },
                { key: 'all', label: '전체' },
              ] as const).map((p) => (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p.key)}
                  className="px-3 h-7 rounded-lg text-[12px] font-medium transition-colors cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#AEAEB2' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(49,130,246,0.16)'
                    e.currentTarget.style.color = '#3182F6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.color = '#AEAEB2'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* month nav */}
            <div className="flex items-center justify-between px-3 pt-3 pb-1">
              <button
                onClick={() => setPickerMonth((m) => subMonths(m, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                style={{ color: '#8E8E93' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#F2F2F7'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#8E8E93'
                  e.currentTarget.style.background = 'transparent'
                }}
                aria-label="이전 달"
              >
                <ChevronLeft size={15} />
              </button>
              <p className="text-[13.5px] font-semibold tracking-tight" style={{ color: '#F2F2F7' }}>
                {format(pickerMonth, 'yyyy년 M월', { locale: ko })}
              </p>
              <button
                onClick={() => setPickerMonth((m) => addMonths(m, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                style={{ color: '#8E8E93' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#F2F2F7'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#8E8E93'
                  e.currentTarget.style.background = 'transparent'
                }}
                aria-label="다음 달"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {/* weekday header */}
            <div className="grid grid-cols-7 gap-1 px-3 pb-1">
              {['월', '화', '수', '목', '금', '토', '일'].map((d, i) => (
                <div
                  key={d}
                  className="h-7 flex items-center justify-center text-[11px] font-medium"
                  style={{ color: i === 5 ? '#60A5FA' : i === 6 ? '#FF8A80' : '#636366' }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* days grid */}
            <div className="grid grid-cols-7 gap-1 px-3 pb-3">
              {calendarDays.map((d) => {
                const inMonth = d.getMonth() === pickerMonth.getMonth()
                const inRange = isInPickerRange(d)
                const isStart = pickerStart && d.toDateString() === pickerStart.toDateString()
                const isEnd = pickerEnd && d.toDateString() === pickerEnd.toDateString()
                const isToday = d.toDateString() === new Date().toDateString()
                const isEdge = isStart || isEnd
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => handleDateClick(d)}
                    className="relative h-9 flex items-center justify-center text-[13px] tabular-nums rounded-lg transition-colors cursor-pointer"
                    style={{
                      background: isEdge
                        ? '#3182F6'
                        : inRange
                          ? 'rgba(49,130,246,0.18)'
                          : 'transparent',
                      color: isEdge
                        ? '#ffffff'
                        : !inMonth
                          ? '#3A3A3C'
                          : inRange
                            ? '#F2F2F7'
                            : isToday
                              ? '#3182F6'
                              : '#F2F2F7',
                      fontWeight: isEdge || isToday ? 600 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (!isEdge && !inRange) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isEdge && !inRange) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {d.getDate()}
                  </button>
                )
              })}
            </div>

            {/* footer */}
            <div
              className="flex items-center justify-between gap-2 px-3 py-3"
              style={{ borderTop: `1px solid ${BORDER}` }}
            >
              <p className="text-[11.5px]" style={{ color: '#8E8E93' }}>
                {pickerStart
                  ? pickerEnd && pickerEnd.toDateString() !== pickerStart.toDateString()
                    ? `${format(pickerStart, 'M월 d일')} ~ ${format(pickerEnd, 'M월 d일')}`
                    : `${format(pickerStart, 'M월 d일')} (하루)`
                  : '날짜를 선택하세요'}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPopoverOpen(false)}
                  className="px-3 h-8 rounded-lg text-[12px] font-medium transition-colors cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#F2F2F7' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                >
                  취소
                </button>
                <button
                  onClick={applyPicker}
                  disabled={!pickerStart}
                  className="px-3 h-8 rounded-lg text-[12px] font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: '#3182F6', color: '#ffffff' }}
                  onMouseEnter={(e) => { if (pickerStart) e.currentTarget.style.background = '#5c6ecc' }}
                  onMouseLeave={(e) => { if (pickerStart) e.currentTarget.style.background = '#3182F6' }}
                >
                  적용
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* edit modal */}
      {editingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setEditingId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden fade-up"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <p className="text-[15px] font-semibold" style={{ color: '#F2F2F7' }}>
                거래 내역 수정
              </p>
              <button
                onClick={() => setEditingId(null)}
                className="p-1 cursor-pointer transition-colors rounded-lg"
                style={{ color: '#636366' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F2F2F7')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#636366')}
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex" style={{ borderBottom: `1px solid ${BORDER}` }}>
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    setEditForm((f) => ({
                      ...f,
                      type: t,
                      category: t === 'income' ? '급여' : '식비',
                    }))
                  }
                  className="flex-1 py-3 transition-all cursor-pointer text-[13px] font-medium"
                  style={{
                    background:
                      editForm.type === t
                        ? t === 'expense'
                          ? 'rgba(255,67,58,0.1)'
                          : 'rgba(5,214,134,0.1)'
                        : 'transparent',
                    color:
                      editForm.type === t
                        ? t === 'expense'
                          ? '#FF453A'
                          : '#05D686'
                        : '#636366',
                  }}
                >
                  {t === 'expense' ? '지출' : '수입'}
                </button>
              ))}
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="금액"
                value={editForm.amount}
                onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                style={fieldStyle}
              />
              <select
                value={editForm.category}
                onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                style={{ ...fieldStyle, cursor: 'pointer' }}
              >
                {(editForm.type === 'expense' ? EXP_CATS : INC_CATS).map((c) => (
                  <option key={c} value={c} style={{ background: '#141730' }}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                placeholder="내용"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && submitEdit()}
                style={fieldStyle}
              />
              <input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                style={fieldStyle}
              />
            </div>
            <div
              className="flex gap-2 px-5 py-4"
              style={{ borderTop: `1px solid ${BORDER}` }}
            >
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 h-10 rounded-xl transition-colors cursor-pointer text-[13px] font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#F2F2F7' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')
                }
              >
                취소
              </button>
              <button
                onClick={submitEdit}
                className="flex-1 h-10 rounded-xl transition-colors cursor-pointer text-[13px] font-medium"
                style={{ background: '#3182F6', color: '#ffffff' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#5c6ecc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#3182F6')}
              >
                수정하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* delete confirmation modal */}
      {confirmDeleteTxn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden fade-up"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <p className="text-[15px] font-semibold" style={{ color: '#F2F2F7' }}>
                거래 내역 삭제
              </p>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="p-1 cursor-pointer transition-colors rounded-lg"
                style={{ color: '#636366' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F2F2F7')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#636366')}
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-5">
              <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#AEAEB2' }}>
                이 거래 내역을 삭제하시겠어요? 되돌릴 수 없습니다.
              </p>
              <div
                className="rounded-xl p-3.5 mb-2"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <p
                    className="text-[14px] font-medium truncate"
                    style={{ color: '#F2F2F7' }}
                  >
                    {confirmDeleteTxn.description}
                  </p>
                  <p
                    className="text-[14px] font-semibold tabular-nums shrink-0"
                    style={{
                      color: confirmDeleteTxn.type === 'income' ? '#05D686' : '#F2F2F7',
                    }}
                  >
                    {confirmDeleteTxn.type === 'income' ? '+' : '-'}
                    {formatKRW(confirmDeleteTxn.amount)}
                  </p>
                </div>
                <p className="text-[12px]" style={{ color: '#8E8E93' }}>
                  {confirmDeleteTxn.category}
                  <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                  {formatDate(confirmDeleteTxn.date)}
                </p>
              </div>
            </div>
            <div
              className="flex gap-2 px-5 py-4"
              style={{ borderTop: `1px solid ${BORDER}` }}
            >
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 h-10 rounded-xl transition-colors cursor-pointer text-[13px] font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#F2F2F7' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')
                }
              >
                취소
              </button>
              <button
                onClick={() => {
                  deleteTransaction.mutate(confirmDeleteTxn.id)
                  setConfirmDeleteId(null)
                }}
                className="flex-1 h-10 rounded-xl transition-colors cursor-pointer text-[13px] font-medium"
                style={{ background: '#FF453A', color: '#ffffff' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#E03A30')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FF453A')}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </WidgetDetailLayout>
  )
}
