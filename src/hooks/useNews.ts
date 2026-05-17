import { useQuery } from '@tanstack/react-query'
import { fetchHackerNews } from '@/lib/api'
import { withMockOnAnyError } from '@/lib/queryFallback'
import { mockNews } from '@/lib/mockData'

export function useNews() {
  const q = useQuery({
    queryKey: ['news', 'hackernews'],
    queryFn: () => withMockOnAnyError(() => fetchHackerNews(30), mockNews, 'news'),
    staleTime: 1000 * 60 * 15,
  })
  return {
    ...q,
    isDemoMode: q.data === mockNews,
  }
}
