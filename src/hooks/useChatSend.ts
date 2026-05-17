import { useCallback } from 'react'
import { z } from 'zod'
import { chatCompletion, buildSystemPrompt, CHAT_TOOLS, type ChatMessageBody } from '@/lib/openai'
import { useChatStore } from '@/store/chatStore'
import { useWidgetStore } from '@/store/widgetStore'
import { useDemoStore } from '@/store/demoStore'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import type { Session } from '@supabase/supabase-js'
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
} as const

type ToolName = keyof typeof ToolSchemas

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
        priority: a.priority ?? 'medium',
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
  }
}

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
      const choice = await chatCompletion({
        messages: [{ role: 'system', content: buildSystemPrompt() }, ...history],
        tools: CHAT_TOOLS,
      })

      if (choice.message.tool_calls?.length) {
        const tc = choice.message.tool_calls[0]
        // LLM이 보낸 JSON 자체가 깨졌을 수도 있음 — 파싱 실패도 tool error로 전달
        let rawArgs: unknown
        try {
          rawArgs = JSON.parse(tc.function.arguments)
        } catch {
          rawArgs = {}
        }
        const result = await executeTool(tc.function.name, rawArgs, session)
        const choice2 = await chatCompletion({
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            ...history,
            { role: 'assistant', content: choice.message.content, tool_calls: choice.message.tool_calls },
            { role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) },
          ],
        })
        addMessage({ role: 'assistant', content: choice2.message.content ?? '' })
      } else {
        addMessage({ role: 'assistant', content: choice.message.content ?? '' })
      }
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
