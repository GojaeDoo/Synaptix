import { useMemo, useState } from 'react'
import { Search, RefreshCw, ExternalLink, MessageSquare, TrendingUp, Clock } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { WidgetDetailLayout } from '@/layouts/WidgetDetailLayout'
import { useNews } from '@/hooks/useNews'
import { timeAgo } from '@/lib/utils'

const CARD_BG = '#1A1A1A'
const BORDER = 'rgba(255,255,255,0.07)'

type SortMode = 'rank' | 'recent' | 'score' | 'comments'

interface ParsedSource {
  score: number
  comments: number
}

function parseSource(name: string): ParsedSource {
  const score = Number(name.match(/▲(\d+)/)?.[1] ?? 0)
  const comments = Number(name.match(/💬(\d+)/)?.[1] ?? 0)
  return { score, comments }
}

const fieldStyle: React.CSSProperties = {
  height: 38,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '0 12px',
  fontSize: 13,
  color: '#F2F2F7',
  outline: 'none',
}

export function NewsDetail() {
  const qc = useQueryClient()
  const { data: articles, isLoading, refetch } = useNews()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('rank')

  const enriched = useMemo(
    () =>
      (articles ?? []).map((a, i) => ({
        ...a,
        rank: i + 1,
        ...parseSource(a.source.name),
      })),
    [articles]
  )

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    let filtered = enriched
    if (q) filtered = filtered.filter((a) => a.title.toLowerCase().includes(q))
    const sorted = [...filtered]
    switch (sort) {
      case 'recent':
        sorted.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
        break
      case 'score':
        sorted.sort((a, b) => b.score - a.score)
        break
      case 'comments':
        sorted.sort((a, b) => b.comments - a.comments)
        break
      default:
        sorted.sort((a, b) => a.rank - b.rank)
    }
    return sorted
  }, [enriched, search, sort])

  const totalScore = enriched.reduce((s, a) => s + a.score, 0)
  const totalComments = enriched.reduce((s, a) => s + a.comments, 0)
  const topStory = enriched.reduce<typeof enriched[number] | null>(
    (best, a) => (best == null || a.score > best.score ? a : best),
    null
  )

  const onRefresh = () => {
    qc.invalidateQueries({ queryKey: ['news', 'hackernews'] })
    refetch()
  }

  return (
    <WidgetDetailLayout
      title="해커뉴스"
      subtitle="Hacker News 인기 스토리 Top 30"
      accent="#FF6600"
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
      {/* stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: '스토리', value: enriched.length.toString(), color: '#F2F2F7', icon: null },
          { label: '총 점수', value: totalScore.toLocaleString(), color: '#FF6600', icon: <TrendingUp size={14} /> },
          { label: '총 댓글', value: totalComments.toLocaleString(), color: '#60A5FA', icon: <MessageSquare size={14} /> },
          {
            label: '최고 점수',
            value: topStory ? `▲${topStory.score}` : '—',
            color: '#FFB74D',
            icon: <TrendingUp size={14} />,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center gap-1.5 mb-2" style={{ color: s.color }}>
              {s.icon}
              <p className="text-[11px] font-medium" style={{ color: '#8E8E93' }}>{s.label}</p>
            </div>
            <p className="text-[20px] font-semibold tabular-nums" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* top story spotlight */}
      {topStory && (
        <a
          href={topStory.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl p-5 mb-5 transition-colors group"
          style={{
            background: 'linear-gradient(135deg, rgba(255,102,0,0.12) 0%, rgba(255,102,0,0.04) 100%)',
            border: '1px solid rgba(255,102,0,0.25)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: '#FF6600' }}>
              ★ 최고 인기
            </span>
            <span className="flex items-center gap-1 text-[11px]" style={{ color: '#FFB74D' }}>
              <TrendingUp size={11} />
              {topStory.score}
            </span>
            <span className="flex items-center gap-1 text-[11px]" style={{ color: '#60A5FA' }}>
              <MessageSquare size={11} />
              {topStory.comments}
            </span>
          </div>
          <p
            className="text-[16px] sm:text-[18px] font-medium leading-snug mb-2 group-hover:text-white transition-colors"
            style={{ color: '#F2F2F7' }}
          >
            {topStory.title}
          </p>
          <div className="flex items-center gap-2 text-[12px]" style={{ color: '#8E8E93' }}>
            <Clock size={11} />
            <span>{timeAgo(topStory.publishedAt)}</span>
            <ExternalLink size={11} className="ml-auto" />
          </div>
        </a>
      )}

      {/* list */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
      >
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
                  style={{ color: a.rank <= 3 ? '#FF6600' : '#636366' }}
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
    </WidgetDetailLayout>
  )
}
