import { useQuery } from '@tanstack/react-query'
import { searchPlaces, ConfigError } from '@/lib/api'
import { searchMockPlaces } from '@/lib/places'
import type { Place } from '@/types'

interface SearchResult {
  places: Place[]
  demo: boolean
}

// 장소 키워드 검색. 비어 있지 않은 query에서만 동작한다.
// 서버에 Kakao 키가 없으면(ConfigError) mock 장소로 폴백하고 demo=true로 표시한다.
// (weather/stocks가 키 미설정 시 mock으로 폴백하는 것과 동일한 UX 원칙)
export function usePlaceSearch(query: string, center?: { lat: number; lng: number }) {
  const trimmed = query.trim()
  const q = useQuery<SearchResult>({
    queryKey: ['places', trimmed, center?.lat ?? null, center?.lng ?? null],
    queryFn: async () => {
      try {
        return { places: await searchPlaces(trimmed, center), demo: false }
      } catch (e) {
        if (e instanceof ConfigError) {
          return { places: searchMockPlaces(trimmed), demo: true }
        }
        throw e
      }
    },
    enabled: trimmed.length > 0,
    staleTime: 1000 * 60 * 10,
  })

  return {
    places: q.data?.places ?? [],
    isDemoMode: q.data?.demo ?? false,
    isLoading: q.isLoading && q.fetchStatus !== 'idle',
    isError: q.isError,
    refetch: q.refetch,
  }
}
