import { useState } from 'react'
import { RefreshCw, ArrowUpRight } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useNews } from '@/hooks/useNews'
import { timeAgo } from '@/lib/utils'

const PIXEL = "'Press Start 2P', monospace"
const BG = 'rgba(38, 38, 38, 0.72)'
const BORDER = 'rgba(255,255,255,0.07)'

function PixelNewspaper({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 40 48" style={{ position: 'absolute', imageRendering: 'pixelated', ...style }}>
      {/* 외곽 테두리 */}
      <rect x="0"  y="0"  width="40" height="3"  fill="white" />
      <rect x="0"  y="45" width="40" height="3"  fill="white" />
      <rect x="0"  y="0"  width="3"  height="48" fill="white" />
      <rect x="37" y="0"  width="3"  height="48" fill="white" />

      {/* 신문 제호 (두꺼운 띠) */}
      <rect x="6"  y="6"  width="28" height="5"  fill="white" />

      {/* 부제목 */}
      <rect x="6"  y="14" width="14" height="2"  fill="white" />

      {/* 사진 영역 (왼쪽 큰 사각형) */}
      <rect x="6"  y="20" width="13" height="13" fill="white" />

      {/* 본문 라인 (오른쪽 컬럼) */}
      <rect x="22" y="20" width="12" height="2"  fill="white" />
      <rect x="22" y="24" width="12" height="2"  fill="white" />
      <rect x="22" y="28" width="12" height="2"  fill="white" />
      <rect x="22" y="32" width="9"  height="2"  fill="white" />

      {/* 아래쪽 본문 (전체 폭) */}
      <rect x="6"  y="37" width="28" height="2"  fill="white" />
      <rect x="6"  y="41" width="20" height="2"  fill="white" />
    </svg>
  )
}

export function NewsWidget() {
  const navigate = useNavigate()
  const { data: articles, isLoading, refetch } = useNews()
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const onRefresh = () => { qc.invalidateQueries({ queryKey: ['news', 'hackernews'] }); refetch() }

  const total = articles?.length ?? 0
  const hasMore = total > 5
  const displayed = expanded ? articles : articles?.slice(0, 5)

  return (
    <div id="widget-news" className="widget-glass h-full rounded-2xl relative overflow-hidden flex flex-col" style={{ background: BG, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <PixelNewspaper style={{ width: 96, height: 116, top: -8, right: -8, opacity: 0.14, transform: 'rotate(-6deg)' }} />

      {/* header */}
      <div className="flex items-center justify-between gap-2 relative z-10 shrink-0" style={{ padding: '14px 18px 10px' }}>
        <button
          onClick={() => navigate('/widgets/news')}
          className="flex items-center gap-1.5 cursor-pointer group min-w-0"
          style={{ background: 'transparent' }}
        >
          <span className="truncate group-hover:text-white transition-colors" style={{ fontFamily: PIXEL, fontSize: '8px', color: '#8E8E93', letterSpacing: '0.1em' }}>
            HACKER NEWS
          </span>
          <ArrowUpRight size={11} className="text-[#636366] group-hover:text-white transition-colors shrink-0" />
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 데스크톱 more 버튼 */}
          {hasMore && (
            <button onClick={() => setExpanded((e) => !e)}
              className="hidden sm:block"
              style={{ fontFamily: PIXEL, fontSize: '6px', color: '#8E8E93', background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, padding: '4px 8px', borderRadius: 4, cursor: 'pointer', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#AEAEB2')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#8E8E93')}
            >
              {expanded ? 'LESS' : `+${total - 5}`}
            </button>
          )}
          <button onClick={onRefresh} aria-label="뉴스 새로고침" style={{ color: '#636366' }}
            className="hover:text-white transition-colors cursor-pointer p-1.5 rounded hover:bg-white/10">
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── 모바일: 3개 컴팩트 ─────────────────── */}
      <div
        className="sm:hidden flex-1 flex flex-col relative z-10 min-h-0 overflow-y-auto"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 shrink-0" style={{ padding: '12px 20px', borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
              <div className="skeleton h-2.5 w-4 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-2.5 w-2/3" />
              </div>
            </div>
          ))
        ) : (
          articles?.slice(0, 3).map((article, i) => (
            <a
              key={i}
              href={article.url !== '#' ? article.url : undefined}
              target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-3 shrink-0 transition-colors"
              style={{ padding: '12px 20px', borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontFamily: PIXEL, fontSize: '10px', color: '#8E8E93', width: 16, flexShrink: 0, marginTop: 2 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <p className="line-clamp-2" style={{ fontSize: '13px', color: '#F2F2F7', lineHeight: 1.45 }}>
                  {article.title}
                </p>
                <p className="truncate" style={{ fontFamily: PIXEL, fontSize: '9px', color: '#8E8E93', marginTop: 5, letterSpacing: '0.04em' }}>
                  {article.source.name.toUpperCase()}
                </p>
              </div>
            </a>
          ))
        )}
      </div>

      {/* ── 데스크톱: 전체 리스트 ──────────────── */}
      <div
        className="hidden sm:flex flex-1 flex-col relative z-10 overflow-y-auto"
        style={{ minHeight: 0, borderTop: `1px solid ${BORDER}` }}
      >
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2 shrink-0" style={{ padding: '12px 24px', borderBottom: `1px solid ${BORDER}` }}>
              <div className="skeleton h-3.5 w-full" />
              <div className="skeleton h-3.5 w-3/4" />
              <div className="skeleton h-2.5 w-28" />
            </div>
          ))
        ) : (
          displayed?.map((article, i, arr) => (
            <a
              key={i}
              href={article.url !== '#' ? article.url : undefined}
              target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-4 shrink-0 transition-colors cursor-pointer"
              style={{
                padding: '12px 20px',
                borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontFamily: PIXEL, fontSize: '8px', color: '#8E8E93', width: 18, flexShrink: 0, marginTop: 4 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <p style={{ fontSize: '13px', color: '#F2F2F7', lineHeight: 1.45 }} className="line-clamp-2">
                  {article.title}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ fontFamily: PIXEL, fontSize: '9px', color: '#8E8E93', letterSpacing: '0.06em' }} className="truncate">
                    {article.source.name.toUpperCase()}
                  </span>
                  <span style={{ width: 2, height: 2, borderRadius: '50%', background: '#636366', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: '#8E8E93' }} className="shrink-0">
                    {timeAgo(article.publishedAt)}
                  </span>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  )
}
