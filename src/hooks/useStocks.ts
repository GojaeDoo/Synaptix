import { useQueries } from '@tanstack/react-query'
import { fetchStockQuote, ConfigError } from '@/lib/api'
import { mockStocks } from '@/lib/mockData'
import { useWidgetStore } from '@/store/widgetStore'

export function useStocks() {
  const symbols = useWidgetStore((s) => s.settings.stockSymbols)

  const results = useQueries({
    queries: symbols.map((symbol, i) => ({
      queryKey: ['stock', symbol],
      queryFn: async () => {
        try {
          return await fetchStockQuote(symbol)
        } catch (e) {
          if (e instanceof ConfigError) return mockStocks[i] ?? mockStocks[0]
          throw e
        }
      },
      staleTime: 1000 * 60,
    })),
  })

  const stocks = results.map((r) => r.data).filter(Boolean)
  // 첫 종목이 mock 객체와 동일 참조이면 데모 모드로 간주
  const isDemoMode = stocks.length > 0 && (mockStocks as unknown[]).includes(stocks[0])

  return {
    stocks,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    isDemoMode,
    refetch: () => results.forEach((r) => r.refetch()),
  }
}
