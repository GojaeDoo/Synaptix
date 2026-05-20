import { useCallback } from 'react'
import { z } from 'zod'
import { chatCompletion, buildSystemPrompt, CHAT_TOOLS, type ChatMessageBody } from '@/lib/openai'
import { useChatStore } from '@/store/chatStore'
import { useWidgetStore } from '@/store/widgetStore'
import { useDemoStore } from '@/store/demoStore'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { fetchWeatherSmart, fetchStockQuote } from '@/lib/api'
import type { Session } from '@supabase/supabase-js'
import type { Todo, Transaction } from '@/types'
import { useAuth } from '@/hooks/useAuth'

// LLM이 spec과 다른 인자를 줄 수 있으므로 런타임 검증.
// 실패 시 throw 대신 tool error 메시지로 돌려 LLM이 사용자에게 재질문하도록 유도.
const WidgetKeySchema = z.enum(['weather', 'stocks', 'news', 'calendar', 'budget'])

const ToolSchemas = {
  set_widget_visibility: z.object({
    widget: WidgetKeySchema,
    visible: z.boolean(),
  }),
  add_todo: z.object({
    title: z.string().min(1).max(200),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),
  add_transaction: z.object({
    amount: z.number().positive().finite(),
    type: z.enum(['income', 'expense']),
    category: z.string().min(1).max(50),
    description: z.string().min(1).max(200),
  }),
  change_weather_city: z.object({
    city: z.string().min(1).max(50),
  }),
  lookup_weather: z.object({
    city: z.string().min(1).max(50),
  }),
  lookup_stock: z.object({
    symbol: z.string().min(1).max(10),
  }),
  query_todos: z.object({
    completed: z.boolean().optional(),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  query_transactions: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    type: z.enum(['income', 'expense']).optional(),
    category: z.string().optional(),
  }),
  update_todo: z.object({
    id: z.string().min(1),
    title: z.string().min(1).max(200).optional(),
    completed: z.boolean().optional(),
    due_date: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),
  delete_todo: z.object({
    id: z.string().min(1),
  }),
  update_transaction: z.object({
    id: z.string().min(1),
    amount: z.number().positive().finite().optional(),
    type: z.enum(['income', 'expense']).optional(),
    category: z.string().min(1).max(50).optional(),
    description: z.string().min(1).max(200).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  delete_transaction: z.object({
    id: z.string().min(1),
  }),
} as const

type ToolName = keyof typeof ToolSchemas

async function fetchTodos(session: Session | null): Promise<Todo[]> {
  if (!session) return useDemoStore.getState().todos
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Todo[]
}

async function fetchTransactions(session: Session | null): Promise<Transaction[]> {
  if (!session) return useDemoStore.getState().transactions
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as Transaction[]
}

async function executeTool(
  name: string,
  rawArgs: unknown,
  session: Session | null,
) {
  const schema = ToolSchemas[name as ToolName]
  if (!schema) return { success: false, error: `Unknown tool: ${name}` }

  const parsed = schema.safeParse(rawArgs)
  if (!parsed.success) {
    return { success: false, error: `Invalid arguments: ${parsed.error.message}` }
  }
  const args = parsed.data
  const ws = useWidgetStore.getState()

  switch (name as ToolName) {
    case 'set_widget_visibility': {
      const a = args as z.infer<typeof ToolSchemas.set_widget_visibility>
      if (a.visible) ws.showWidget(a.widget)
      else ws.hideWidget(a.widget)
      return { success: true }
    }
    case 'add_todo': {
      const a = args as z.infer<typeof ToolSchemas.add_todo>
      const todo = {
        title: a.title,
        completed: false,
        due_date: a.due_date ?? null,
        priority: a.priority ?? 'medium' as const,
      }
      if (!session) {
        useDemoStore.getState().addTodo(todo)
        return { success: true }
      }
      const { error } = await supabase.from('todos').insert(todo)
      if (error) { console.error('[chat.add_todo]', error); return { success: false, error: error.message } }
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      return { success: true }
    }
    case 'add_transaction': {
      const a = args as z.infer<typeof ToolSchemas.add_transaction>
      const tx = {
        amount: a.amount,
        type: a.type,
        category: a.category,
        description: a.description,
        date: new Date().toISOString().split('T')[0],
      }
      if (!session) {
        useDemoStore.getState().addTransaction(tx)
        return { success: true }
      }
      const { error } = await supabase.from('transactions').insert(tx)
      if (error) { console.error('[chat.add_transaction]', error); return { success: false, error: error.message } }
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      return { success: true }
    }
    case 'change_weather_city': {
      const a = args as z.infer<typeof ToolSchemas.change_weather_city>
      ws.updateSettings({ weatherCity: a.city })
      queryClient.invalidateQueries({ queryKey: ['weather'] })
      return { success: true }
    }
    case 'lookup_weather': {
      const a = args as z.infer<typeof ToolSchemas.lookup_weather>
      try {
        const w = await fetchWeatherSmart(a.city)
        return {
          success: true,
          weather: {
            city: w.city,
            temp: w.temp,
            feelsLike: w.feelsLike,
            description: w.description,
            humidity: w.humidity,
            windSpeed: w.windSpeed,
          },
        }
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : '날씨 조회 실패' }
      }
    }
    case 'lookup_stock': {
      const a = args as z.infer<typeof ToolSchemas.lookup_stock>
      try {
        const q = await fetchStockQuote(a.symbol.toUpperCase())
        return {
          success: true,
          stock: {
            symbol: q.symbol,
            name: q.name,
            price: q.price,
            change: q.change,
            changePercent: q.changePercent,
            high: q.high,
            low: q.low,
            prevClose: q.prevClose,
          },
        }
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : '주식 조회 실패' }
      }
    }
    case 'query_todos': {
      const a = args as z.infer<typeof ToolSchemas.query_todos>
      try {
        let todos = await fetchTodos(session)
        if (typeof a.completed === 'boolean') {
          todos = todos.filter((t) => t.completed === a.completed)
        }
        if (a.due_date) {
          todos = todos.filter((t) => t.due_date === a.due_date)
        }
        return {
          success: true,
          count: todos.length,
          todos: todos.slice(0, 30).map((t) => ({
            id: t.id,
            title: t.title,
            completed: t.completed,
            due_date: t.due_date,
            priority: t.priority,
          })),
        }
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : '할일 조회 실패' }
      }
    }
    case 'query_transactions': {
      const a = args as z.infer<typeof ToolSchemas.query_transactions>
      try {
        let txns = await fetchTransactions(session)
        if (a.month) txns = txns.filter((t) => t.date.startsWith(a.month!))
        if (a.type) txns = txns.filter((t) => t.type === a.type)
        if (a.category) txns = txns.filter((t) => t.category === a.category)
        const income = txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const expense = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        return {
          success: true,
          count: txns.length,
          summary: { income, expense, balance: income - expense },
          transactions: txns.slice(0, 30).map((t) => ({
            id: t.id,
            amount: t.amount,
            type: t.type,
            category: t.category,
            description: t.description,
            date: t.date,
          })),
        }
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : '거래 조회 실패' }
      }
    }
    case 'update_todo': {
      const a = args as z.infer<typeof ToolSchemas.update_todo>
      const { id, ...rest } = a
      const patch: Partial<Omit<Todo, 'id' | 'created_at'>> = {}
      if (rest.title !== undefined) patch.title = rest.title
      if (rest.completed !== undefined) patch.completed = rest.completed
      if (rest.due_date !== undefined) patch.due_date = rest.due_date === '' ? null : rest.due_date
      if (rest.priority !== undefined) patch.priority = rest.priority
      if (Object.keys(patch).length === 0) {
        return { success: false, error: '수정할 필드가 없습니다' }
      }
      if (!session) {
        useDemoStore.getState().updateTodo({ id, patch })
        return { success: true }
      }
      const { error } = await supabase.from('todos').update(patch).eq('id', id)
      if (error) { console.error('[chat.update_todo]', error); return { success: false, error: error.message } }
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      return { success: true }
    }
    case 'delete_todo': {
      const a = args as z.infer<typeof ToolSchemas.delete_todo>
      if (!session) {
        useDemoStore.getState().deleteTodo(a.id)
        return { success: true }
      }
      const { error } = await supabase.from('todos').delete().eq('id', a.id)
      if (error) { console.error('[chat.delete_todo]', error); return { success: false, error: error.message } }
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      return { success: true }
    }
    case 'update_transaction': {
      const a = args as z.infer<typeof ToolSchemas.update_transaction>
      const { id, ...rest } = a
      const patch: Partial<Omit<Transaction, 'id' | 'created_at'>> = {}
      if (rest.amount !== undefined) patch.amount = rest.amount
      if (rest.type !== undefined) patch.type = rest.type
      if (rest.category !== undefined) patch.category = rest.category
      if (rest.description !== undefined) patch.description = rest.description
      if (rest.date !== undefined) patch.date = rest.date
      if (Object.keys(patch).length === 0) {
        return { success: false, error: '수정할 필드가 없습니다' }
      }
      if (!session) {
        useDemoStore.getState().updateTransaction({ id, patch })
        return { success: true }
      }
      const { error } = await supabase.from('transactions').update(patch).eq('id', id)
      if (error) { console.error('[chat.update_transaction]', error); return { success: false, error: error.message } }
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      return { success: true }
    }
    case 'delete_transaction': {
      const a = args as z.infer<typeof ToolSchemas.delete_transaction>
      if (!session) {
        useDemoStore.getState().deleteTransaction(a.id)
        return { success: true }
      }
      const { error } = await supabase.from('transactions').delete().eq('id', a.id)
      if (error) { console.error('[chat.delete_transaction]', error); return { success: false, error: error.message } }
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      return { success: true }
    }
  }
}

const MAX_TOOL_ITERATIONS = 5

export function useChatSend() {
  const { addMessage, setLoading, isLoading } = useChatStore()
  const { session } = useAuth()

  const send = useCallback(async (text: string): Promise<boolean> => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return false

    addMessage({ role: 'user', content: trimmed })

    setLoading(true)
    try {
      const history: ChatMessageBody[] = useChatStore.getState().messages.map((m) => ({
        role: m.role as 'user' | 'assistant', content: m.content,
      }))
      const baseMessages: ChatMessageBody[] = [
        { role: 'system', content: buildSystemPrompt() },
        ...history,
      ]

      // 멀티스텝 도구 호출 루프: query → update/delete 같은 2단계 시나리오 지원.
      // 각 턴에 tools를 계속 넘겨야 LLM이 다음 호출을 결정할 수 있음.
      let choice = await chatCompletion({ messages: baseMessages, tools: CHAT_TOOLS })
      const toolTrail: ChatMessageBody[] = []
      let iter = 0

      while (choice.message.tool_calls?.length && iter < MAX_TOOL_ITERATIONS) {
        const tc = choice.message.tool_calls[0]
        let rawArgs: unknown
        try {
          rawArgs = JSON.parse(tc.function.arguments)
        } catch {
          rawArgs = {}
        }
        const result = await executeTool(tc.function.name, rawArgs, session)
        toolTrail.push(
          { role: 'assistant', content: choice.message.content, tool_calls: choice.message.tool_calls },
          { role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) },
        )
        choice = await chatCompletion({
          messages: [...baseMessages, ...toolTrail],
          tools: CHAT_TOOLS,
        })
        iter++
      }

      addMessage({ role: 'assistant', content: choice.message.content ?? '' })
    } catch (e) {
      addMessage({
        role: 'assistant',
        content: `오류가 발생했습니다.\n${e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.'}`,
      })
    } finally {
      setLoading(false)
    }
    return true
  }, [isLoading, addMessage, setLoading, session])

  return { send }
}
