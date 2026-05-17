import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useDemoStore } from '@/store/demoStore'
import type { Transaction } from '@/types'

// useTodos와 동일 패턴: 로그인 시 Supabase, 비로그인 시 데모 스토어로 라우팅.
export function useTransactions() {
  const { session } = useAuth()
  const qc = useQueryClient()

  const demoTxns = useDemoStore((s) => s.transactions)
  const demoAdd = useDemoStore((s) => s.addTransaction)
  const demoDelete = useDemoStore((s) => s.deleteTransaction)

  const supabaseQuery = useQuery({
    queryKey: ['transactions', session?.user?.id ?? 'anon'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as Transaction[]
    },
    enabled: !!session,
  })

  const addTransaction = useMutation({
    mutationFn: async (t: Omit<Transaction, 'id' | 'created_at'>) => {
      if (!session) return demoAdd(t)
      const { error } = await supabase.from('transactions').insert(t)
      if (error) throw error
    },
    onSuccess: () => {
      if (session) qc.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      if (!session) return demoDelete(id)
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      if (session) qc.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  return {
    data: session ? supabaseQuery.data : demoTxns,
    isLoading: session ? supabaseQuery.isLoading : false,
    isError: session ? supabaseQuery.isError : false,
    error: session ? supabaseQuery.error : null,
    addTransaction,
    deleteTransaction,
  }
}
