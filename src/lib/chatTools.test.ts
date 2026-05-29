import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { executeTool } from './chatTools'
import { useDemoStore } from '@/store/demoStore'
import { useWidgetStore } from '@/store/widgetStore'
import { searchPlaces, ConfigError } from '@/lib/api'
import { MOCK_PLACES } from '@/lib/places'
import type { Place } from '@/types'

// 네트워크 의존 tool(search_place)만 모킹하고, ConfigError 등 나머지는 실제 구현을 유지한다.
vi.mock('@/lib/api', async (orig) => {
  const actual = await orig<typeof import('@/lib/api')>()
  return { ...actual, searchPlaces: vi.fn() }
})

const mockedSearch = searchPlaces as Mock

function place(over: Partial<Place> = {}): Place {
  return {
    id: 'p1', name: '슈퍼말차 성수', address: '서울 성동구 서울숲6길 19',
    lat: 37.5446, lng: 127.056, category: '카페', phone: '02-000-0000',
    url: 'http://place.map.kakao.com/p1', distance: 120, ...over,
  }
}

beforeEach(() => {
  // 데모 스토어를 깨끗한 상태로 — 시드 데이터 영향 제거.
  useDemoStore.setState({ todos: [], transactions: [] })
  useWidgetStore.setState({ visibility: { weather: true, stocks: true, news: true, calendar: true, budget: true, places: true } })
  mockedSearch.mockReset()
})

describe('executeTool — 검증 경계 (LLM은 신뢰할 수 없는 입력)', () => {
  it('알 수 없는 tool 이름은 거부한다', async () => {
    expect(await executeTool('drop_database', {}, null)).toEqual({ success: false, error: 'Unknown tool: drop_database' })
  })

  it('스키마에 안 맞는 인자는 throw 대신 tool error로 회신한다', async () => {
    const r = await executeTool('add_transaction', { amount: -100, type: 'expense', category: '식비', description: 'x' }, null)
    expect(r.success).toBe(false)
    expect(r.error).toContain('Invalid arguments')
  })

  it('add_todo에 좌표 없는 location은 거부한다 (lat/lng 필수)', async () => {
    const r = await executeTool('add_todo', { title: 'x', location: { name: '어딘가', lng: 127 } }, null)
    expect(r.success).toBe(false)
    expect(r.error).toContain('Invalid arguments')
  })
})

describe('executeTool — set_widget_visibility', () => {
  it('places 위젯을 숨기고 다시 표시한다', async () => {
    expect(await executeTool('set_widget_visibility', { widget: 'places', visible: false }, null)).toEqual({ success: true })
    expect(useWidgetStore.getState().visibility.places).toBe(false)

    await executeTool('set_widget_visibility', { widget: 'places', visible: true }, null)
    expect(useWidgetStore.getState().visibility.places).toBe(true)
  })
})

describe('executeTool — add_todo (데모 모드)', () => {
  it('기본 할일을 추가하고 location은 null로 둔다', async () => {
    const r = await executeTool('add_todo', { title: '회의 준비', due_date: '2026-06-01', priority: 'high' }, null)
    expect(r).toEqual({ success: true })
    const todos = useDemoStore.getState().todos
    expect(todos).toHaveLength(1)
    expect(todos[0]).toMatchObject({ title: '회의 준비', due_date: '2026-06-01', priority: 'high', completed: false, location: null })
  })

  it('search_place 좌표가 담긴 location을 일정에 첨부한다', async () => {
    await executeTool('add_todo', {
      title: '광장시장 데이트',
      due_date: '2026-06-07',
      location: { name: '광장시장', address: '서울 종로구', lat: 37.5701, lng: 126.9997, category: '음식점', url: 'http://k.co/1' },
    }, null)
    const todo = useDemoStore.getState().todos[0]
    expect(todo.location).toEqual({ name: '광장시장', address: '서울 종로구', lat: 37.5701, lng: 126.9997, category: '음식점', url: 'http://k.co/1' })
  })
})

describe('executeTool — query_todos (데모 모드)', () => {
  beforeEach(() => {
    useDemoStore.setState({
      todos: [
        { id: 'a', title: '완료됨', completed: true, due_date: '2026-06-01', priority: 'low', created_at: '' },
        { id: 'b', title: '미완료', completed: false, due_date: '2026-06-02', priority: 'medium', created_at: '' },
      ],
      transactions: [],
    })
  })

  it('completed 필터를 적용한다', async () => {
    const r = await executeTool('query_todos', { completed: false }, null)
    expect(r.count).toBe(1)
    expect(r.todos[0].title).toBe('미완료')
  })

  it('due_date 필터를 적용한다', async () => {
    const r = await executeTool('query_todos', { due_date: '2026-06-01' }, null)
    expect(r.count).toBe(1)
    expect(r.todos[0].id).toBe('a')
  })
})

describe('executeTool — search_place', () => {
  it('검색 성공 시 표시 메타를 떼고 좌표 포함 축약 결과를 돌려준다', async () => {
    mockedSearch.mockResolvedValue([place(), place({ id: 'p2', name: '메리노' })])
    const r = await executeTool('search_place', { query: '성수 카페' }, null)
    expect(r.success).toBe(true)
    expect(r.demo).toBeUndefined()
    expect(r.count).toBe(2)
    // slimPlace: distance는 빠지고 lat/lng는 유지
    expect(Object.keys(r.places[0]).sort()).toEqual(['address', 'category', 'id', 'lat', 'lng', 'name', 'phone', 'url'])
    expect(r.places[0].lat).toBe(37.5446)
  })

  it('서버 키 미설정(ConfigError) 시 mock 장소로 폴백하고 demo=true', async () => {
    mockedSearch.mockRejectedValue(new ConfigError())
    const r = await executeTool('search_place', { query: '카페' }, null)
    expect(r.success).toBe(true)
    expect(r.demo).toBe(true)
    expect(r.count).toBeGreaterThan(0)
    expect(r.count).toBeLessThanOrEqual(MOCK_PLACES.length)
  })

  it('그 외 에러는 tool error로 회신한다', async () => {
    mockedSearch.mockRejectedValue(new Error('upstream 500'))
    const r = await executeTool('search_place', { query: '카페' }, null)
    expect(r).toEqual({ success: false, error: 'upstream 500' })
  })
})
