import type { Place, PlaceLocation } from '@/types'

// 장소 위젯의 순수 변환/필터 로직 — UI/네트워크와 분리해 단위 테스트가 가능하도록 모았다.
// 카카오 응답 매핑, 카테고리/거리 표시 포맷, 데모 모드 mock 검색이 여기 산다.

// 카카오 로컬 키워드 검색 응답의 document 한 건.
// 좌표 x/y는 문자열로 내려온다(x=경도, y=위도).
export interface KakaoPlaceDocument {
  id: string
  place_name: string
  category_name: string
  category_group_name?: string
  phone?: string
  address_name: string
  road_address_name?: string
  x: string
  y: string
  place_url?: string
  distance?: string
}

interface KakaoSearchResponse {
  documents?: KakaoPlaceDocument[]
}

// "음식점 > 한식 > 국밥" 처럼 '>'로 구분된 카테고리에서 가장 구체적인 끝 항목만 취한다.
export function formatCategory(categoryName: string): string {
  const parts = categoryName
    .split('>')
    .map((s) => s.trim())
    .filter(Boolean)
  return parts[parts.length - 1] ?? ''
}

// 미터 단위 거리를 사람이 읽기 좋은 문자열로. null이면 빈 문자열.
export function formatDistance(meters: number | null): string {
  if (meters == null || !Number.isFinite(meters)) return ''
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

// 카카오 document → 앱 도메인 Place. 좌표 문자열을 숫자로, 도로명 주소를 우선 사용.
export function mapKakaoPlace(d: KakaoPlaceDocument): Place {
  return {
    id: d.id,
    name: d.place_name,
    address: d.road_address_name || d.address_name,
    lat: Number(d.y),
    lng: Number(d.x),
    category: d.category_group_name || formatCategory(d.category_name),
    phone: d.phone ? d.phone : null,
    url: d.place_url ? d.place_url : null,
    distance: d.distance ? Number(d.distance) : null,
  }
}

export function mapKakaoResponse(res: KakaoSearchResponse): Place[] {
  return (res.documents ?? []).map(mapKakaoPlace)
}

// 검색 결과 Place → 일정에 첨부할 PlaceLocation(표시 메타는 떼어낸다).
export function toLocation(p: Place): PlaceLocation {
  return {
    name: p.name,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    category: p.category || undefined,
    url: p.url,
  }
}

// 데모 모드(키 미설정)에서 보여줄 서울 데이트/식사 코스 샘플.
export const MOCK_PLACES: Place[] = [
  { id: 'm1', name: '광장시장 먹자골목', address: '서울 종로구 창경궁로 88', lat: 37.5701, lng: 126.9997, category: '음식점', phone: null, url: null, distance: null },
  { id: 'm2', name: '연남동 경의선숲길', address: '서울 마포구 연남동 388-25', lat: 37.5604, lng: 126.9255, category: '공원', phone: null, url: null, distance: null },
  { id: 'm3', name: '북촌 한옥마을', address: '서울 종로구 계동길 37', lat: 37.5826, lng: 126.9850, category: '관광명소', phone: null, url: null, distance: null },
  { id: 'm4', name: '성수동 카페거리', address: '서울 성동구 성수이로 87', lat: 37.5446, lng: 127.0560, category: '카페', phone: null, url: null, distance: null },
  { id: 'm5', name: '한강 반포 달빛무지개분수', address: '서울 서초구 신반포로11길 40', lat: 37.5130, lng: 126.9956, category: '관광명소', phone: null, url: null, distance: null },
  { id: 'm6', name: '망원시장', address: '서울 마포구 망원로8길 14', lat: 37.5560, lng: 126.9018, category: '음식점', phone: null, url: null, distance: null },
]

// 데모 모드 검색. 이름/카테고리/주소에 검색어가 들어가면 매칭.
// 빈 검색어이거나 매칭이 없으면 전체를 돌려줘 화면이 비지 않게 한다.
export function searchMockPlaces(query: string, source: Place[] = MOCK_PLACES): Place[] {
  const q = query.trim().toLowerCase()
  if (!q) return source
  const hits = source.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q),
  )
  return hits.length ? hits : source
}
