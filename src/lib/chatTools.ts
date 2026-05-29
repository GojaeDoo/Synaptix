import { z } from 'zod'
import { useWidgetStore } from '@/store/widgetStore'
import { useDemoStore } from '@/store/demoStore'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { fetchWeatherSmart, fetchStockQuote, searchPlaces, ConfigError } from '@/lib/api'
import { searchMockPlaces } from '@/lib/places'
import type { Session } from '@supabase/supabase-js'
import type { Todo, Transaction, Place } from '@/types'

// AI 채팅의 tool 라우팅 로직 — React 훅(useChatSend)에서 분리해 단위 테스트가 가능하도록 모았다.
// LLM이 spec과 다른 인자를 줄 수 있으므로 모든 경계에서 Zod 런타임 검증을 거치고,
// 실패 시 throw 대신 tool error 메시지로 돌려 LLM이 사용자에게 재질문하도록 유도한다.

const WidgetKeySchema = z.enum(['weather', 'stocks', 'news', 'calendar', 'budget', 'places'])

// search_place가 돌려준 좌표를 그대로 받아 일정에 첨부한다.
const PlaceLocationSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().max(200).optional(),
  lat: z.number().finite(),
  lng: z.number().finite(),
  category: z.string().max(50).optional(),
  url: z.string().max(400).optional().nullable(),
})

export const ToolSchemas = {
  set_widget_visibility: z.object({
    widget: WidgetKeySchema,
    visible: z.boolean(),
  }),
  add_todo: z.object({
    title: z.string().min(1).max(200),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    location: PlaceLocationSchema.optional(),
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
  search_place: z.object({
    query: z.string().min(1).max(50),
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

export type ToolName = keyof typeof ToolSchemas

// search_place 결과/일정 첨부 시 LLM·UI에 돌려줄 축약 형태.
function slimPlace(p: Place) {
  return {
    id: p.id,
    name: p.name,
    address: p.address,
    category: p.category,
    lat: p.lat,
    lng: p.lng,
    phone: p.phone,
    url: p.url,
  }
}

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

export async function executeTool(
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
        priority: a.priority ?? ('medium' as const),
        location: a.location
          ? {
              name: a.location.name,
              address: a.location.address ?? '',
              lat: a.location.lat,
              lng: a.location.lng,
              category: a.location.category,
              url: a.location.url ?? null,
            }
          : null,
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
    case 'search_place': {
      const a = args as z.infer<typeof ToolSchemas.search_place>
      try {
        const places = await searchPlaces(a.query)
        return { success: true, count: places.length, places: places.slice(0, 8).map(slimPlace) }
      } catch (e) {
        // 서버에 Kakao 키가 없으면 mock 장소로 폴백(검색 위젯과 동일 정책).
        if (e instanceof ConfigError) {
          const places = searchMockPlaces(a.query)
          return { success: true, demo: true, count: places.length, places: places.slice(0, 8).map(slimPlace) }
        }
        return { success: false, error: e instanceof Error ? e.message : '장소 검색 실패' }
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
