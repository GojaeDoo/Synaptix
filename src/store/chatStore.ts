import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { uid } from '@/lib/uid'
import type { ChatMessage } from '@/types'

interface ChatStore {
  messages: ChatMessage[]
  isOpen: boolean
  isLoading: boolean
  addMessage: (m: Pick<ChatMessage, 'role' | 'content'>) => void
  setLoading: (v: boolean) => void
  toggleChat: () => void
  clearMessages: () => void
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '안녕하세요! Synaptix AI 비서입니다.\n위젯 제어·할일·가계부 관리는 물론, 내 데이터 분석과 일반적인 질문까지 도와드려요.\n\n예시: "이번 달 지출 분석해줘", "내일 회의 할일 추가해줘", "오늘 점심 메뉴 추천해줘"',
  timestamp: new Date(),
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [WELCOME],
      isOpen: false,
      isLoading: false,
      addMessage: (m) =>
        set((s) => ({
          messages: [...s.messages, { ...m, id: uid(), timestamp: new Date() }],
        })),
      setLoading: (v) => set({ isLoading: v }),
      toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),
      clearMessages: () => set({ messages: [{ ...WELCOME, timestamp: new Date() }] }),
    }),
    {
      name: 'synaptix-chat',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ messages: state.messages }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.messages = state.messages.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        }
      },
    }
  )
)
