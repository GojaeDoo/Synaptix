import { useState } from 'react'
import { format } from 'date-fns'
import { CARD_BG, BORDER, EXP_CATS, INC_CATS, fieldStyle, type TxFormValues } from './constants'

// 수입/지출 추가 폼. 열릴 때마다 새로 마운트되므로 초기 상태가 곧 리셋이다.
export function TransactionFormCard({ onAdd }: { onAdd: (values: TxFormValues) => void }) {
  const [form, setForm] = useState<TxFormValues>({
    type: 'expense',
    amount: '',
    category: '식비',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })

  const submit = () => {
    if (!form.amount || !form.description) return
    onAdd(form)
  }

  return (
    <div
      className="mb-6 rounded-2xl overflow-hidden fade-up"
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      <div className="flex" style={{ borderBottom: `1px solid ${BORDER}` }}>
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setForm((f) => ({ ...f, type: t, category: t === 'income' ? '급여' : '식비' }))}
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
  )
}
