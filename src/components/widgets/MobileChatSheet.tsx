import { useState, useRef, useEffect } from 'react'
import { Paperclip, Send, Trash2, X } from 'lucide-react'
import { format } from 'date-fns'
import { useChatStore } from '@/store/chatStore'
import { useChatSend } from '@/hooks/useChatSend'

const SUGGESTIONS = ['날씨 위젯 숨겨줘', '할일 추가해줘', '지출 기록해줘']

export function MobileChatSheet() {
  const [input, setInput] = useState('')
  const { messages, isOpen, isLoading, toggleChat, clearMessages } = useChatStore()
  const { send: sendChat } = useChatSend()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, isOpen])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const send = (text: string) => {
    setInput('')
    void sendChat(text)
  }

  return (
    <>
      {/* 백드롭 — 마우스 사용자용 닫기 영역. 키보드 사용자는 시트 내 X 버튼 사용. */}
      <div
        onClick={toggleChat}
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
        className="lg:hidden"
      />

      {/* 시트 */}
      <div
        style={{
          position: 'fixed',
          left: 0, right: 0, bottom: 0,
          zIndex: 50,
          height: '82dvh',
          background: '#1A1A1A',
          borderRadius: '24px 24px 0 0',
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        className="lg:hidden"
      >
        {/* 드래그 핸들 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#3A3A3C' }} />
        </div>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#30D158',
            }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#F2F2F7' }}>Synaptix AI</span>
            <span style={{ fontSize: 11, color: '#636366' }}>gemini-2.5</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={clearMessages}
              aria-label="대화 기록 지우기"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#636366', padding: 8, borderRadius: 8, display: 'flex' }}
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
            <button
              onClick={toggleChat}
              aria-label="채팅 닫기"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#636366', padding: 8, borderRadius: 8, display: 'flex' }}
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: '#2C2C2E' }} />

        {/* 메시지 목록 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 8px', minHeight: 0 }}>
          {messages.map((msg) => {
            const isBot = msg.role === 'assistant'
            const timeStr = format(msg.timestamp, 'HH:mm')
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isBot ? 'flex-start' : 'flex-end',
                  marginBottom: 24,
                }}
              >
                <div style={{
                  maxWidth: isBot ? '88%' : '82%',
                  padding: '13px 17px',
                  borderRadius: isBot ? '18px 18px 18px 4px' : '18px 4px 18px 18px',
                  background: isBot ? '#2C2C2E' : '#3182F6',
                  color: isBot ? '#F2F2F7' : '#ffffff',
                  fontSize: 15,
                  lineHeight: 1.65,
                  wordBreak: 'break-word',
                }}>
                  {msg.content.split('\n').map((line, i, arr) => (
                    <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: '#636366', marginTop: 6, marginLeft: isBot ? 2 : 0, marginRight: isBot ? 0 : 2 }}>
                  {isBot ? 'Synaptix AI' : 'You'}&nbsp;·&nbsp;{timeStr}
                </p>
              </div>
            )
          })}

          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 24 }}>
              <div style={{ padding: '14px 18px', borderRadius: '18px 18px 18px 4px', background: '#2C2C2E' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%', background: '#636366',
                      animation: 'bounce 1.2s infinite',
                      animationDelay: `${i * 0.18}s`,
                    }} />
                  ))}
                </div>
              </div>
              <p style={{ fontSize: 11, color: '#636366', marginTop: 6, marginLeft: 2 }}>Synaptix AI</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* 제안 칩 */}
        {messages.length === 1 && !isLoading && (
          <div style={{ padding: '0 20px 16px' }}>
            <p style={{ fontSize: 11, color: '#636366', marginBottom: 8 }}>빠른 시작</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  style={{
                    textAlign: 'left',
                    background: '#2C2C2E',
                    border: '1px solid #3A3A3C',
                    borderRadius: 14,
                    padding: '13px 17px',
                    fontSize: 14,
                    color: '#AEAEB2',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#3A3A3C'; e.currentTarget.style.color = '#F2F2F7' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#2C2C2E'; e.currentTarget.style.color = '#AEAEB2' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 입력창 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          borderTop: '1px solid #2C2C2E',
        }}>
          <button
            disabled
            aria-label="파일 첨부 (준비 중)"
            style={{ background: 'none', border: 'none', color: '#636366', cursor: 'not-allowed', display: 'flex', padding: 2 }}
          >
            <Paperclip size={19} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send(input)}
            placeholder="메세지를 입력하세요."
            aria-label="AI에게 보낼 메시지"
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: '#F2F2F7',
              opacity: isLoading ? 0.5 : 1,
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isLoading}
            aria-label="메시지 전송"
            style={{
              background: 'none',
              border: 'none',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              color: input.trim() && !isLoading ? '#3182F6' : '#48484A',
              display: 'flex',
              padding: 2,
              transition: 'color 0.15s',
            }}
          >
            <Send size={19} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  )
}
