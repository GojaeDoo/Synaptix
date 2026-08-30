import { useState, useCallback } from 'react'
import { DEFAULT_EXP_CATS, DEFAULT_INC_CATS } from '@/pages/widgets/budget/constants'

const STORAGE_KEY = 'synaptix-budget-categories'

type CategoryType = 'expense' | 'income'
type Categories = Record<CategoryType, string[]>

function load(): Categories {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (parsed) return { expense: parsed.expense ?? DEFAULT_EXP_CATS, income: parsed.income ?? DEFAULT_INC_CATS }
  } catch {
    // fall through to defaults
  }
  return { expense: [...DEFAULT_EXP_CATS], income: [...DEFAULT_INC_CATS] }
}

function save(next: Categories) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

// 가계부 카테고리 목록(기본값 + 사용자 추가/수정분)을 브라우저에 저장.
// 기본 카테고리도 최초 로드 시 이 목록에 씨딩되어, 이후로는 이름 변경/삭제가 모두 가능하다.
export function useCategories() {
  const [categories, setCategories] = useState<Categories>(load)

  const addCategory = useCallback((type: CategoryType, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setCategories((prev) => {
      if (prev[type].includes(trimmed)) return prev
      const next = { ...prev, [type]: [...prev[type], trimmed] }
      save(next)
      return next
    })
  }, [])

  const renameCategory = useCallback((type: CategoryType, oldName: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName) return
    setCategories((prev) => {
      if (prev[type].includes(trimmed)) return prev
      const next = { ...prev, [type]: prev[type].map((c) => (c === oldName ? trimmed : c)) }
      save(next)
      return next
    })
  }, [])

  const removeCategory = useCallback((type: CategoryType, name: string) => {
    setCategories((prev) => {
      const next = { ...prev, [type]: prev[type].filter((c) => c !== name) }
      save(next)
      return next
    })
  }, [])

  return { categories, addCategory, renameCategory, removeCategory }
}
