import { X } from 'lucide-react'
import { formatKRW, formatDate } from '@/lib/utils'
import type { Transaction } from '@/types'
import { CARD_BG, BORDER } from './constants'

interface Props {
  transaction: Transaction
  onClose: () => void
  onConfirm: () => void
}

export function DeleteTransactionModal({ transaction, onClose, onConfirm }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
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
        <div className="px-5 py-5">
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#AEAEB2' }}>
            이 거래 내역을 삭제하시겠어요? 되돌릴 수 없습니다.
          </p>
          <div
            className="rounded-xl p-3.5 mb-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <p className="text-[14px] font-medium truncate" style={{ color: '#F2F2F7' }}>
                {transaction.description}
              </p>
              <p
                className="text-[14px] font-semibold tabular-nums shrink-0"
                style={{ color: transaction.type === 'income' ? '#05D686' : '#F2F2F7' }}
              >
                {transaction.type === 'income' ? '+' : '-'}
                {formatKRW(transaction.amount)}
              </p>
            </div>
            <p className="text-[12px]" style={{ color: '#8E8E93' }}>
              {transaction.category}
              <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
              {formatDate(transaction.date)}
            </p>
          </div>
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
            onClick={onConfirm}
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
  )
}
