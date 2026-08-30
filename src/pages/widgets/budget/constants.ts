import type { CSSProperties } from 'react'

// BudgetDetail 하위 컴포넌트들이 공유하는 디자인 토큰/카테고리 상수.
export const CARD_BG = '#1A1A1A'
export const BORDER = 'rgba(255,255,255,0.07)'

export const CAT_COLOR: Record<string, string> = {
  식비: '#FF6B6B',
  교통: '#FFD93D',
  쇼핑: '#C084FC',
  '문화/여가': '#60A5FA',
  통신: '#34D399',
  의료: '#FB923C',
  급여: '#4ADE80',
  부수입: '#A3E635',
  기타: '#52525B',
}

export const DEFAULT_EXP_CATS = ['식비', '교통', '쇼핑', '문화/여가', '통신', '의료', '기타']
export const DEFAULT_INC_CATS = ['급여', '부수입', '기타']

// 사용자가 직접 추가한 카테고리는 CAT_COLOR에 없으므로, 이름을 해시해 고정 색을 배정한다.
const FALLBACK_COLORS = ['#3182F6', '#F59E0B', '#EC4899', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4']

export function getCategoryColor(category: string): string {
  if (CAT_COLOR[category]) return CAT_COLOR[category]
  let hash = 0
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length]
}

export interface TxFormValues {
  type: 'income' | 'expense'
  amount: string
  category: string
  description: string
  date: string
}

export const fieldStyle: CSSProperties = {
  width: '100%',
  height: 38,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '0 12px',
  fontSize: 13,
  color: '#F2F2F7',
  outline: 'none',
}
