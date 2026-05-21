import type { CSSProperties } from 'react'

// NewsDetail 하위 컴포넌트들이 공유하는 디자인 토큰.
export const CARD_BG = '#1A1A1A'
export const BORDER = 'rgba(255,255,255,0.07)'
export const ACCENT = '#FF6600'

export const fieldStyle: CSSProperties = {
  height: 38,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '0 12px',
  fontSize: 13,
  color: '#F2F2F7',
  outline: 'none',
}
