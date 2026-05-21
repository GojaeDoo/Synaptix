import { MessageSquare, TrendingUp } from 'lucide-react'
import type { NewsStats } from '@/lib/news'
import { CARD_BG, BORDER, ACCENT } from './constants'

// 스토리 수 · 총 점수 · 총 댓글 · 최고 점수 4-카드.
export function StatsCards({ stats }: { stats: NewsStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {[
        { label: '스토리', value: stats.count.toString(), color: '#F2F2F7', icon: null },
        { label: '총 점수', value: stats.totalScore.toLocaleString(), color: ACCENT, icon: <TrendingUp size={14} /> },
        { label: '총 댓글', value: stats.totalComments.toLocaleString(), color: '#60A5FA', icon: <MessageSquare size={14} /> },
        {
          label: '최고 점수',
          value: stats.topStory ? `▲${stats.topStory.score}` : '—',
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
  )
}
