import { useMemo, useState } from 'react'
import {
  format,
  parseISO,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachMonthOfInterval,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Search,
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
  const month = useCalendarStore((s) => s.month)
  const setMonth = useCalendarStore((s) => s.setMonth)
  const { data: txns = [], isLoading, addTransaction, deleteTransaction } = useTransactions()

  const [open, setOpen] = useState(false)
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

  const monthTxns = useMemo(
    () => txns.filter((t) => isSameMonth(parseISO(t.date), month)),
    [txns, month]
  )

  const income = monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense

  // 6-month trend (current month + previous 5)
  const trendData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(startOfMonth(month), 5),
      end: startOfMonth(month),
    })
    return months.map((m) => {
      const inMonth = txns.filter((t) => isSameMonth(parseISO(t.date), m))
      return {
        label: format(m, 'M월', { locale: ko }),
        수입: inMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        지출: inMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    })
  }, [txns, month])

  // category pie (expenses for selected month)
  const pieData = useMemo(
    () =>
      Object.entries(
        monthTxns
          .filter((t) => t.type === 'expense')
          .reduce(
            (acc, t) => ({ ...acc, [t.category]: (acc[t.category] ?? 0) + t.amount }),
            {} as Record<string, number>
          )
      )
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    [monthTxns]
  )

  // filtered + sorted transactions
  const filteredTxns = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = monthTxns
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
  }, [monthTxns, typeFilter, categoryFilter, search, sortMode])

  const availableCategories = useMemo(() => {
    const set = new Set(monthTxns.map((t) => t.category))
    return ['all', ...Array.from(set)]
  }, [monthTxns])

  const submit = () => {
    if (!form.amount || !form.description) return
    addTransaction.mutate({
      amount: Number(form.amount),
      type: form.type,
      category: form.category,
      description: form.description,
      date: form.date,
    })
    setForm({
      type: 'expense',
      amount: '',
      category: '식비',
      description: '',
      date: format(month, 'yyyy-MM-dd'),
    })
    setOpen(false)
  }

  const monthLabel = format(month, 'yyyy년 M월', { locale: ko })

  return (
    <WidgetDetailLayout
      title="가계부"
      subtitle="월별 수입/지출 추이와 전체 거래 내역"
      accent="#3182F6"
      actions={
        <button
          onClick={() => setOpen((o) => !o)}
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
      {/* month switcher */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth(subMonths(month, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#8E8E93] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="text-[15px] font-semibold tracking-tight px-2" style={{ color: '#F2F2F7' }}>
            {monthLabel}
          </p>
          <button
            onClick={() => setMonth(addMonths(month, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#8E8E93] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <p className="text-[12px]" style={{ color: '#636366' }}>
          {format(startOfMonth(month), 'M/d')} ~ {format(endOfMonth(month), 'M/d')}
        </p>
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

      {/* summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
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
            prefix: balance >= 0 ? '' : '',
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
              className="text-[22px] sm:text-[26px] font-semibold tabular-nums tracking-tight"
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
            최근 6개월 추이
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
                {monthTxns.length === 0
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
                    <button
                      onClick={() => deleteTransaction.mutate(t.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 transition-all cursor-pointer rounded-lg"
                      style={{ color: '#636366' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#FF453A')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#636366')}
                    >
                      <Trash2 size={14} />
                    </button>
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
            {filteredTxns.length !== monthTxns.length && ` (전체 ${monthTxns.length}건 중)`}
          </div>
        )}
      </div>
    </WidgetDetailLayout>
  )
}
