import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react'
import { Mic, MicOff, Send, Trash2, X } from 'lucide-react'

interface ISpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  start(): void
  stop(): void
  abort(): void
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
}
declare global {
  interface Window {
    SpeechRecognition: { new(): ISpeechRecognition }
    webkitSpeechRecognition: { new(): ISpeechRecognition }
  }
}
import { format } from 'date-fns'
import { useChatStore } from '@/store/chatStore'
import { useChatSend } from '@/hooks/useChatSend'

// 픽셀 도트 웨이브 — 앱의 도트풍 디자인에 맞춘 음성 인식 인디케이터
const DOT_COUNT = 24
// 위치에 따라 파랑 → 보라 → 파랑 그라데이션
const DOT_COLORS = Array.from({ length: DOT_COUNT }, (_, i) => {
  const t = i / (DOT_COUNT - 1)             // 0 ~ 1
  const r = Math.round(49  + t * (130 - 49))
  const g = Math.round(130 - t * (130 - 60))
  const b = Math.round(246 - t * (246 - 220))
  return `rgb(${r},${g},${b})`
})

function PixelDotWave() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 60,
      padding: '0 20px',
    }}>
      {DOT_COLORS.map((color, i) => (
        <div
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: 1,          // 픽셀 느낌의 각진 점
            background: color,
            boxShadow: `0 0 6px ${color}`,
            animation: 'dot-wave 1.3s ease-in-out infinite',
            animationDelay: `${i * 0.055}s`,
          }}
        />
      ))}
    </div>
  )
}

const SUGGESTIONS = ['이번 달 지출 분석해줘', '내일 회의 할일 추가해줘', '서울 날씨 어때?']

const NAV_HEIGHT = 48 // TopNav h-12

// 반응형 AI 채팅 오버레이.
// 모바일: 하단 시트(translateY). 데스크톱(lg+): 우측 드로어(translateX, 네비 아래 도킹).
// 전역(App)에 1회 마운트되며 chatStore.isOpen 으로 열고 닫는다.
export function ChatPanel() {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const transcriptRef = useRef('')
  const isSpeechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )
  const { messages, isOpen, isLoading, toggleChat, clearMessages } = useChatStore()
  const { send: sendChat } = useChatSend()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, isOpen])

  // 모바일 시트는 배경 스크롤을 잠근다. 데스크톱 드로어는 콘텐츠를 계속 쓸 수 있게 잠그지 않는다.
  useEffect(() => {
    document.body.style.overflow = isOpen && !isDesktop ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen, isDesktop])

  // Esc 로 닫기.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') toggleChat() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, toggleChat])

  const send = (text: string) => {
    setInput('')
    void sendChat(text)
  }

  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) return

    setVoiceError(null)
    transcriptRef.current = ''
    setInput('')

    const recognition = new SR()
    recognition.lang = 'ko-KR'
    recognition.interimResults = true
    recognition.continuous = true  // 짧은 침묵에 끊기지 않음

    recognition.onresult = (event: SpeechRecognitionEvent & { results: SpeechRecognitionResultList }) => {
      // continuous 모드: event.results 에 누적된 전체 결과를 합산
      let text = ''
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript
      }
      transcriptRef.current = text
      setInput(text)
    }
    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
      // 자동 전송 없음 — 인풋에 남겨두고 사용자가 확인 후 직접 전송
    }
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false)
      recognitionRef.current = null
      if (event.error === 'no-speech') setVoiceError('말소리가 감지되지 않았어요')
      else if (event.error === 'not-allowed') setVoiceError('마이크 권한을 허용해주세요')
      else if (event.error !== 'aborted') setVoiceError('인식 실패. 다시 시도해주세요')
      setTimeout(() => setVoiceError(null), 3000)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isListening])

  const panelStyle: CSSProperties = isDesktop
    ? {
        position: 'fixed',
        top: NAV_HEIGHT, right: 0, bottom: 0,
        zIndex: 50,
        width: 'min(420px, 100vw)',
        background: '#1A1A1A',
        borderLeft: '1px solid #2C2C2E',
        display: 'flex',
        flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease',
        boxShadow: isOpen ? '-12px 0 40px rgba(0,0,0,0.45)' : 'none',
      }
    : {
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
      }

  return (
    <>
      {/* 백드롭 — 모바일 전용. 데스크톱 드로어는 콘텐츠를 가리지 않도록 스크림을 두지 않는다. */}
      {!isDesktop && (
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
        />
      )}

      {/* 패널 (모바일 시트 / 데스크톱 드로어) */}
      <div style={panelStyle} role="dialog" aria-label="Synaptix AI 채팅" aria-hidden={!isOpen}>
        {/* 드래그 핸들 — 모바일 시트에서만 */}
        {!isDesktop && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#3A3A3C' }} />
          </div>
        )}

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isDesktop ? '16px 20px 14px' : '12px 20px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#30D158' }} />
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
        <div style={{ borderTop: '1px solid #2C2C2E' }}>

          {/* Siri 파동 — 듣는 중일 때만 */}
          {isListening && (
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <PixelDotWave />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 10px' }}>
                <span style={{ fontSize: 12, color: '#8E8E93' }}>듣고 있습니다...</span>
                <span style={{ fontSize: 11, color: '#48484A' }}>버튼을 눌러 완료</span>
              </div>
              {input && (
                <p style={{ margin: '0 20px 12px', fontSize: 13, color: '#636366', lineHeight: 1.6, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                  {input}
                </p>
              )}
            </div>
          )}

          {/* 에러 메시지 */}
          {voiceError && (
            <div style={{ padding: '8px 20px 0' }}>
              <span style={{ fontSize: 12, color: '#FF9F0A' }}>{voiceError}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' }}>
            {isSpeechSupported && (
              <button
                onClick={toggleVoice}
                disabled={isLoading}
                aria-label={isListening ? '음성 인식 완료' : '음성 입력 시작'}
                aria-pressed={isListening}
                style={{
                  background: 'none',
                  border: 'none',
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  color: isListening ? '#3182F6' : '#636366',
                  transition: 'color 0.2s',
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                {isListening
                  ? <MicOff size={17} strokeWidth={2} aria-hidden="true" />
                  : <Mic size={17} strokeWidth={1.8} aria-hidden="true" />
                }
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder={isListening ? '인식 중...' : '메세지를 입력하세요.'}
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
      </div>
    </>
  )
}
