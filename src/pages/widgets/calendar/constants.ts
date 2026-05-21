import type { CSSProperties } from 'react'
import type { Todo } from '@/types'

// CalendarDetail 하위 컴포넌트들이 공유하는 디자인 토큰/상수.
export const CARD_BG = '#1A1A1A'
export const BORDER = 'rgba(255,255,255,0.07)'
export const ACCENT = '#3182F6'
export const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

export const PRIORITY_COLOR: Record<Todo['priority'], string> = {
  high: '#FF453A',
  medium: '#FFB74D',
  low: '#60A5FA',
}

export const PRIORITY_LABEL: Record<Todo['priority'], string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

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
