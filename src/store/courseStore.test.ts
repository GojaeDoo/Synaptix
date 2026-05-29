import { describe, it, expect, beforeEach } from 'vitest'
import { useCourseStore } from './courseStore'
import type { PlaceLocation } from '@/types'

function loc(name: string): PlaceLocation {
  return { name, address: `${name} 주소`, lat: 37.5, lng: 127, category: '카페', url: null }
}

beforeEach(() => {
  useCourseStore.getState().clear()
})

describe('courseStore.addStop', () => {
  it('첫 stop은 14:00–15:00 기본 블록으로 추가된다', () => {
    useCourseStore.getState().addStop(loc('A'))
    const [s] = useCourseStore.getState().stops
    expect(s.startTime).toBe('14:00')
    expect(s.endTime).toBe('15:00')
    expect(s.location.name).toBe('A')
  })

  it('다음 stop은 직전 stop의 끝시각을 이어받는다', () => {
    const { addStop } = useCourseStore.getState()
    addStop(loc('A'))
    addStop(loc('B'))
    const stops = useCourseStore.getState().stops
    expect(stops[1].startTime).toBe('15:00')
    expect(stops[1].endTime).toBe('16:00')
  })

  it('메모를 함께 받을 수 있다', () => {
    useCourseStore.getState().addStop(loc('A'), '카페')
    expect(useCourseStore.getState().stops[0].memo).toBe('카페')
  })
})

describe('courseStore.reorderStops', () => {
  beforeEach(() => {
    const { addStop } = useCourseStore.getState()
    addStop(loc('A'))
    addStop(loc('B'))
    addStop(loc('C'))
  })

  it('stop을 위로 이동한다', () => {
    useCourseStore.getState().reorderStops(2, 0)
    expect(useCourseStore.getState().stops.map((s) => s.location.name)).toEqual(['C', 'A', 'B'])
  })

  it('범위를 벗어난 인덱스는 무시한다', () => {
    useCourseStore.getState().reorderStops(0, 9)
    expect(useCourseStore.getState().stops.map((s) => s.location.name)).toEqual(['A', 'B', 'C'])
  })
})

describe('courseStore.updateStop / removeStop / clear', () => {
  it('stop의 시간·메모를 수정한다', () => {
    useCourseStore.getState().addStop(loc('A'))
    const id = useCourseStore.getState().stops[0].id
    useCourseStore.getState().updateStop(id, { startTime: '10:00', memo: '브런치' })
    const s = useCourseStore.getState().stops[0]
    expect(s.startTime).toBe('10:00')
    expect(s.memo).toBe('브런치')
  })

  it('stop을 삭제하고 코스를 비운다', () => {
    const { addStop } = useCourseStore.getState()
    addStop(loc('A'))
    addStop(loc('B'))
    const id = useCourseStore.getState().stops[0].id
    useCourseStore.getState().removeStop(id)
    expect(useCourseStore.getState().stops.map((s) => s.location.name)).toEqual(['B'])
    useCourseStore.getState().clear()
    expect(useCourseStore.getState().stops).toHaveLength(0)
    expect(useCourseStore.getState().title).toBe('우리 코스')
  })
})
