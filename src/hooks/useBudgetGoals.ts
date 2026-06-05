import { useState, useCallback } from 'react'

const STORAGE_KEY = 'synaptix-budget-goals'

function load(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function useBudgetGoals() {
  const [goals, setGoals] = useState<Record<string, number>>(load)

  const setGoal = useCallback((category: string, amount: number) => {
    setGoals((prev) => {
      const next = { ...prev, [category]: amount }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removeGoal = useCallback((category: string) => {
    setGoals((prev) => {
      const next = { ...prev }
      delete next[category]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { goals, setGoal, removeGoal }
}
