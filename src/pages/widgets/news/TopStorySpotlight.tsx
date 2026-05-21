import { ExternalLink, MessageSquare, TrendingUp, Clock } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import type { EnrichedArticle } from '@/lib/news'
import { ACCENT } from './constants'

// 최고 점수 스토리를 강조하는 스포트라이트 배너.
export function TopStorySpotlight({ story }: { story: EnrichedArticle }) {
  return (
    <a
      href={story.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl p-5 mb-5 transition-colors group"
      style={{
        background: 'linear-gradient(135deg, rgba(255,102,0,0.12) 0%, rgba(255,102,0,0.04) 100%)',
        border: '1px solid rgba(255,102,0,0.25)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: ACCENT }}>
          ★ 최고 인기
        </span>
        <span className="flex items-center gap-1 text-[11px]" style={{ color: '#FFB74D' }}>
          <TrendingUp size={11} />
          {story.score}
        </span>
        <span className="flex items-center gap-1 text-[11px]" style={{ color: '#60A5FA' }}>
          <MessageSquare size={11} />
          {story.comments}
        </span>
      </div>
      <p
        className="text-[16px] sm:text-[18px] font-medium leading-snug mb-2 group-hover:text-white transition-colors"
        style={{ color: '#F2F2F7' }}
      >
        {story.title}
      </p>
      <div className="flex items-center gap-2 text-[12px]" style={{ color: '#8E8E93' }}>
        <Clock size={11} />
        <span>{timeAgo(story.publishedAt)}</span>
        <ExternalLink size={11} className="ml-auto" />
      </div>
    </a>
  )
}
