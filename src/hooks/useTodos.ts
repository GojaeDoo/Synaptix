import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useDemoStore } from '@/store/demoStore'
import type { Todo } from '@/types'

// 로그인 시 Supabase, 비로그인 시 데모 스토어(localStorage)로 라우팅.
// 훅의 반환 shape은 동일해서 소비자는 분기를 알 필요 없음.
export function useTodos() {
  const { session } = useAuth()
  const qc = useQueryClient()

  const demoTodos = useDemoStore((s) => s.todos)
  const demoAdd = useDemoStore((s) => s.addTodo)
  const demoToggle = useDemoStore((s) => s.toggleTodo)
  const demoDelete = useDemoStore((s) => s.deleteTodo)

  const supabaseQuery = useQuery({
    queryKey: ['todos', session?.user?.id ?? 'anon'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        console.error('[todos.fetch]', error)
        throw error
      }
      return data as Todo[]
    },
    enabled: !!session,
  })

  const addTodo = useMutation({
    mutationFn: async (t: Omit<Todo, 'id' | 'created_at'>) => {
      if (!session) return demoAdd(t)
      const { error } = await supabase.from('todos').insert(t)
      if (error) throw error
    },
    onSuccess: () => {
      if (session) qc.invalidateQueries({ queryKey: ['todos'] })
    },
    onError: (e) => console.error('[todos.add]', e),
  })

  const toggleTodo = useMutation({
    mutationFn: async (args: { id: string; completed: boolean }) => {
      if (!session) return demoToggle(args)
      const { error } = await supabase.from('todos').update({ completed: args.completed }).eq('id', args.id)
      if (error) throw error
    },
    onSuccess: () => {
      if (session) qc.invalidateQueries({ queryKey: ['todos'] })
    },
    onError: (e) => console.error('[todos.toggle]', e),
  })

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      if (!session) return demoDelete(id)
      const { error } = await supabase.from('todos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      if (session) qc.invalidateQueries({ queryKey: ['todos'] })
    },
    onError: (e) => console.error('[todos.delete]', e),
  })

  return {
    data: session ? supabaseQuery.data : demoTodos,
    isLoading: session ? supabaseQuery.isLoading : false,
    isError: session ? supabaseQuery.isError : false,
    error: session ? supabaseQuery.error : null,
    addTodo,
    toggleTodo,
    deleteTodo,
  }
}
