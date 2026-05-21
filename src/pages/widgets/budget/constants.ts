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

export const EXP_CATS = ['식비', '교통', '쇼핑', '문화/여가', '통신', '의료', '기타']
export const INC_CATS = ['급여', '부수입', '기타']

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
