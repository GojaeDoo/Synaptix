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
  content: '안녕하세요! Synaptix AI입니다.\n위젯 제어, 할일 추가, 지출 기록, 날씨 도시 변경 등을 도와드릴게요.\n\n예시: "날씨 위젯 숨겨줘", "내일 회의 할일 추가해줘", "점심 8000원 식비 기록해줘"',
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
