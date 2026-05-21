import { useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { WidgetDetailLayout } from '@/layouts/WidgetDetailLayout'
import { useNews } from '@/hooks/useNews'
import { enrich, computeStats } from '@/lib/news'
import { StatsCards } from './news/StatsCards'
import { TopStorySpotlight } from './news/TopStorySpotlight'
import { NewsListCard } from './news/NewsListCard'
import { ACCENT } from './news/constants'

export function NewsDetail() {
  const qc = useQueryClient()
  const { data: articles, isLoading, refetch } = useNews()

  const enriched = useMemo(() => enrich(articles ?? []), [articles])
  const stats = useMemo(() => computeStats(enriched), [enriched])

  const onRefresh = () => {
    qc.invalidateQueries({ queryKey: ['news', 'hackernews'] })
    refetch()
  }

  return (
    <WidgetDetailLayout
      title="해커뉴스"
      kicker="HACKER NEWS"
      subtitle="Hacker News 인기 스토리 Top 30"
      accent={ACCENT}
      actions={
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] text-[#8E8E93] hover:text-white bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          새로고침
        </button>
      }
    >
      <StatsCards stats={stats} />
      {stats.topStory && <TopStorySpotlight story={stats.topStory} />}
      <NewsListCard articles={enriched} isLoading={isLoading} />
    </WidgetDetailLayout>
  )
}
