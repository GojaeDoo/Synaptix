import { useMemo, useState } from 'react'
import { Plus, Tags } from 'lucide-react'
import { WidgetDetailLayout } from '@/layouts/WidgetDetailLayout'
import { useTransactions } from '@/hooks/useTransactions'
import { useBudgetRange } from '@/hooks/useBudgetRange'
import { useBudgetGoals } from '@/hooks/useBudgetGoals'
import { cn } from '@/lib/utils'
import { filterByRange, summarize, computeTrend, trendTitle as makeTrendTitle, computePie } from '@/lib/budget'
import { RangePickerBar } from './budget/RangePickerBar'
import { RangePickerPopover } from './budget/RangePickerPopover'
import { TransactionFormCard } from './budget/TransactionFormCard'
import { SummaryCards } from './budget/SummaryCards'
import { BudgetGoals } from './budget/BudgetGoals'
import { BudgetCharts } from './budget/BudgetCharts'
import { TransactionListCard } from './budget/TransactionListCard'
import { EditTransactionModal } from './budget/EditTransactionModal'
import { DeleteTransactionModal } from './budget/DeleteTransactionModal'
import { CategoryManageModal } from './budget/CategoryManageModal'

export function BudgetDetail() {
  const {
    data: txns = [],
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions()
  const range = useBudgetRange()
  const { goals, setGoal, removeGoal } = useBudgetGoals()

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false)

  const rangeTxns = useMemo(() => filterByRange(txns, range.range), [txns, range.range])
  const { income, expense, balance } = useMemo(() => summarize(rangeTxns), [rangeTxns])
  const trendData = useMemo(
    () => computeTrend(txns, range.rangeMode, range.anchor, range.range),
    [txns, range.rangeMode, range.anchor, range.range],
  )
  const pieData = useMemo(() => computePie(rangeTxns), [rangeTxns])

  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of rangeTxns) {
      if (t.type === 'expense') map[t.category] = (map[t.category] ?? 0) + t.amount
    }
    return map
  }, [rangeTxns])
  const trendTitle = makeTrendTitle(range.rangeMode, range.anchor)

  const editingTxn = txns.find((t) => t.id === editingId) ?? null
  const deletingTxn = txns.find((t) => t.id === confirmDeleteId) ?? null

  return (
    <WidgetDetailLayout
      title="가계부"
      kicker="BUDGET"
      subtitle="원하는 기간으로 수입/지출 추이와 거래 내역을 확인"
      accent="#3182F6"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setManageCategoriesOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl transition-all cursor-pointer text-[13px] font-medium bg-[rgba(49,130,246,0.12)] text-[#8E8E93] hover:text-white"
            aria-label="카테고리 관리"
          >
            <Tags size={14} />
            카테고리
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className={cn(
              'flex items-center gap-1.5 h-9 px-3.5 rounded-xl transition-all cursor-pointer text-[13px] font-medium',
              open
                ? 'bg-[#3182F6] text-white'
                : 'bg-[rgba(49,130,246,0.12)] text-[#8E8E93] hover:text-white',
            )}
          >
            <Plus size={14} className={cn('transition-transform', open && 'rotate-45')} />
            {open ? '취소' : '추가'}
          </button>
        </div>
      }
    >
      <RangePickerBar range={range} />

      {open && (
        <TransactionFormCard
          onAdd={(v) => {
            addTransaction.mutate({
              amount: Number(v.amount),
              type: v.type,
              category: v.category,
              description: v.description,
              date: v.date,
            })
            setOpen(false)
          }}
        />
      )}

      <SummaryCards income={income} expense={expense} balance={balance} />
      <BudgetGoals
        spending={spendingByCategory}
        goals={goals}
        onSetGoal={setGoal}
        onRemoveGoal={removeGoal}
      />
      <BudgetCharts trendTitle={trendTitle} trendData={trendData} pieData={pieData} expense={expense} />
      <TransactionListCard
        rangeTxns={rangeTxns}
        isLoading={isLoading}
        onEdit={setEditingId}
        onDelete={setConfirmDeleteId}
      />

      <RangePickerPopover range={range} />

      {editingTxn && (
        <EditTransactionModal
          key={editingTxn.id}
          transaction={editingTxn}
          onClose={() => setEditingId(null)}
          onSave={(patch) => {
            updateTransaction.mutate({ id: editingTxn.id, patch })
            setEditingId(null)
          }}
        />
      )}

      {deletingTxn && (
        <DeleteTransactionModal
          transaction={deletingTxn}
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            deleteTransaction.mutate(deletingTxn.id)
            setConfirmDeleteId(null)
          }}
        />
      )}

      {manageCategoriesOpen && (
        <CategoryManageModal onClose={() => setManageCategoriesOpen(false)} />
      )}
    </WidgetDetailLayout>
  )
}
