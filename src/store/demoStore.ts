import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '@/lib/uid'
import type { Todo, Transaction } from '@/types'

// 데모 모드(비로그인)에서 사용자가 추가한 할 일·거래를 브라우저에 저장.
// Supabase 대신 localStorage를 백엔드로 쓰는 셈.
// 로그인하면 이 데이터는 그대로 두고 Supabase로 전환된다(절대 합치지 않음 — 의도 명확).

interface DemoState {
  todos: Todo[]
  transactions: Transaction[]
  addTodo: (input: Omit<Todo, 'id' | 'created_at'>) => void
  toggleTodo: (args: { id: string; completed: boolean }) => void
  updateTodo: (args: { id: string; patch: Partial<Omit<Todo, 'id' | 'created_at'>> }) => void
  deleteTodo: (id: string) => void
  addTransaction: (input: Omit<Transaction, 'id' | 'created_at'>) => void
  updateTransaction: (args: { id: string; patch: Partial<Omit<Transaction, 'id' | 'created_at'>> }) => void
  deleteTransaction: (id: string) => void
  reset: () => void
}

const todayISO = () => new Date().toISOString().slice(0, 10)

// 첫 진입 사용자가 빈 화면 대신 "쓸 만하다"는 느낌을 받도록 약간의 샘플.
// 일자는 오늘 기준 상대값으로 채워서 시간이 지나도 어색하지 않게.
function seedTodos(): Todo[] {
  const now = new Date().toISOString()
  return [
    { id: uid(), title: '포트폴리오 리뷰 다듬기', completed: false, due_date: todayISO(), priority: 'high',   created_at: now },
    { id: uid(), title: 'AI 채팅으로 위젯 숨겨보기',   completed: false, due_date: null,        priority: 'medium', created_at: now },
    { id: uid(), title: '데모 데이터 살펴보기',         completed: true,  due_date: null,        priority: 'low',    created_at: now },
  ]
}

function seedTransactions(): Transaction[] {
  const now = new Date().toISOString()
  const today = todayISO()
  return [
    { id: uid(), amount: 1_800_000, type: 'income',  category: '급여', description: '월급',       date: today, created_at: now },
    { id: uid(), amount: 12_800,    type: 'expense', category: '식비', description: '점심 김치찌개', date: today, created_at: now },
    { id: uid(), amount: 4_500,     type: 'expense', category: '교통', description: '지하철',      date: today, created_at: now },
    { id: uid(), amount: 28_000,    type: 'expense', category: '쇼핑', description: '책 두 권',     date: today, created_at: now },
  ]
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      todos: seedTodos(),
      transactions: seedTransactions(),

      addTodo: (input) =>
        set((s) => ({
          todos: [
            {
              id: uid(),
              title: input.title,
              completed: input.completed ?? false,
              due_date: input.due_date,
              priority: input.priority,
              created_at: new Date().toISOString(),
            },
            ...s.todos,
          ],
        })),

      toggleTodo: ({ id, completed }) =>
        set((s) => ({
          todos: s.todos.map((t) => (t.id === id ? { ...t, completed } : t)),
        })),

      updateTodo: ({ id, patch }) =>
        set((s) => ({
          todos: s.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      deleteTodo: (id) =>
        set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),

      addTransaction: (input) =>
        set((s) => ({
          transactions: [
            {
              id: uid(),
              amount: input.amount,
              type: input.type,
              category: input.category,
              description: input.description,
              date: input.date,
              created_at: new Date().toISOString(),
            },
            ...s.transactions,
          ],
        })),

      updateTransaction: ({ id, patch }) =>
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      deleteTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      reset: () => set({ todos: seedTodos(), transactions: seedTransactions() }),
    }),
    { name: 'synaptix-demo-data' }
  )
)
