import { useMemo, useState } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { format, isSameMonth, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { useTransactions } from '@/hooks/useTransactions'
import { useCalendarStore } from '@/store/calendarStore'
import { cn, formatKRW, formatDate } from '@/lib/utils'

const PIXEL = "'Press Start 2P', monospace"
const BG = 'rgba(38, 38, 38, 0.72)'
const BORDER = 'rgba(255,255,255,0.07)'

const CAT_COLOR: Record<string, string> = {
  식비: '#FF6B6B', 교통: '#FFD93D', 쇼핑: '#C084FC',
  '문화/여가': '#60A5FA', 통신: '#34D399', 의료: '#FB923C',
  급여: '#4ADE80', 부수입: '#A3E635', 기타: '#52525B',
}
const EXP_CATS = ['식비', '교통', '쇼핑', '문화/여가', '통신', '의료', '기타']
const INC_CATS = ['급여', '부수입', '기타']

function PixelCoin({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 32 32" style={{ position: 'absolute', imageRendering: 'pixelated', ...style }}>
      <rect x="8"  y="0"  width="16" height="4"  fill="white" />
      <rect x="4"  y="4"  width="4"  height="4"  fill="white" />
      <rect x="24" y="4"  width="4"  height="4"  fill="white" />
      <rect x="0"  y="8"  width="4"  height="16" fill="white" />
      <rect x="28" y="8"  width="4"  height="16" fill="white" />
      <rect x="4"  y="24" width="4"  height="4"  fill="white" />
      <rect x="24" y="24" width="4"  height="4"  fill="white" />
      <rect x="8"  y="28" width="16" height="4"  fill="white" />
    </svg>
  )
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '0 14px',
  fontSize: 13,
  color: '#F2F2F7',
  outline: 'none',
}

export function BudgetWidget() {
  const navigate = useNavigate()
  const { data: txns = [], isLoading, addTransaction, deleteTransaction } = useTransactions()
  const month = useCalendarStore((s) => s.month)
  const selectedDate = useCalendarStore((s) => s.selectedDate)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '', category: '식비', description: '',
    date: selectedDate,
  })

  const toggleOpen = () => {
    setOpen((prev) => {
      if (!prev) setForm((f) => ({ ...f, date: selectedDate }))
      return !prev
    })
  }

  const monthTxns = useMemo(
    () => txns.filter((t) => isSameMonth(parseISO(t.date), month)),
    [txns, month]
  )
  const dayTxns = useMemo(
    () => txns.filter((t) => t.date === selectedDate),
    [txns, selectedDate]
  )

  const income  = monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense

  const pieData = Object.entries(
    monthTxns.filter((t) => t.type === 'expense')
      .reduce((acc, t) => ({ ...acc, [t.category]: (acc[t.category] ?? 0) + t.amount }), {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const submit = () => {
    if (!form.amount || !form.description) return
    addTransaction.mutate({ amount: Number(form.amount), type: form.type, category: form.category, description: form.description, date: form.date })
    setForm({ type: 'expense', amount: '', category: '식비', description: '', date: selectedDate })
    setOpen(false)
  }

  const monthLabel = format(month, 'M월', { locale: ko })
  const dayLabel = format(parseISO(selectedDate), 'M월 d일 (E)', { locale: ko })

  return (
    <div id="widget-budget" className="group/card widget-glass h-full rounded-[8px] relative overflow-hidden flex flex-col" style={{ background: BG, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <PixelCoin style={{ width: 56, height: 56, top: 14, right: 18, opacity: 0.07 }} />

      {/* mobile */}
      <div className="flex flex-col h-full sm:hidden relative z-10" style={{ padding: '24px 20px 20px' }}>
        {/* label — clickable, navigates to detail */}
        <button
          onClick={() => navigate('/widgets/budget')}
          className="self-start flex items-center gap-1.5 mb-5 cursor-pointer group -ml-1.5 px-1.5 py-1 rounded-md hover:bg-white/[0.06] transition-colors"
          style={{ background: 'transparent' }}
          aria-label="가계부 상세 페이지로 이동"
        >
          <span style={{ fontFamily: PIXEL, fontSize: '8px', color: '#8E8E93', letterSpacing: '0.1em' }} className="group-hover:text-white group-hover/card:text-white transition-colors">
            BUDGET
          </span>
          <ArrowUpRight size={13} className="text-[#8E8E93] group-hover:text-white group-hover/card:text-white transition-colors" />
        </button>

        {/* main: balance */}
        <div className="flex-1 flex flex-col justify-center">
          {isLoading ? (
            <div className="skeleton h-10 w-32 rounded-xl" />
          ) : (
            <>
              <p style={{ fontFamily: PIXEL, fontSize: '9px', color: '#636366', marginBottom: 10, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                {monthLabel} 잔액
              </p>
              <p className="truncate" style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', color: balance >= 0 ? '#F2F2F7' : '#FF453A' }}>
                {formatKRW(balance)}
              </p>
            </>
          )}
        </div>

        {/* footer: income / expense */}
        <div className="flex items-stretch gap-0 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="flex-1 min-w-0 pr-3">
            <p style={{ fontFamily: PIXEL, fontSize: '9px', color: '#636366', marginBottom: 6, whiteSpace: 'nowrap' }}>수입</p>
            <p className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: '#05D686' }}>+{formatKRW(income)}</p>
          </div>
          <div style={{ width: 1, background: BORDER, flexShrink: 0 }} />
          <div className="flex-1 min-w-0 pl-3">
            <p style={{ fontFamily: PIXEL, fontSize: '9px', color: '#636366', marginBottom: 6, whiteSpace: 'nowrap' }}>지출</p>
            <p className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: '#FF453A' }}>-{formatKRW(expense)}</p>
          </div>
        </div>
      </div>

      {/* desktop */}
      <div className="hidden sm:flex flex-col h-full relative z-10">
        {/* header */}
        <div className="flex items-center justify-between" style={{ padding: '18px 20px 0' }}>
          <button
            onClick={() => navigate('/widgets/budget')}
            className="flex items-center gap-1.5 cursor-pointer group -ml-1.5 px-1.5 py-1 rounded-md hover:bg-white/[0.06] transition-colors"
            style={{ background: 'transparent' }}
            aria-label="가계부 상세 페이지로 이동"
          >
            <span style={{ fontFamily: PIXEL, fontSize: '8px', color: '#8E8E93', letterSpacing: '0.1em' }} className="group-hover:text-white group-hover/card:text-white transition-colors">
              BUDGET
            </span>
            <ArrowUpRight size={13} className="text-[#8E8E93] group-hover:text-white group-hover/card:text-white transition-colors" />
          </button>
          <button
            onClick={toggleOpen}
            aria-expanded={open}
            aria-label={open ? '거래 입력 폼 닫기' : '거래 추가 폼 열기'}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
            style={{
              fontSize: 12, fontWeight: 500,
              background: open ? '#3182F6' : 'rgba(49,130,246,0.12)',
              color: open ? '#ffffff' : '#8E8E93',
            }}>
            <Plus size={13} className={cn('transition-transform', open && 'rotate-45')} aria-hidden="true" />
            추가
          </button>
        </div>

        {/* summary */}
        <div className="flex items-center gap-0" style={{ padding: '16px 20px 18px' }}>
          {[
            { label: '수입', value: formatKRW(income), color: '#05D686', icon: <TrendingUp size={13} /> },
            { label: '지출', value: formatKRW(expense), color: '#FF453A', icon: <TrendingDown size={13} /> },
            { label: '잔액', value: formatKRW(balance), color: balance >= 0 ? '#F2F2F7' : '#FF453A', icon: <Minus size={13} /> },
          ].map(({ label, value, color, icon }, i) => (
            <div key={i} className="flex-1 flex flex-col">
              <div className="flex items-center gap-1.5 mb-2" style={{ color }}>
                {icon}
                <p style={{ fontFamily: PIXEL, fontSize: '12px', color: '#636366', letterSpacing: '0.06em' }}>{label}</p>
              </div>
              <p style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1, color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* add form */}
        {open && (
          <div className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <div className="flex" style={{ borderBottom: `1px solid ${BORDER}` }}>
              {(['expense', 'income'] as const).map((t) => (
                <button key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t, category: t === 'income' ? '급여' : '식비' }))}
                  className="flex-1 py-3 transition-all cursor-pointer"
                  style={{
                    fontSize: 12, fontWeight: 500,
                    background: form.type === t
                      ? t === 'expense' ? 'rgba(255,67,58,0.1)' : 'rgba(5,214,134,0.1)'
                      : 'transparent',
                    color: form.type === t
                      ? t === 'expense' ? '#FF453A' : '#05D686'
                      : '#636366',
                  }}>
                  {t === 'expense' ? '지출' : '수입'}
                </button>
              ))}
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="금액 (원)" value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  aria-label="금액 (원)"
                  style={{ ...fieldStyle }} />
                <select value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  aria-label="카테고리"
                  style={{ ...fieldStyle, cursor: 'pointer' }}>
                  {(form.type === 'expense' ? EXP_CATS : INC_CATS).map((c) => (
                    <option key={c} value={c} style={{ background: '#141730' }}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="내용" value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  aria-label="거래 내용"
                  style={{ ...fieldStyle }} />
                <input type="date" value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  aria-label="거래 날짜"
                  style={{ ...fieldStyle }} />
              </div>
              <button onClick={submit}
                className="w-full h-10 rounded-xl transition-colors cursor-pointer"
                style={{ background: '#3182F6', color: '#ffffff', fontSize: 13, fontWeight: 500 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#5c6ecc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#3182F6')}>
                기록하기
              </button>
            </div>
          </div>
        )}

        {/* body */}
        <div className="flex-1 min-h-0 flex" style={{ borderTop: `1px solid ${BORDER}` }}>
          {pieData.length > 0 && (
            <div className="shrink-0 w-44 flex flex-col" style={{ borderRight: `1px solid ${BORDER}` }}>
              <div className="h-44 px-2 pt-4 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" strokeWidth={2} stroke="#141730">
                      {pieData.map((e) => <Cell key={e.name} fill={CAT_COLOR[e.name] ?? '#52525B'} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#222222', border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 12, color: '#F2F2F7', padding: '8px 12px' }}
                      formatter={(v) => [formatKRW(Number(v)), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="pb-5 space-y-3" style={{ padding: '0 20px 20px' }}>
                {pieData.slice(0, 5).map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CAT_COLOR[d.name] ?? '#52525B' }} />
                      <span style={{ fontSize: 12, color: '#8E8E93' }} className="truncate">{d.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#636366' }}>
                      {expense > 0 ? Math.round(d.value / expense * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* transactions */}
          <div className="flex-1 overflow-y-auto pb-3 flex flex-col">
            <div className="flex items-center justify-between" style={{ padding: '14px 20px 8px' }}>
              <p style={{ fontSize: 11, color: '#8E8E93' }}>
                {dayLabel}
                <span style={{ color: '#636366', marginLeft: 6 }}>· {dayTxns.length}건</span>
              </p>
            </div>
            {isLoading ? (
              <div className="px-5 py-4 space-y-4">
                {[...Array(4)].map((_, i) => (
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
            ) : dayTxns.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-2">
                <p style={{ fontFamily: PIXEL, fontSize: '12px', color: '#636366' }}>이 날짜에 내역 없음</p>
              </div>
            ) : (
              dayTxns.map((t, i) => (
                <div key={t.id}
                  className={cn('flex items-center gap-4 px-5 py-4 group transition-colors', i < dayTxns.length - 1 && 'border-b')}
                  style={{ borderColor: BORDER }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
                    style={{ background: `${CAT_COLOR[t.category] ?? '#52525B'}25` }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: CAT_COLOR[t.category] ?? '#52525B' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 13, color: '#AEAEB2', fontWeight: 500 }} className="truncate leading-snug">{t.description}</p>
                    <p style={{ fontSize: 11, color: '#636366', marginTop: 2 }}>
                      {t.category}<span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>{formatDate(t.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p style={{ fontSize: 14, fontWeight: 600, color: t.type === 'income' ? '#05D686' : '#F2F2F7' }}>
                      {t.type === 'income' ? '+' : '-'}{formatKRW(t.amount)}
                    </p>
                    <button onClick={() => deleteTransaction.mutate(t.id)}
                      aria-label={`'${t.description}' 거래 삭제`}
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 transition-all cursor-pointer rounded-lg"
                      style={{ color: '#636366' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#FF453A')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#636366')}>
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
