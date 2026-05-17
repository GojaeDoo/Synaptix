import { useState, useRef, useEffect } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useChatStore } from '@/store/chatStore'
import { useChatSend } from '@/hooks/useChatSend'
import { cn } from '@/lib/utils'

function PixelBot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 40" className={cn('absolute [image-rendering:pixelated]', className)}>
      <rect x="14" y="0"  width="4"  height="6"  fill="white" />
      <rect x="10" y="2"  width="12" height="4"  fill="white" />
      <rect x="4"  y="8"  width="24" height="20" fill="white" />
      <rect x="0"  y="12" width="4"  height="8"  fill="white" />
      <rect x="28" y="12" width="4"  height="8"  fill="white" />
      <rect x="8"  y="14" width="4"  height="4"  fill="#141730" />
      <rect x="20" y="14" width="4"  height="4"  fill="#141730" />
      <rect x="10" y="22" width="12" height="3"  fill="#141730" />
      <rect x="10" y="30" width="4"  height="10" fill="white" />
      <rect x="18" y="30" width="4"  height="10" fill="white" />
    </svg>
  )
}

const SUGGESTIONS = ['날씨 위젯 숨겨줘', '할일 추가해줘', '지출 기록해줘']

export function ChatbotWidget() {
  const [input, setInput] = useState('')
  const { messages, isLoading, clearMessages } = useChatStore()
  const { send: sendChat } = useChatSend()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const send = (text: string) => {
    setInput('')
    void sendChat(text)
  }

  const canSend = !!input.trim() && !isLoading

  return (
    <div
      id="widget-chat"
      className="widget-glass h-full rounded-2xl relative overflow-hidden flex flex-col bg-[rgba(38,38,38,0.72)] backdrop-blur-xl"
    >
      <PixelBot className="w-11 h-[55px] bottom-20 right-4 opacity-[0.06]" />

      {/* header */}
      <div className="flex items-center justify-between relative z-10 px-5 pt-[18px] pb-3.5 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <div className="w-[7px] h-[7px] rounded-full bg-up" />
          <span className="font-pixel text-[8px] text-t3 tracking-[0.08em]">SYNAPTIX AI</span>
          <span className="text-[11px] text-t4">gemini-2.5</span>
        </div>
        <button
          onClick={clearMessages}
          aria-label="대화 기록 지우기"
          className="flex p-1.5 rounded-lg text-t4 hover:text-t3 transition-colors cursor-pointer"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto relative z-10 px-5 pt-6 pb-2 min-h-0">
        {messages.map((msg) => {
          const isBot = msg.role === 'assistant'
          return (
            <div key={msg.id} className={cn('flex flex-col mb-5', isBot ? 'items-start' : 'items-end')}>
              <div
                className={cn(
                  'px-[15px] py-[11px] text-[14px] leading-[1.65] break-words text-t1',
                  isBot
                    ? 'max-w-[88%] rounded-[16px_16px_16px_4px] bg-white/[0.07] border border-white/[0.07]'
                    : 'max-w-[82%] rounded-[16px_4px_16px_16px] bg-accent'
                )}
              >
                {msg.content.split('\n').map((line, i, arr) => (
                  <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                ))}
              </div>
              <p className={cn('text-[11px] text-t4 mt-[5px]', isBot ? 'ml-0.5' : 'mr-0.5')}>
                {isBot ? 'Synaptix AI' : 'You'}&nbsp;·&nbsp;{format(msg.timestamp, 'HH:mm')}
              </p>
            </div>
          )
        })}

        {isLoading && (
          <div className="flex flex-col items-start mb-5">
            <div className="px-4 py-3 rounded-[16px_16px_16px_4px] bg-white/[0.07] border border-white/[0.07]">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-[7px] h-[7px] rounded-full bg-t3"
                    style={{ animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.18}s` }}
                  />
                ))}
              </div>
            </div>
            <p className="text-[11px] text-t4 mt-[5px] ml-0.5">Synaptix AI</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* suggestions */}
      {messages.length === 1 && !isLoading && (
        <div className="relative z-10 px-5 pb-3.5">
          <p className="font-pixel text-[7px] text-t4 mb-2.5 tracking-[0.06em]">빠른 시작</p>
          <div className="flex flex-col gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="text-left px-3.5 py-2.5 rounded-xl text-[13px] text-t3 bg-white/[0.05] border border-white/[0.07] hover:bg-white/[0.09] hover:text-t1 transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* input */}
      <div className="flex items-center gap-3 relative z-10 px-5 py-3.5 border-t border-white/[0.07]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder="메세지를 입력하세요."
          aria-label="AI에게 보낼 메시지"
          disabled={isLoading}
          className="flex-1 bg-transparent border-none outline-none text-[14px] text-t1 disabled:opacity-50"
        />
        <button
          onClick={() => send(input)}
          disabled={!canSend}
          aria-label="메시지 전송"
          className={cn(
            'flex p-0.5 bg-transparent border-none transition-colors',
            canSend ? 'text-accent cursor-pointer' : 'text-t4 cursor-not-allowed'
          )}
        >
          <Send size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
