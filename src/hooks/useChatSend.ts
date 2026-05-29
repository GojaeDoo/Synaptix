import { useCallback } from 'react'
import { chatCompletion, buildSystemPrompt, CHAT_TOOLS, type ChatMessageBody } from '@/lib/openai'
import { useChatStore } from '@/store/chatStore'
import { executeTool } from '@/lib/chatTools'
import { useAuth } from '@/hooks/useAuth'

const MAX_TOOL_ITERATIONS = 5

// 무료 모델(Gemini Flash)의 토큰 비용을 제한하기 위해 API로 보내는 대화 히스토리를
// 최근 N개로 캡한다. 화면에는 전체가 남지만 모델 컨텍스트에는 최근 맥락만 전달된다.
const MAX_HISTORY = 20

export function useChatSend() {
  const { addMessage, setLoading, isLoading } = useChatStore()
  const { session } = useAuth()

  const send = useCallback(async (text: string): Promise<boolean> => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return false

    addMessage({ role: 'user', content: trimmed })

    setLoading(true)
    try {
      const history: ChatMessageBody[] = useChatStore.getState().messages
        .slice(-MAX_HISTORY)
        .map((m) => ({
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
