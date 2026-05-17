import { useQuery } from '@tanstack/react-query'
import { fetchCryptos } from '@/lib/api'
import { withMockOnAnyError } from '@/lib/queryFallback'
import { mockCryptos } from '@/lib/mockData'

export function useCryptos() {
  const q = useQuery({
    queryKey: ['cryptos'],
    queryFn: () => withMockOnAnyError(fetchCryptos, mockCryptos, 'cryptos'),
    staleTime: 1000 * 60,
  })
  return {
    cryptos: q.data ?? [],
    isLoading: q.isLoading,
    isError: q.isError,
    isDemoMode: q.data === mockCryptos,
    refetch: q.refetch,
  }
}
