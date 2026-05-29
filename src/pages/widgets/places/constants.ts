import type { CSSProperties } from 'react'

// PlacesDetail 하위 컴포넌트들이 공유하는 디자인 토큰.
export const CARD_BG = '#1A1A1A'
export const BORDER = 'rgba(255,255,255,0.07)'
export const ACCENT = '#00C896' // 장소 위젯 식별색 (날씨=파랑, 뉴스=주황과 구분)

export const fieldStyle: CSSProperties = {
  height: 40,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '0 12px',
  fontSize: 14,
  color: '#F2F2F7',
  outline: 'none',
}

// 카드/위젯에서 빠르게 누를 수 있는 검색 예시.
export const SUGGESTIONS = ['강남 맛집', '데이트 코스', '분위기 좋은 카페', '브런치'] as const
