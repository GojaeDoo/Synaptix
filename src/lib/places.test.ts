import { describe, it, expect } from 'vitest'
import {
  formatCategory,
  formatDistance,
  mapKakaoPlace,
  mapKakaoResponse,
  toLocation,
  searchMockPlaces,
  MOCK_PLACES,
  type KakaoPlaceDocument,
} from './places'

function doc(over: Partial<KakaoPlaceDocument> = {}): KakaoPlaceDocument {
  return {
    id: '1',
    place_name: '스타벅스 성수점',
    category_name: '음식점 > 카페 > 커피전문점 > 스타벅스',
    address_name: '서울 성동구 성수동',
    road_address_name: '서울 성동구 성수이로 100',
    x: '127.0560',
    y: '37.5446',
    place_url: 'http://place.map.kakao.com/1',
    distance: '350',
    ...over,
  }
}

describe('formatCategory', () => {
  it('takes the most specific trailing segment', () => {
    expect(formatCategory('음식점 > 한식 > 국밥')).toBe('국밥')
  })

  it('handles a single segment and trims whitespace', () => {
    expect(formatCategory('카페')).toBe('카페')
    expect(formatCategory('  관광명소  ')).toBe('관광명소')
  })

  it('returns empty string for empty input', () => {
    expect(formatCategory('')).toBe('')
  })
})

describe('formatDistance', () => {
  it('renders meters below 1km', () => {
    expect(formatDistance(350)).toBe('350m')
  })

  it('renders kilometers with one decimal at/above 1km', () => {
    expect(formatDistance(1500)).toBe('1.5km')
    expect(formatDistance(1000)).toBe('1.0km')
  })

  it('returns empty string for null / non-finite', () => {
    expect(formatDistance(null)).toBe('')
    expect(formatDistance(NaN)).toBe('')
  })
})

describe('mapKakaoPlace', () => {
  it('maps a document into a Place with numeric coords', () => {
    const p = mapKakaoPlace(doc())
    expect(p).toEqual({
      id: '1',
      name: '스타벅스 성수점',
      address: '서울 성동구 성수이로 100',
      lat: 37.5446,
      lng: 127.056,
      category: '스타벅스',
      phone: null,
      url: 'http://place.map.kakao.com/1',
      distance: 350,
    })
  })

  it('prefers category_group_name when present', () => {
    expect(mapKakaoPlace(doc({ category_group_name: '카페' })).category).toBe('카페')
  })

  it('falls back to lot address when road address is missing', () => {
    expect(mapKakaoPlace(doc({ road_address_name: '' })).address).toBe('서울 성동구 성수동')
  })

  it('nulls out empty phone/url and missing distance', () => {
    const p = mapKakaoPlace(doc({ phone: '', place_url: '', distance: undefined }))
    expect(p.phone).toBeNull()
    expect(p.url).toBeNull()
    expect(p.distance).toBeNull()
  })
})

describe('mapKakaoResponse', () => {
  it('maps the documents array', () => {
    expect(mapKakaoResponse({ documents: [doc(), doc({ id: '2' })] }).map((p) => p.id)).toEqual(['1', '2'])
  })

  it('returns empty array when documents missing', () => {
    expect(mapKakaoResponse({})).toEqual([])
  })
})

describe('toLocation', () => {
  it('strips display-only meta and keeps the location core', () => {
    const loc = toLocation(mapKakaoPlace(doc()))
    expect(loc).toEqual({
      name: '스타벅스 성수점',
      address: '서울 성동구 성수이로 100',
      lat: 37.5446,
      lng: 127.056,
      category: '스타벅스',
      url: 'http://place.map.kakao.com/1',
    })
  })

  it('drops an empty category to undefined', () => {
    const loc = toLocation(mapKakaoPlace(doc({ category_name: '', category_group_name: '' })))
    expect(loc.category).toBeUndefined()
  })
})

describe('searchMockPlaces', () => {
  it('returns all places for an empty query', () => {
    expect(searchMockPlaces('')).toHaveLength(MOCK_PLACES.length)
    expect(searchMockPlaces('   ')).toHaveLength(MOCK_PLACES.length)
  })

  it('matches by name, category, or address (case-insensitive)', () => {
    expect(searchMockPlaces('카페').map((p) => p.name)).toContain('성수동 카페거리')
    expect(searchMockPlaces('마포').every((p) => p.address.includes('마포'))).toBe(true)
  })

  it('falls back to all places when nothing matches', () => {
    expect(searchMockPlaces('존재하지않는검색어')).toHaveLength(MOCK_PLACES.length)
  })
})
