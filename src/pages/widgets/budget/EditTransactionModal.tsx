import { useState } from 'react'
import { X } from 'lucide-react'
import type { Transaction } from '@/types'
import { CARD_BG, BORDER, EXP_CATS, INC_CATS, fieldStyle, type TxFormValues } from './constants'

interface Props {
  transaction: Transaction
  onClose: () => void
  onSave: (patch: Omit<Transaction, 'id' | 'created_at'>) => void
}

// 거래 수정 모달. 부모가 transaction.id를 key로 마운트하므로 초기 상태가 대상에 맞춰진다.
export function EditTransactionModal({ transaction, onClose, onSave }: Props) {
  const [form, setForm] = useState<TxFormValues>({
    type: transaction.type,
    amount: String(transaction.amount),
    category: transaction.category,
    description: transaction.description,
    date: transaction.date,
  })

  const submit = () => {
    if (!form.amount || !form.description) return
    onSave({
      amount: Number(form.amount),
      type: form.type,
      category: form.category,
      description: form.description,
      date: form.date,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
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
            onClick={onClose}
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
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <div className="flex gap-2 px-5 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl transition-colors cursor-pointer text-[13px] font-medium"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#F2F2F7' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          >
            취소
          </button>
          <button
            onClick={submit}
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
  )
}
