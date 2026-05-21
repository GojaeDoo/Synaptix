import { describe, it, expect } from 'vitest'
import { groupByDate, overdueCount, visibleTodos, filteredCount, counts, type TodoFilters } from './todos'
import type { Todo } from '@/types'

function todo(over: Partial<Todo> & Pick<Todo, 'id'>): Todo {
  return {
    title: over.title ?? over.id,
    completed: over.completed ?? false,
    due_date: over.due_date ?? null,
    created_at: over.created_at ?? '2020-01-01T00:00:00Z',
    priority: over.priority ?? 'medium',
    ...over,
  }
}

const NO_FILTER: TodoFilters = { search: '', status: 'all', priority: 'all' }

describe('groupByDate', () => {
  it('buckets by due_date and skips undated todos', () => {
    const map = groupByDate([
      todo({ id: 'a', due_date: '2020-06-01' }),
      todo({ id: 'b', due_date: '2020-06-01' }),
      todo({ id: 'c', due_date: null }),
    ])
    expect(map['2020-06-01'].map((t) => t.id)).toEqual(['a', 'b'])
    expect(Object.keys(map)).toEqual(['2020-06-01'])
  })
})

describe('overdueCount', () => {
  const now = new Date('2020-06-15T09:00:00Z')

  it('counts only incomplete todos due before today', () => {
    const todos = [
      todo({ id: 'a', due_date: '2020-06-10' }),                  // overdue
      todo({ id: 'b', due_date: '2020-06-10', completed: true }), // done, ignored
      todo({ id: 'c', due_date: '2020-06-20' }),                  // future
      todo({ id: 'd', due_date: null }),                          // undated
    ]
    expect(overdueCount(todos, now)).toBe(1)
  })
})

describe('visibleTodos', () => {
  const todos = [
    todo({ id: 'a', due_date: '2020-06-15', priority: 'low' }),
    todo({ id: 'b', due_date: '2020-06-15', priority: 'high' }),
    todo({ id: 'c', due_date: '2020-06-15', priority: 'medium', completed: true }),
    todo({ id: 'd', due_date: '2020-06-16', priority: 'high' }),
  ]

  it('keeps the selected date and orders incomplete-first then by priority', () => {
    expect(visibleTodos(todos, '2020-06-15', NO_FILTER).map((t) => t.id)).toEqual(['b', 'a', 'c'])
  })

  it('applies status and priority filters', () => {
    expect(
      visibleTodos(todos, '2020-06-15', { ...NO_FILTER, status: 'done' }).map((t) => t.id),
    ).toEqual(['c'])
    expect(
      visibleTodos(todos, '2020-06-15', { ...NO_FILTER, priority: 'high' }).map((t) => t.id),
    ).toEqual(['b'])
  })
})

describe('filteredCount', () => {
  it('counts across all dates with filters applied', () => {
    const todos = [
      todo({ id: 'a', title: 'buy milk', due_date: '2020-06-15' }),
      todo({ id: 'b', title: 'buy eggs', due_date: '2020-06-16' }),
      todo({ id: 'c', title: 'walk dog', due_date: '2020-06-17' }),
    ]
    expect(filteredCount(todos, { ...NO_FILTER, search: 'buy' })).toBe(2)
  })
})

describe('counts', () => {
  it('totals pending and done', () => {
    const todos = [
      todo({ id: 'a' }),
      todo({ id: 'b', completed: true }),
      todo({ id: 'c', completed: true }),
    ]
    expect(counts(todos)).toEqual({ total: 3, pending: 1, done: 2 })
  })
})
