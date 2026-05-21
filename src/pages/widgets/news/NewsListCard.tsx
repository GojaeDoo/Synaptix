import { useMemo, useState } from 'react'
import { Search, ExternalLink, MessageSquare, TrendingUp } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { filterAndSort, type EnrichedArticle, type SortMode } from '@/lib/news'
import { CARD_BG, BORDER, ACCENT, fieldStyle } from './constants'

interface Props {
  articles: EnrichedArticle[]
  isLoading: boolean
}

// 검색·정렬 필터 + 스토리 목록. 필터 상태는 이 카드에만 필요해 내부에 둔다.
export function NewsListCard({ articles, isLoading }: Props) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('rank')

  const list = useMemo(() => filterAndSort(articles, search, sort), [articles, search, sort])

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      {/* filter */}
      <div
        className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="relative w-full sm:flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#636366' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목 검색"
            aria-label="기사 제목으로 검색"
            type="search"
            className="w-full"
            style={{ ...fieldStyle, paddingLeft: 32 }}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="sm:w-[150px]"
          style={{ ...fieldStyle, cursor: 'pointer', paddingRight: 8 }}
        >
          <option value="rank" style={{ background: '#141730' }}>HN 랭킹</option>
          <option value="score" style={{ background: '#141730' }}>점수↓</option>
          <option value="comments" style={{ background: '#141730' }}>댓글↓</option>
          <option value="recent" style={{ background: '#141730' }}>최신순</option>
        </select>
      </div>

      {isLoading ? (
        <div className="p-5 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-3 w-1/3 rounded" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[13px]" style={{ color: '#8E8E93' }}>
            조건에 맞는 스토리가 없습니다
          </p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: BORDER }}>
          {list.map((a) => (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 px-5 py-4 transition-colors group"
              style={{ borderColor: BORDER }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                className="text-[13px] font-semibold tabular-nums shrink-0 w-8 pt-0.5"
                style={{ color: a.rank <= 3 ? ACCENT : '#636366' }}
              >
                {String(a.rank).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[14px] leading-snug font-medium group-hover:text-white transition-colors"
                  style={{ color: '#F2F2F7' }}
                >
                  {a.title}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: '#8E8E93' }}>
                  <span className="flex items-center gap-1" style={{ color: '#FFB74D' }}>
                    <TrendingUp size={10} />
                    {a.score}
                  </span>
                  <span className="flex items-center gap-1" style={{ color: '#60A5FA' }}>
                    <MessageSquare size={10} />
                    {a.comments}
                  </span>
                  <span style={{ color: '#48484A' }}>·</span>
                  <span>{timeAgo(a.publishedAt)}</span>
                </div>
              </div>
              <ExternalLink
                size={13}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                style={{ color: '#8E8E93' }}
              />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
